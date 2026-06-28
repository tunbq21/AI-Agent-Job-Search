import os
from google import genai
from google.genai import types
from prompts.prompts import COVER_LETTER_PROMPT

API_KEY = os.environ.get("GEMINI_API_KEY")
PRO_MODEL = os.environ.get("GEMINI_PRO_MODEL", "gemini-3.1-pro-preview")

def get_client():
    if not API_KEY:
        raise ValueError("GEMINI_API_KEY environment variable is not set. Please set it to use the Gemini API.")
    return genai.Client(api_key=API_KEY)

def generate_cover_letter(cv_data: dict, job_data: dict, language: str = "Vietnamese", word_count: str = "Ngắn gọn (~300 từ)") -> str:
    """
    Generates a personalized cover letter based on CV data, Job data, and desired word count.
    """
    client = get_client()
    
    prompt = COVER_LETTER_PROMPT.format(
        language=language,
        cv_summary=cv_data.get('summary', 'Not provided'),
        cv_skills=', '.join(cv_data.get('skills', [])),
        cv_experience=cv_data.get('experience_years', 0),
        job_title=job_data.get('title', 'Not specified'),
        job_company=job_data.get('company', 'Not specified'),
        job_location=job_data.get('location', 'Not specified'),
        job_description=job_data.get('description', 'Not provided'),
        word_count=word_count
    )
    
    response = client.models.generate_content(
        model=PRO_MODEL,
        contents=prompt
    )
    
    return response.text
