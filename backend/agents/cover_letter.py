import os
from google import genai
from google.genai import types

API_KEY = os.environ.get("GEMINI_API_KEY")

def get_client():
    if not API_KEY:
        raise ValueError("GEMINI_API_KEY environment variable is not set. Please set it to use the Gemini API.")
    return genai.Client(api_key=API_KEY)

def generate_cover_letter(cv_data: dict, job_data: dict, language: str = "Vietnamese") -> str:
    """
    Generates a personalized cover letter based on CV data and Job data.
    """
    client = get_client()
    
    prompt = f"""
    You are an expert career coach and professional writer.
    Please write a highly persuasive and professional cover letter in {language}.
    
    CANDIDATE INFORMATION:
    - Summary: {cv_data.get('summary', 'Not provided')}
    - Skills: {', '.join(cv_data.get('skills', []))}
    - Experience: {cv_data.get('experience_years', 0)} years
    
    JOB INFORMATION:
    - Job Title: {job_data.get('title', 'Not specified')}
    - Company: {job_data.get('company', 'Not specified')}
    - Location: {job_data.get('location', 'Not specified')}
    - Description/Details: {job_data.get('description', 'Not provided')}
    
    REQUIREMENTS:
    - Keep it concise (around 3-4 paragraphs).
    - Be confident but humble.
    - Highlight how the candidate's specific skills and experience match the job requirements.
    - Ensure a professional and enthusiastic tone.
    - Output ONLY the cover letter text, no markdown formatting like ```text, just the plain text.
    """
    
    response = client.models.generate_content(
        model='gemini-2.5-pro', # Use a better model for writing
        contents=prompt
    )
    
    return response.text
