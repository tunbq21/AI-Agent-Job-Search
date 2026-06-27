from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, JSON, Text
from sqlalchemy.orm import relationship
from database import Base
import datetime

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    name = Column(String)
    
    resumes = relationship("Resume", back_populates="owner")
    applications = relationship("Application", back_populates="user")

class Resume(Base):
    __tablename__ = "resumes"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    filename = Column(String)
    content_text = Column(Text)
    
    # AI parsed fields
    skills = Column(JSON) # List of skills
    experience_years = Column(Float)
    desired_roles = Column(JSON)
    summary = Column(Text)
    preference = Column(Text, nullable=True) # User's explicit job preference
    
    owner = relationship("User", back_populates="resumes")

class Job(Base):
    __tablename__ = "jobs"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    company = Column(String, index=True)
    location = Column(String)
    salary = Column(String, nullable=True)
    description = Column(Text)
    url = Column(String, unique=True)
    source = Column(String) # e.g. 'ITviec', 'TopCV'
    
    applications = relationship("Application", back_populates="job")

class Application(Base):
    __tablename__ = "applications"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    job_id = Column(Integer, ForeignKey("jobs.id"))
    status = Column(String, default="Saved") # Saved, Applied, Interviewing, Offered, Rejected
    match_percentage = Column(Integer)
    match_reason = Column(Text)
    cover_letter = Column(Text, nullable=True)
    applied_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    user = relationship("User", back_populates="applications")
    job = relationship("Job", back_populates="applications")
