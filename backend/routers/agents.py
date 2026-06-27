from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel

from database import get_db
from model import models
from agents.cover_letter import generate_cover_letter

router = APIRouter(prefix="/agents", tags=["Agents"])

class CoverLetterRequest(BaseModel):
    job_id: int = None
    job_url: str = None
    cv_id: int
    word_count: str = "Ngắn gọn (~300 từ)"
    
@router.post("/cover-letter")
async def create_cover_letter(req: CoverLetterRequest, db: AsyncSession = Depends(get_db)):
    # Get CV
    cv_result = await db.execute(select(models.Resume).where(models.Resume.id == req.cv_id))
    cv = cv_result.scalars().first()
    if not cv:
        raise HTTPException(status_code=404, detail="CV not found")
        
    cv_data = {
        "summary": cv.summary,
        "skills": cv.skills,
        "experience_years": cv.experience_years
    }
    
    # Get Job
    job_data = {}
    if req.job_id:
        job_result = await db.execute(select(models.Job).where(models.Job.id == req.job_id))
        job = job_result.scalars().first()
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")
        job_data = {
            "title": job.title,
            "company": job.company,
            "location": job.location,
            "description": job.description
        }
    elif req.job_url:
        import requests
        from bs4 import BeautifulSoup
        try:
            headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
            resp = requests.get(req.job_url, headers=headers, timeout=10)
            resp.raise_for_status()
            soup = BeautifulSoup(resp.text, 'html.parser')
            text_content = ' '.join(soup.stripped_strings)
            
            if not text_content:
                raise ValueError("No content found")
                
            job_data = {
                "title": "Job from URL",
                "company": "Company",
                "description": text_content[:5000]
            }
        except Exception as e:
            raise HTTPException(
                status_code=400, 
                detail="Không thể truy cập URL công việc này. Vui lòng kiểm tra lại link, có thể trang web yêu cầu đăng nhập hoặc chặn truy cập tự động."
            )
    else:
        raise HTTPException(status_code=400, detail="Must provide job_id or job_url")
        
    # Generate
    cover_letter_text = generate_cover_letter(cv_data, job_data, word_count=req.word_count)
    
    return {"cover_letter": cover_letter_text}
