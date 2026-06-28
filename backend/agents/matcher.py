import os
import json
from google import genai
from google.genai import types
import PyPDF2
from io import BytesIO
from prompts.prompts import CV_EXTRACTOR_PROMPT, JOB_MATCHER_PROMPT

# Try to get API key from environment
# User will need to set this environment variable: set GEMINI_API_KEY=your_key
# or we can use dotenv in the future
API_KEY = os.environ.get("GEMINI_API_KEY")
MODEL = os.environ.get("GEMINI_MODEL", "gemini-3.5-flash")
PRO_MODEL = os.environ.get("GEMINI_PRO_MODEL", "gemini-3.1-pro-preview")

def get_client():
    if not API_KEY:
        raise ValueError("GEMINI_API_KEY environment variable is not set. Please set it to use the Gemini API.")
    return genai.Client(api_key=API_KEY)

def extract_text_from_file(content: bytes, filename: str) -> str:
    """Extracts text from PDF or TXT bytes."""
    if filename.endswith('.pdf'):
        pdf_reader = PyPDF2.PdfReader(BytesIO(content))
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text() + "\n"
        return text
    elif filename.endswith('.txt'):
        return content.decode('utf-8')
    else:
        # Fallback for docx or other formats if needed later
        return str(content)

def process_cv(content: bytes, filename: str, preference: str = None) -> dict:
    """
    Uses Gemini API to extract structured information from a CV.
    """
    text = extract_text_from_file(content, filename)
    
    preference_text = ""
    if preference:
        preference_text = f"\nCRITICAL INSTRUCTION: The candidate explicitly wants a job matching this description: '{preference}'. Act as an expert career coach. Heavily tailor the extracted 'skills', 'desired_roles', and 'summary' to emphasize any matching experience or potential for this specific role, even if they only have side projects or related fundamentals.\n"

    prompt = CV_EXTRACTOR_PROMPT.format(preference_text=preference_text, text=text)
    
    client = get_client()
    
    response = client.models.generate_content(
        model=PRO_MODEL,
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
        ),
    )
    
    try:
        result = json.loads(response.text)
        return result
    except json.JSONDecodeError:
        raise ValueError("Failed to parse Gemini response as JSON.")

def find_matching_jobs(cv_data: dict, preference: str = None, job_title: str = None, location: str = None, time_filter: str = None) -> list:
    """
    Given parsed CV data, searches for real matching jobs via Google Search Grounding.
    Step 1: Search the web.
    Step 2: Parse into JSON.
    """
    client = get_client()
    
    # 1. Build the search query
    roles_list = []
    if job_title:
        roles_list = [job_title]
    elif cv_data.get('desired_roles'):
        roles_list = cv_data.get('desired_roles', [])[:1] # Just use the top 1 role to avoid complex DDG query
        
    roles_str = f'"{roles_list[0]}"' if roles_list else ""
    if preference and not job_title:
        roles_str = preference
        
    skills_str = " ".join(cv_data.get('skills', [])[:2]) # Top 2 skills
    location_query = f" {location}" if location else ""
    
    # Simplified query
    search_query = f"{roles_str}{location_query} {skills_str} job Vietnam"
    
    time_instruction = ""
    if time_filter == "24h":
        time_instruction = "posted in the past 24 hours"
    elif time_filter == "7d":
        time_instruction = "posted in the past week"
    elif time_filter == "30d":
        time_instruction = "posted in the past month"
        
    grounding_prompt = f"Search Google for: {search_query}. CRITICAL: ONLY find jobs {time_instruction if time_instruction else 'recently posted'}. Return the raw job postings text."
    
    # Use Google Search Grounding to bypass scraping blocks
    try:
        search_response = client.models.generate_content(
            model=MODEL,
            contents=grounding_prompt,
            config=types.GenerateContentConfig(
                tools=[{"google_search": {}}]
            )
        )
        raw_search_text = search_response.text
        print("Successfully retrieved jobs via Google Grounding.")
    except Exception as e:
        print(f"Error fetching from Google Grounding: {e}")
        return []

    # 3. Step 2: Parse to JSON array
    cv_data_str = json.dumps(cv_data, indent=2)
    job_title_filter = job_title if job_title else 'Any role matching CV'
    location_filter = location if location else 'Any location'
    
    parse_prompt = JOB_MATCHER_PROMPT.format(cv_data=cv_data_str,
                                             job_title=job_title_filter,
                                             location=location_filter,
                                             raw_search_text=raw_search_text)
    
    try:
        parse_response = client.models.generate_content(
            model=MODEL,
            contents=parse_prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
            ),
        )
        text = parse_response.text.strip()
        if text.startswith("```json"):
            text = text[7:]
        if text.startswith("```"):
            text = text[3:]
        if text.endswith("```"):
            text = text[:-3]
            
        matches = json.loads(text.strip())
        return matches
    except Exception as e:
        print("Parse failed:", e)
        return []
