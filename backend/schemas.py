from pydantic import BaseModel
from typing import Optional, List, Any
from datetime import datetime


class EducationItem(BaseModel):
    degree: Optional[str] = ""
    institution: Optional[str] = ""
    field: Optional[str] = ""
    start_year: Optional[str] = ""
    end_year: Optional[str] = ""
    gpa: Optional[str] = ""


class ExperienceItem(BaseModel):
    title: Optional[str] = ""
    company: Optional[str] = ""
    start_date: Optional[str] = ""
    end_date: Optional[str] = ""
    description: Optional[str] = ""
    is_current: Optional[bool] = False


class CandidateBase(BaseModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    summary: Optional[str] = None
    education: Optional[List[Any]] = []
    experience: Optional[List[Any]] = []
    skills: Optional[List[str]] = []
    languages: Optional[List[str]] = []
    certifications: Optional[List[str]] = []
    years_of_experience: Optional[float] = 0.0


class CandidateCreate(CandidateBase):
    raw_text: Optional[str] = None
    file_name: Optional[str] = None
    file_type: Optional[str] = None


class CandidateResponse(CandidateBase):
    id: int
    file_name: Optional[str] = None
    file_type: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CandidateUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    summary: Optional[str] = None
    education: Optional[List[Any]] = None
    experience: Optional[List[Any]] = None
    skills: Optional[List[str]] = None
    languages: Optional[List[str]] = None
    certifications: Optional[List[str]] = None
    years_of_experience: Optional[float] = None


class JobMatchRequest(BaseModel):
    candidate_id: int
    job_title: str
    job_description: str


class JobMatchResponse(BaseModel):
    id: int
    candidate_id: int
    job_title: str
    job_description: str
    match_score: float
    matched_skills: List[str]
    missing_skills: List[str]
    created_at: datetime

    class Config:
        from_attributes = True


class JobMatchResult(BaseModel):
    match_score: float
    matched_skills: List[str]
    missing_skills: List[str]
    score_breakdown: dict
    candidate: Optional[CandidateResponse] = None


class DashboardStats(BaseModel):
    total_candidates: int
    avg_experience: float
    top_skills: List[dict]
    skills_distribution: dict
    experience_distribution: dict
    recent_uploads: List[dict]
    candidates_by_location: List[dict]


class SearchRequest(BaseModel):
    query: Optional[str] = None
    skills: Optional[List[str]] = None
    min_experience: Optional[float] = None
    max_experience: Optional[float] = None
    location: Optional[str] = None
    education_level: Optional[str] = None
