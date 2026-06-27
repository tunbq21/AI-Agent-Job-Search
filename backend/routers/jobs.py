from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from database import get_db
from model import models

router = APIRouter(prefix="/jobs", tags=["Jobs"])

@router.get("/")
async def get_jobs(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(models.Job))
    jobs = result.scalars().all()
    
    # If no jobs exist, let's insert some mock jobs for testing
    if not jobs:
        mock_jobs = [
            models.Job(title="Senior Frontend Developer", company="Techify Solutions", location="HCM / Remote", salary="$1500 - $2500", source="TopCV", url="https://example.com/1"),
            models.Job(title="Fullstack Engineer", company="Global Dev Corp", location="Hanoi", salary="$1000 - $2000", source="ITviec", url="https://example.com/2"),
            models.Job(title="Junior Web Developer", company="Startup Hub", location="Da Nang", salary="$500 - $800", source="LinkedIn", url="https://example.com/3")
        ]
        db.add_all(mock_jobs)
        await db.commit()
        
        result = await db.execute(select(models.Job))
        jobs = result.scalars().all()
        
    return jobs

@router.post("/scrape")
async def trigger_scrape(db: AsyncSession = Depends(get_db)):
    """
    In a real app, this triggers a BeautifulSoup/Selenium scraper.
    For now, it just returns a success message.
    """
    return {"message": "Scraping job queued in background."}
