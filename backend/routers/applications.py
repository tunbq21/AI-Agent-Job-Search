from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
import os

from database import get_db
from model import models
from agents.matcher import get_client
from agents.job_scraper import match_score

router = APIRouter(prefix="/applications", tags=["Applications"])

MOCK_USER_ID = 1

class ApplicationCreate(BaseModel):
    job_id: int
    match_percentage: int
    match_reason: str

class ApplicationUpdateStatus(BaseModel):
    status: str

@router.post("/")
async def create_application(app_in: ApplicationCreate, db: AsyncSession = Depends(get_db)):
    resume_result = await db.execute(
        select(models.Resume).where(models.Resume.user_id == MOCK_USER_ID).order_by(models.Resume.id.desc())
    )
    resume = resume_result.scalars().first()
    
    job_result = await db.execute(select(models.Job).where(models.Job.id == app_in.job_id))
    job = job_result.scalars().first()
    
    actual_match = 75
    if resume and job:
        actual_match = await match_score(
            cv_summary=resume.summary or "", 
            cv_skills=resume.skills or [], 
            job_title=job.title or "", 
            job_desc=job.description or ""
        )

    # Create the application
    new_app = models.Application(
        user_id=MOCK_USER_ID,
        job_id=app_in.job_id,
        status="Saved",
        match_percentage=actual_match,
        match_reason="AI analyzed your CV against the job description."
    )
    db.add(new_app)
    await db.commit()
    await db.refresh(new_app)
    return new_app

@router.get("/")
async def get_applications(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(models.Application).where(models.Application.user_id == MOCK_USER_ID)
    )
    return result.scalars().all()

@router.put("/{app_id}/status")
async def update_status(app_id: int, status_in: ApplicationUpdateStatus, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(models.Application).where(models.Application.id == app_id))
    app = result.scalars().first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
        
    app.status = status_in.status
    await db.commit()
    return app

@router.post("/{app_id}/generate_cover_letter")
async def generate_cover_letter(app_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(models.Application).where(models.Application.id == app_id))
    app = result.scalars().first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
        
    job_result = await db.execute(select(models.Job).where(models.Job.id == app.job_id))
    job = job_result.scalars().first()
    
    resume_result = await db.execute(
        select(models.Resume).where(models.Resume.user_id == app.user_id).order_by(models.Resume.id.desc())
    )
    resume = resume_result.scalars().first()
    
    if not resume or not job:
        raise HTTPException(status_code=400, detail="Missing resume or job data")
        
    # Generate Cover Letter using Gemini
    client = get_client()
    prompt = f"""
    You are an expert career coach. Write a highly persuasive and professional cover letter for the following candidate applying to the following job.
    
    CANDIDATE SUMMARY: {resume.summary}
    CANDIDATE SKILLS: {resume.skills}
    
    JOB TITLE: {job.title}
    COMPANY: {job.company}
    
    Keep it concise (around 3 paragraphs). Be confident but humble.
    """
    
    MODEL = os.environ.get("GEMINI_MODEL", "gemini-2.5-flash")
    response = client.models.generate_content(
        model=MODEL,
        contents=prompt
    )
    
    app.cover_letter = response.text
    await db.commit()
    
    return {"cover_letter": response.text}

@router.delete("/")
async def clear_all_applications(db: AsyncSession = Depends(get_db)):
    await db.execute(models.Application.__table__.delete())
    await db.commit()
    return {"message": "All applications cleared."}

@router.delete("/{app_id}")
async def delete_application(app_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(models.Application).where(models.Application.id == app_id))
    app = result.scalars().first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    await db.delete(app)
    await db.commit()
    return {"message": "Application deleted."}
