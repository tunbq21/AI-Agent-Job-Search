# ==========================================
# CV EXTRACTOR PROMPT
# ==========================================
CV_EXTRACTOR_PROMPT = """
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

# ==========================================
# JOB MATCHER PROMPT
# ==========================================
JOB_MATCHER_PROMPT = """
You are an expert AI Job Matcher. 
Here is a candidate's profile:
{cv_data}

Candidate's search filters:
- Job Title Filter: {job_title}
- Location Filter: {location}

Here is raw text retrieved from a DuckDuckGo Search for job postings:
{raw_search_text}

Evaluate the jobs found in the text against the candidate's profile and the search filters (especially verifying if the job title and location match the candidate's preferences).
CRITICAL RULE: DO NOT HALLUCINATE JOBS. Only return jobs that ACTUALLY exist in the raw search text provided above. If the job is from India (e.g., Naukri) and not Vietnam, skip it unless location says otherwise.
Return a JSON array of matches, where each item has:
{{
    "title": "job title",
    "company": "company name",
    "location": "location",
    "salary": "salary or 'Negotiable'",
    "url": "url (MUST BE THE EXACT URL from the RAW TEXT)",
    "source": "Platform name (e.g. ITviec, TopCV)",
    "match_percentage": 85, // integer 0-100
    "match_reason": "Why this job is a good fit (1 sentence)."
}}
Only include jobs that have a match_percentage > 40.
Order by match_percentage descending.
"""

# ==========================================
# JOB SCRAPER PROMPT
# ==========================================
JOB_SCRAPER_PROMPT = """
You are an expert data extractor. I have a list of search engine results for job postings.
Your task is to extract real job postings from these results and format them as a JSON list.

RAW SEARCH RESULTS:
{raw_text}

Extract as many distinct job postings as possible.
For each job, provide:
- "title": Job title
- "company": Company name (infer from title or snippet, use "Unknown" if not found)
- "location": Location (infer if possible, else "Vietnam")
- "salary": Salary (infer if possible, else "Negotiable")
- "description": A short 1-2 sentence description based on the snippet.
- "url": The EXACT URL from the search result. Do NOT modify the URL.
- "source": The platform (e.g. "ITviec", "TopCV", "LinkedIn" - infer from the URL or title).

ONLY output valid JSON. Do not include markdown codeblocks. Just the raw JSON array.
"""

# ==========================================
# MATCH SCORE PROMPT
# ==========================================
MATCH_SCORE_PROMPT = """
Calculate a match score (0-100) for this candidate applying to this job.

CV SUMMARY: {cv_summary}
CV SKILLS: {skills_str}

JOB TITLE: {job_title}
JOB DESCRIPTION: {job_desc}

Output ONLY a single integer between 0 and 100 representing the match percentage.
"""

# ==========================================
# COVER LETTER PROMPT
# ==========================================
COVER_LETTER_PROMPT = """
You are an expert career coach and professional writer.
Please write a highly persuasive and professional cover letter in {language}.

CANDIDATE INFORMATION:
- Summary: {cv_summary}
- Skills: {cv_skills}
- Experience: {cv_experience} years

JOB INFORMATION:
- Job Title: {job_title}
- Company: {job_company}
- Location: {job_location}
- Description/Details: {job_description}

REQUIREMENTS:
- Target Length: {word_count}. Please expand or summarize appropriately to meet this length requirement.
- Be confident but humble.
- Highlight how the candidate's specific skills and experience match the job requirements.
- Ensure a professional and enthusiastic tone.
- Output ONLY the cover letter text, no markdown formatting like ```text, just the plain text.
"""
