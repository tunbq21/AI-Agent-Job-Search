from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel

from database import get_db
from model import models
from agents.matcher import get_client

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
    # Create the application
    new_app = models.Application(
        user_id=MOCK_USER_ID,
        job_id=app_in.job_id,
        status="Saved",
        match_percentage=app_in.match_percentage,
        match_reason=app_in.match_reason
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
    
    response = client.models.generate_content(
        model='gemini-2.5-flash',
        contents=prompt
    )
    
    app.cover_letter = response.text
    await db.commit()
    
    return {"cover_letter": response.text}
