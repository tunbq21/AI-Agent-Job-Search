from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from database import get_db
import models
from agents.matcher import process_cv, find_matching_jobs

router = APIRouter(prefix="/resumes", tags=["Resumes"])

# Mock User ID for now, since we don't have auth yet
MOCK_USER_ID = 1

@router.post("/")
async def upload_resume(
    file: UploadFile = File(...), 
    preference: str = Form(None),
    job_title: str = Form(None),
    location: str = Form(None),
    time_filter: str = Form(None),
    db: AsyncSession = Depends(get_db)
):
    if not file.filename.endswith(('.pdf', '.txt', '.docx')):
        raise HTTPException(status_code=400, detail="Unsupported file type.")
    
    content = await file.read()
    
    # Combine preferences for CV processing context if they exist
    combined_pref = ""
    if job_title:
        combined_pref += f"Desired Role: {job_title}. "
    if location:
        combined_pref += f"Preferred Location: {location}. "
    if time_filter:
        combined_pref += f"Posted Within: {time_filter}. "
    if preference:
        combined_pref += f"Additional Context: {preference}."
        
    # Process CV using AI
    try:
        analysis = process_cv(content, file.filename, combined_pref or None)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
    # Save to DB
    # Check if mock user exists, if not create one
    user_query = await db.execute(select(models.User).where(models.User.id == MOCK_USER_ID))
    user = user_query.scalars().first()
    if not user:
        user = models.User(id=MOCK_USER_ID, email="test@example.com", name="Test User")
        db.add(user)
        await db.commit()
    
    # Construct combined preference for saving to database
    db_preference = f"Job Title: {job_title or ''} | Location: {location or ''} | Time: {time_filter or ''} | Context: {preference or ''}"
    
    new_resume = models.Resume(
        user_id=MOCK_USER_ID,
        filename=file.filename,
        content_text=analysis.get('summary', ''),
        skills=analysis.get('skills', []),
        experience_years=analysis.get('experience_years', 0),
        desired_roles=analysis.get('desired_roles', []),
        summary=analysis.get('summary', ''),
        preference=db_preference
    )
    
    db.add(new_resume)
    await db.commit()
    await db.refresh(new_resume)
    
    # Trigger Job Search with the filters
    try:
        scraped_jobs = find_matching_jobs(analysis, preference, job_title=job_title, location=location)
        for job_data in scraped_jobs:
            # Check if url already exists
            existing_job_query = await db.execute(select(models.Job).where(models.Job.url == job_data.get('url')))
            existing_job = existing_job_query.scalars().first()
            if not existing_job:
                new_job = models.Job(
                    title=job_data.get('title', 'Unknown'),
                    company=job_data.get('company', 'Unknown'),
                    location=job_data.get('location', 'Vietnam'),
                    salary=job_data.get('salary', 'Negotiable'),
                    url=job_data.get('url', ''),
                    source=job_data.get('source', 'Google Search'),
                    description=job_data.get('match_reason', '')
                )
                db.add(new_job)
        await db.commit()
    except Exception as e:
        print("Failed to scrape jobs:", e)
    
    return {"message": "Resume uploaded and jobs searched successfully", "resume_id": new_resume.id, "analysis": analysis}

@router.get("/")
async def get_resumes(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(models.Resume).where(models.Resume.user_id == MOCK_USER_ID))
    return result.scalars().all()

@router.delete("/{resume_id}")
async def delete_resume(resume_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(models.Resume).where(models.Resume.id == resume_id, models.Resume.user_id == MOCK_USER_ID))
    resume = result.scalars().first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    
    await db.delete(resume)
    await db.commit()
    return {"message": "Resume deleted successfully"}
