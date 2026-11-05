import logging
import json
from contextlib import asynccontextmanager
from typing import List, Optional

from fastapi import FastAPI, File, UploadFile, HTTPException, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from database import get_db, init_db
from schemas import (
    CandidateResponse, CandidateUpdate, JobMatchRequest,
    JobMatchResponse, JobMatchResult, DashboardStats, SearchRequest
)
import crud
import cv_parser
import nlp_engine

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize database on startup."""
    logger.info("Initializing CVision database...")
    init_db()
    logger.info("Database ready.")
    yield
    logger.info("CVision shutting down.")


app = FastAPI(
    title="CVision API",
    description="AI-Powered CV Extractor & Job Matching API",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Upload & Extract ─────────────────────────────────────────────────────────

@app.post("/api/upload", response_model=CandidateResponse, tags=["CV Upload"])
async def upload_cv(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Upload a CV file (PDF or DOCX) and extract candidate information automatically."""

    # Validate file type
    allowed_types = {
        "application/pdf": "pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
        "application/msword": "doc",
    }

    content_type = file.content_type or ""
    file_name = file.filename or ""
    file_ext = file_name.rsplit(".", 1)[-1].lower() if "." in file_name else ""

    if content_type not in allowed_types and file_ext not in ["pdf", "docx", "doc"]:
        raise HTTPException(
            status_code=400,
            detail="Only PDF and DOCX files are supported."
        )

    file_bytes = await file.read()

    if len(file_bytes) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    if len(file_bytes) > 10 * 1024 * 1024:  # 10MB limit
        raise HTTPException(status_code=400, detail="File size exceeds 10MB limit.")

    # Extract text
    file_type = allowed_types.get(content_type, file_ext)
    if file_type in ("pdf",):
        raw_text = cv_parser.extract_text_from_pdf(file_bytes)
    else:
        raw_text = cv_parser.extract_text_from_docx(file_bytes)

    if not raw_text.strip():
        raise HTTPException(
            status_code=422,
            detail="Could not extract text from the uploaded file. Ensure it is not image-only."
        )

    # Parse sections
    sections = cv_parser.parse_sections(raw_text)

    # Extract structured data
    name = cv_parser.extract_name_from_text(raw_text)
    email = cv_parser.extract_email(raw_text)
    phone = cv_parser.extract_phone(raw_text)
    location = cv_parser.extract_location(raw_text)
    summary = cv_parser.extract_summary(raw_text)
    skills = cv_parser.extract_skills(raw_text)
    languages = cv_parser.extract_languages(raw_text)
    education = cv_parser.parse_education(sections.get("education", []))
    experience = cv_parser.parse_experience(sections.get("experience", []))
    years_of_experience = cv_parser.calculate_years_of_experience(experience)

    from schemas import CandidateCreate
    candidate_data = CandidateCreate(
        name=name,
        email=email,
        phone=phone,
        location=location,
        summary=summary,
        education=education,
        experience=experience,
        skills=skills,
        languages=languages,
        certifications=[],
        raw_text=raw_text,
        file_name=file_name,
        file_type=file_type,
        years_of_experience=years_of_experience,
    )

    candidate = crud.create_candidate(db, candidate_data)
    logger.info(f"New candidate created: ID={candidate.id}, Name={candidate.name}")

    return candidate


# ─── Candidates ───────────────────────────────────────────────────────────────

@app.get("/api/candidates", response_model=List[CandidateResponse], tags=["Candidates"])
def list_candidates(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db)
):
    """List all candidates with pagination."""
    return crud.get_candidates(db, skip=skip, limit=limit)


@app.get("/api/candidates/{candidate_id}", response_model=CandidateResponse, tags=["Candidates"])
def get_candidate(candidate_id: int, db: Session = Depends(get_db)):
    """Get a specific candidate by ID."""
    candidate = crud.get_candidate(db, candidate_id)
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found.")
    return candidate


@app.patch("/api/candidates/{candidate_id}", response_model=CandidateResponse, tags=["Candidates"])
def update_candidate(
    candidate_id: int,
    candidate: CandidateUpdate,
    db: Session = Depends(get_db)
):
    """Update candidate information."""
    updated = crud.update_candidate(db, candidate_id, candidate)
    if not updated:
        raise HTTPException(status_code=404, detail="Candidate not found.")
    return updated


@app.delete("/api/candidates/{candidate_id}", tags=["Candidates"])
def delete_candidate(candidate_id: int, db: Session = Depends(get_db)):
    """Delete a candidate and their job match records."""
    success = crud.delete_candidate(db, candidate_id)
    if not success:
        raise HTTPException(status_code=404, detail="Candidate not found.")
    return {"message": "Candidate deleted successfully.", "id": candidate_id}


# ─── Search ───────────────────────────────────────────────────────────────────

@app.post("/api/candidates/search", response_model=List[CandidateResponse], tags=["Search"])
def search_candidates(search: SearchRequest, db: Session = Depends(get_db)):
    """Search candidates by name, skills, location, and experience."""
    results = crud.search_candidates(db, search)
    return results


@app.get("/api/search", response_model=List[CandidateResponse], tags=["Search"])
def quick_search(
    q: str = Query(..., min_length=1),
    db: Session = Depends(get_db)
):
    """Quick search by keyword."""
    search = SearchRequest(query=q)
    return crud.search_candidates(db, search)


# ─── Job Matching ─────────────────────────────────────────────────────────────

@app.post("/api/job-match", response_model=JobMatchResult, tags=["Job Matching"])
def match_job(request: JobMatchRequest, db: Session = Depends(get_db)):
    """
    Match a candidate's CV against a job description.
    Returns a match score (0–100) and skill gap analysis.
    """
    candidate = crud.get_candidate(db, request.candidate_id)
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found.")

    candidate_dict = {
        "name": candidate.name,
        "summary": candidate.summary or "",
        "skills": candidate.skills or [],
        "education": candidate.education or [],
        "experience": candidate.experience or [],
        "years_of_experience": candidate.years_of_experience or 0,
    }

    match_result = nlp_engine.compute_job_match_score(candidate_dict, request.job_description)

    # Persist the match result
    db_match = crud.create_job_match(
        db,
        candidate_id=request.candidate_id,
        job_title=request.job_title,
        job_description=request.job_description,
        match_result=match_result
    )

    return JobMatchResult(
        match_score=match_result["match_score"],
        matched_skills=match_result["matched_skills"],
        missing_skills=match_result["missing_skills"],
        score_breakdown=match_result["score_breakdown"],
        candidate=candidate
    )


@app.get("/api/candidates/{candidate_id}/matches", response_model=List[JobMatchResponse], tags=["Job Matching"])
def get_candidate_matches(candidate_id: int, db: Session = Depends(get_db)):
    """Get all job match history for a candidate."""
    candidate = crud.get_candidate(db, candidate_id)
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found.")
    return crud.get_job_matches_for_candidate(db, candidate_id)


@app.get("/api/job-matches", response_model=List[JobMatchResponse], tags=["Job Matching"])
def list_job_matches(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db)
):
    """List all job match records."""
    return crud.get_all_job_matches(db, skip=skip, limit=limit)


# ─── Skills Analysis ──────────────────────────────────────────────────────────

@app.get("/api/candidates/{candidate_id}/skills-analysis", tags=["Skills"])
def analyze_skills(candidate_id: int, db: Session = Depends(get_db)):
    """Analyze and categorize candidate skills."""
    candidate = crud.get_candidate(db, candidate_id)
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found.")

    skills = candidate.skills or []
    categorized = nlp_engine.categorize_skills(skills)

    return {
        "candidate_id": candidate_id,
        "candidate_name": candidate.name,
        "total_skills": len(skills),
        "skills": skills,
        "categorized_skills": categorized,
        "experience_years": candidate.years_of_experience,
    }


# ─── Dashboard ────────────────────────────────────────────────────────────────

@app.get("/api/dashboard/stats", tags=["Dashboard"])
def get_dashboard_stats(db: Session = Depends(get_db)):
    """Get aggregate statistics for the dashboard."""
    return crud.get_dashboard_stats(db)


# ─── Health Check ─────────────────────────────────────────────────────────────

@app.get("/api/health", tags=["System"])
def health_check():
    return {"status": "ok", "service": "CVision API", "version": "1.0.0"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
