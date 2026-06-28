import os
import json
from google import genai
from google.genai import types
from prompts.prompts import JOB_SCRAPER_PROMPT, MATCH_SCORE_PROMPT

API_KEY = os.environ.get("GEMINI_API_KEY")
MODEL = os.environ.get("GEMINI_MODEL", "gemini-3.5-flash")

def get_client():
    if not API_KEY:
        raise ValueError("GEMINI_API_KEY environment variable is not set. Please set it to use the Gemini API.")
    return genai.Client(api_key=API_KEY)

def scrape_jobs_from_web(desired_roles: list[str], time_filter: str = None) -> list[dict]:
    """
    Searches the web for jobs based on desired roles, 
    then uses Gemini to parse them into structured job data.
    """
    if not desired_roles:
        return []
        
    # Use all desired roles to broaden search
    query_role = " OR ".join([f'"{role}"' for role in desired_roles])
    query = f"({query_role}) job Vietnam"
    
    time_instruction = ""
    if time_filter == "24h":
        time_instruction = "posted in the past 24 hours"
    elif time_filter == "7d":
        time_instruction = "posted in the past week"
    elif time_filter == "30d":
        time_instruction = "posted in the past month"
        
    grounding_prompt = f"Search Google for: {query}. CRITICAL: ONLY find jobs {time_instruction if time_instruction else 'recently posted'}. Return the raw job postings text for at least 30 distinct job listings. Please do your best to fetch as many relevant links and descriptions as possible."
    
    client = get_client()
    
    try:
        search_response = client.models.generate_content(
            model=MODEL,
            contents=grounding_prompt,
            config=types.GenerateContentConfig(
                tools=[{"google_search": {}}]
            )
        )
        raw_text = search_response.text
        print("Successfully retrieved jobs via Google Grounding.")
    except Exception as e:
        print(f"Error fetching from Google Grounding: {e}")
        return []
    
    prompt = JOB_SCRAPER_PROMPT.format(raw_text=raw_text)
    
    try:
        response = client.models.generate_content(
            model=MODEL,
            contents=prompt
        )
        
        text = response.text.strip()
        if text.startswith("```json"):
            text = text[7:]
        if text.startswith("```"):
            text = text[3:]
        if text.endswith("```"):
            text = text[:-3]
            
        jobs = json.loads(text)
        return jobs
    except Exception as e:
        print(f"Error parsing with Gemini: {e}")
        return []

def scrape_jobs_from_natural_query(user_query: str) -> list[dict]:
    """
    Searches the web for jobs based on a natural language query from the user,
    then uses Gemini to parse them into structured job data.
    The raw_text from Gemini grounding already contains real job URLs.
    """
    if not user_query.strip():
        return []
    
    grounding_prompt = (
        f"Search Google for job listings matching this request: {user_query}. "
        "Find at least 20-30 distinct real job listings. "
        "For EVERY job listing found, include: the exact job title, company name, "
        "location, salary range if available, a short description, and the EXACT direct URL to the job posting. "
        "List all jobs with their real URLs clearly."
    )
    
    client = get_client()
    
    try:
        search_response = client.models.generate_content(
            model=MODEL,
            contents=grounding_prompt,
            config=types.GenerateContentConfig(
                tools=[{"google_search": {}}]
            )
        )
        raw_text = search_response.text
        print(f"Successfully retrieved jobs via Google Grounding. Raw text length: {len(raw_text)}")
    except Exception as e:
        print(f"Error fetching from Google Grounding: {e}")
        return []
    
    # Use inline parse prompt - the raw_text already has real URLs from Gemini
    parse_prompt = f"""You are an expert job data extractor.
Below is text containing real job listings with real URLs.

TEXT:
{raw_text}

Extract ALL job postings from the text above. For each job provide:
- "title": job title
- "company": company name (use "Unknown" if not found)
- "location": location (use "Vietnam" if not specified)
- "salary": salary range or "Negotiable"
- "description": 1-2 sentence description
- "url": The EXACT URL from the text (must start with http:// or https://). Skip job if no real URL found.
- "source": platform name inferred from URL domain (e.g. itviec.com -> "ITviec")

Rules:
- Only include jobs where url starts with http:// or https://
- Do NOT invent or modify URLs
- Output ONLY a raw JSON array, no markdown fences, no explanation"""
    
    try:
        response = client.models.generate_content(
            model=MODEL,
            contents=parse_prompt
        )
        
        text = response.text.strip()
        # Strip markdown fences if present
        if text.startswith("```json"):
            text = text[7:]
        elif text.startswith("```"):
            text = text[3:]
        if text.endswith("```"):
            text = text[:-3]
            
        jobs = json.loads(text.strip())
        print(f"Parsed {len(jobs)} jobs from Gemini.")
        return jobs
    except Exception as e:
        print(f"Error parsing with Gemini: {e}")
        return []



async def match_score(cv_summary: str, cv_skills: list[str], job_title: str, job_desc: str) -> int:
    """
    Calculates a match percentage between CV and Job using Gemini.
    """
    client = get_client()
    skills_str = ", ".join(cv_skills)
    prompt = MATCH_SCORE_PROMPT.format(cv_summary=cv_summary,
                                       skills_str=skills_str,
                                       job_title=job_title,
                                       job_desc=job_desc)
    try:
        response = client.models.generate_content(
            model=MODEL,
            contents=prompt
        )
        score_str = response.text.strip()
        score = int(''.join(filter(str.isdigit, score_str)))
        return min(max(score, 0), 100)
    except Exception:
        return 75 # Default fallback
