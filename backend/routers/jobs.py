from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from database import get_db
from model import models
from agents.job_scraper import scrape_jobs_from_web

router = APIRouter(prefix="/jobs", tags=["Jobs"])

@router.get("/")
async def get_jobs(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(models.Job).order_by(models.Job.id.desc()))
    jobs = result.scalars().all()
    return jobs

@router.post("/scrape")
async def trigger_scrape(db: AsyncSession = Depends(get_db)):
    """
    Uses DuckDuckGo and Gemini to fetch real jobs based on user's CV.
    """
    MOCK_USER_ID = 1
    resume_result = await db.execute(
        select(models.Resume).where(models.Resume.user_id == MOCK_USER_ID).order_by(models.Resume.id.desc())
    )
    resume = resume_result.scalars().first()
    
    desired_roles = []
    if resume and resume.desired_roles:
        desired_roles = resume.desired_roles
    else:
        desired_roles = ["Software Engineer", "Developer"] # Fallback
        
    search_filters = resume.search_filters if resume and resume.search_filters else {}
    time_filter = search_filters.get('time_filter') if search_filters else None
        
    # Scrape jobs
    scraped_jobs_data = scrape_jobs_from_web(desired_roles, time_filter=time_filter)
    
    if not scraped_jobs_data:
        return {"message": "No jobs found or error occurred."}
        
    new_jobs_count = 0
    for job_data in scraped_jobs_data:
        # Check if URL exists
        existing_result = await db.execute(select(models.Job).where(models.Job.url == job_data.get('url', '')))
        if existing_result.scalars().first():
            continue
            
        new_job = models.Job(
            title=job_data.get('title', 'Unknown Title')[:200],
            company=job_data.get('company', 'Unknown Company')[:200],
            location=job_data.get('location', 'Remote')[:200],
            salary=job_data.get('salary', 'Negotiable')[:100],
            description=job_data.get('description', '')[:1000],
            url=job_data.get('url', '#')[:500],
            source=job_data.get('source', 'Web Search')[:50]
        )
        db.add(new_job)
        new_jobs_count += 1
        
    if new_jobs_count > 0:
        await db.commit()
        
    return {"message": f"Successfully scraped and added {new_jobs_count} new jobs."}

@router.delete("/")
async def clear_all_jobs(db: AsyncSession = Depends(get_db)):
    await db.execute(models.Job.__table__.delete())
    await db.commit()
    return {"message": "All jobs cleared."}

@router.delete("/{job_id}")
async def delete_job(job_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(models.Job).where(models.Job.id == job_id))
    job = result.scalars().first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    await db.delete(job)
    await db.commit()
    return {"message": "Job deleted."}
