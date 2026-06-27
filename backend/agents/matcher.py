import os
import json
from google import genai
from google.genai import types
import PyPDF2
from io import BytesIO

# Try to get API key from environment
# User will need to set this environment variable: set GEMINI_API_KEY=your_key
# or we can use dotenv in the future
API_KEY = os.environ.get("GEMINI_API_KEY")

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

    prompt = f"""
    You are an expert IT Recruiter AI. Please analyze the following CV text and extract the key information in JSON format.
    The JSON should have the following schema:
    {{
        "skills": ["List", "of", "core", "IT", "skills", "frameworks", "languages"],
        "experience_years": 3.5, // Total years of experience as a float
        "desired_roles": ["Frontend Developer", "Fullstack Engineer"], // Guessed from their experience
        "summary": "A short 2-sentence summary of the candidate's profile."
    }}
    {preference_text}
    
    CV Text:
    {text}
    """
    
    client = get_client()
    
    response = client.models.generate_content(
        model='gemini-2.5-pro',
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

def find_matching_jobs(cv_data: dict, preference: str = None, job_title: str = None, location: str = None) -> list:
    """
    Given parsed CV data, searches for real matching jobs via Google Search Grounding.
    Step 1: Search the web.
    Step 2: Parse into JSON.
    """
    client = get_client()
    
    # 1. Build the search query
    roles_str = job_title if job_title else " OR ".join(cv_data.get('desired_roles', []))
    if preference and not job_title:
        roles_str = preference
        
    skills_str = " ".join(cv_data.get('skills', [])[:5]) # Top 5 skills
    location_query = f" {location}" if location else ""
    search_query = f"Tuyển dụng {roles_str}{location_query} {skills_str} site:itviec.com OR site:topcv.vn OR site:linkedin.com/jobs"
    
    # 2. Step 1: Search using Grounding (No JSON mode)
    search_prompt = f"Please search the web for recent job postings matching this query: {search_query}. Return all the details you can find including Job Title, Company, Location, Salary (if any), and the direct URL to the job."
    
    try:
        search_response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=search_prompt,
            config=types.GenerateContentConfig(
                tools=[{"google_search": {}}],
            ),
        )
        raw_search_text = search_response.text
    except Exception as e:
        print("Search failed:", e)
        return []

    # 3. Step 2: Parse to JSON array
    parse_prompt = f"""
    You are an expert AI Job Matcher. 
    Here is a candidate's profile:
    {json.dumps(cv_data, indent=2)}
    
    Candidate's search filters:
    - Job Title Filter: {job_title or 'None'}
    - Location Filter: {location or 'None'}
    
    Here is raw text retrieved from a Google Search for job postings:
    {raw_search_text}
    
    Evaluate the jobs found in the text against the candidate's profile and the search filters (especially verifying if the job title and location match the candidate's preferences).
    Return a JSON array of matches, where each item has:
    {{
        "title": "job title",
        "company": "company name",
        "location": "location",
        "salary": "salary or 'Negotiable'",
        "url": "url (must be a valid link from the text)",
        "source": "Platform name (e.g. ITviec, TopCV)",
        "match_percentage": 85, // integer 0-100 (score higher if it matches the job title/location filters!)
        "match_reason": "Why this job is a good fit (1 sentence)."
    }}
    Only include jobs that have a match_percentage > 40.
    Order by match_percentage descending.
    """
    
    try:
        parse_response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=parse_prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
            ),
        )
        matches = json.loads(parse_response.text)
        return matches
    except Exception as e:
        print("Parse failed:", e)
        return []
