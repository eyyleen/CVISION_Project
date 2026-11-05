import json
import logging
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import or_, func
from database import Candidate, JobMatch
from schemas import CandidateCreate, CandidateUpdate, SearchRequest
from nlp_engine import categorize_skills

logger = logging.getLogger(__name__)


# ─── Candidate CRUD ──────────────────────────────────────────────────────────

def create_candidate(db: Session, candidate: CandidateCreate) -> Candidate:
    db_candidate = Candidate(
        name=candidate.name,
        email=candidate.email,
        phone=candidate.phone,
        location=candidate.location,
        summary=candidate.summary,
        education=candidate.education or [],
        experience=candidate.experience or [],
        skills=candidate.skills or [],
        languages=candidate.languages or [],
        certifications=candidate.certifications or [],
        raw_text=candidate.raw_text,
        file_name=candidate.file_name,
        file_type=candidate.file_type,
        years_of_experience=candidate.years_of_experience or 0.0,
    )
    db.add(db_candidate)
    db.commit()
    db.refresh(db_candidate)
    return db_candidate


def get_candidate(db: Session, candidate_id: int) -> Optional[Candidate]:
    return db.query(Candidate).filter(Candidate.id == candidate_id).first()


def get_candidates(db: Session, skip: int = 0, limit: int = 100) -> List[Candidate]:
    return db.query(Candidate).order_by(Candidate.created_at.desc()).offset(skip).limit(limit).all()


def update_candidate(db: Session, candidate_id: int, candidate: CandidateUpdate) -> Optional[Candidate]:
    db_candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not db_candidate:
        return None
    update_data = candidate.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_candidate, field, value)
    db.commit()
    db.refresh(db_candidate)
    return db_candidate


def delete_candidate(db: Session, candidate_id: int) -> bool:
    db_candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not db_candidate:
        return False
    # Also delete related job matches
    db.query(JobMatch).filter(JobMatch.candidate_id == candidate_id).delete()
    db.delete(db_candidate)
    db.commit()
    return True


def search_candidates(db: Session, search: SearchRequest) -> List[Candidate]:
    query = db.query(Candidate)

    if search.query:
        search_term = f"%{search.query}%"
        query = query.filter(
            or_(
                Candidate.name.ilike(search_term),
                Candidate.email.ilike(search_term),
                Candidate.location.ilike(search_term),
                Candidate.summary.ilike(search_term),
            )
        )

    if search.location:
        query = query.filter(Candidate.location.ilike(f"%{search.location}%"))

    if search.min_experience is not None:
        query = query.filter(Candidate.years_of_experience >= search.min_experience)

    if search.max_experience is not None:
        query = query.filter(Candidate.years_of_experience <= search.max_experience)

    candidates = query.order_by(Candidate.created_at.desc()).all()

    # Filter by skills (JSON field)
    if search.skills:
        search_skills_lower = [s.lower() for s in search.skills]
        filtered = []
        for candidate in candidates:
            candidate_skills_lower = [s.lower() for s in (candidate.skills or [])]
            if any(skill in candidate_skills_lower for skill in search_skills_lower):
                filtered.append(candidate)
        candidates = filtered

    return candidates


def get_dashboard_stats(db: Session) -> dict:
    """Compute dashboard statistics from database."""
    total_candidates = db.query(Candidate).count()

    if total_candidates == 0:
        return {
            "total_candidates": 0,
            "avg_experience": 0,
            "top_skills": [],
            "skills_distribution": {},
            "experience_distribution": {},
            "recent_uploads": [],
            "candidates_by_location": [],
        }

    # Average experience
    avg_exp_result = db.query(func.avg(Candidate.years_of_experience)).scalar()
    avg_experience = round(float(avg_exp_result or 0), 1)

    # Aggregate all skills
    all_candidates = db.query(Candidate).all()
    skill_counter = {}
    for c in all_candidates:
        for skill in (c.skills or []):
            skill_lower = skill.lower()
            skill_counter[skill_lower] = skill_counter.get(skill_lower, 0) + 1

    top_skills = sorted(skill_counter.items(), key=lambda x: x[1], reverse=True)[:15]
    top_skills_list = [{"skill": s.title(), "count": c} for s, c in top_skills]

    # Skills distribution by category
    all_skills = []
    for c in all_candidates:
        all_skills.extend([s.lower() for s in (c.skills or [])])

    skills_distribution = categorize_skills([s.title() for s in all_skills])
    skills_dist_counts = {cat: len(skills) for cat, skills in skills_distribution.items()}

    # Experience distribution
    exp_buckets = {"0-1 years": 0, "1-3 years": 0, "3-5 years": 0, "5-10 years": 0, "10+ years": 0}
    for c in all_candidates:
        yoe = c.years_of_experience or 0
        if yoe <= 1:
            exp_buckets["0-1 years"] += 1
        elif yoe <= 3:
            exp_buckets["1-3 years"] += 1
        elif yoe <= 5:
            exp_buckets["3-5 years"] += 1
        elif yoe <= 10:
            exp_buckets["5-10 years"] += 1
        else:
            exp_buckets["10+ years"] += 1

    # Recent uploads
    recent = db.query(Candidate).order_by(Candidate.created_at.desc()).limit(5).all()
    recent_uploads = [
        {
            "id": c.id,
            "name": c.name,
            "file_name": c.file_name,
            "created_at": c.created_at.isoformat() if c.created_at else None,
            "skills_count": len(c.skills or []),
        }
        for c in recent
    ]

    # Candidates by location
    loc_counter = {}
    for c in all_candidates:
        if c.location:
            loc = c.location.strip()
            loc_counter[loc] = loc_counter.get(loc, 0) + 1
    candidates_by_location = sorted(
        [{"location": l, "count": ct} for l, ct in loc_counter.items()],
        key=lambda x: x["count"],
        reverse=True
    )[:10]

    return {
        "total_candidates": total_candidates,
        "avg_experience": avg_experience,
        "top_skills": top_skills_list,
        "skills_distribution": skills_dist_counts,
        "experience_distribution": exp_buckets,
        "recent_uploads": recent_uploads,
        "candidates_by_location": candidates_by_location,
    }


# ─── Job Match CRUD ──────────────────────────────────────────────────────────

def create_job_match(db: Session, candidate_id: int, job_title: str,
                     job_description: str, match_result: dict) -> JobMatch:
    db_match = JobMatch(
        candidate_id=candidate_id,
        job_title=job_title,
        job_description=job_description,
        match_score=match_result["match_score"],
        matched_skills=match_result["matched_skills"],
        missing_skills=match_result["missing_skills"],
    )
    db.add(db_match)
    db.commit()
    db.refresh(db_match)
    return db_match


def get_job_matches_for_candidate(db: Session, candidate_id: int) -> List[JobMatch]:
    return db.query(JobMatch).filter(
        JobMatch.candidate_id == candidate_id
    ).order_by(JobMatch.created_at.desc()).all()


def get_all_job_matches(db: Session, skip: int = 0, limit: int = 50) -> List[JobMatch]:
    return db.query(JobMatch).order_by(JobMatch.created_at.desc()).offset(skip).limit(limit).all()
