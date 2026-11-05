import re
import logging
import math
from typing import Optional
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

logger = logging.getLogger(__name__)

# Skill categories for analysis
SKILL_CATEGORIES = {
    "Programming Languages": [
        "python", "java", "javascript", "typescript", "c++", "c#", "ruby", "go",
        "rust", "php", "swift", "kotlin", "scala", "r", "matlab", "perl"
    ],
    "Web Technologies": [
        "react", "angular", "vue", "nextjs", "nuxtjs", "django", "flask", "fastapi",
        "spring", "laravel", "express", "nodejs", "nestjs", "rails", "html", "css"
    ],
    "Databases": [
        "mysql", "postgresql", "sqlite", "mongodb", "redis", "elasticsearch",
        "oracle", "mssql", "cassandra", "dynamodb", "firebase"
    ],
    "Cloud & DevOps": [
        "aws", "azure", "gcp", "docker", "kubernetes", "terraform", "ansible",
        "jenkins", "github actions", "circleci", "nginx", "apache"
    ],
    "Data & AI/ML": [
        "machine learning", "deep learning", "nlp", "computer vision", "tensorflow",
        "pytorch", "keras", "scikit-learn", "pandas", "numpy", "matplotlib",
        "spark", "hadoop", "airflow", "tableau", "power bi"
    ],
    "Tools & Methods": [
        "git", "jira", "confluence", "docker", "postman", "swagger", "linux",
        "agile", "scrum", "kanban", "figma"
    ],
}


def categorize_skills(skills: list) -> dict:
    """Categorize skills into groups."""
    categorized = {cat: [] for cat in SKILL_CATEGORIES}
    categorized["Other"] = []
    skills_lower = [s.lower() for s in skills]

    for skill in skills_lower:
        placed = False
        for category, keywords in SKILL_CATEGORIES.items():
            if skill in keywords or any(kw in skill for kw in keywords):
                categorized[category].append(skill.title())
                placed = True
                break
        if not placed:
            categorized["Other"].append(skill.title())

    # Remove empty categories
    return {k: v for k, v in categorized.items() if v}


def compute_job_match_score(candidate_data: dict, job_description: str) -> dict:
    """
    Compute job matching score between candidate CV and job description.
    Returns score (0-100) and analysis details.
    """
    candidate_skills = [s.lower() for s in candidate_data.get("skills", [])]
    candidate_text = _build_candidate_text(candidate_data)

    # Step 1: TF-IDF cosine similarity
    tfidf_score = _tfidf_similarity(candidate_text, job_description)

    # Step 2: Skill overlap score
    job_skills = _extract_skills_from_jd(job_description)
    skill_score, matched_skills, missing_skills = _skill_overlap(candidate_skills, job_skills)

    # Step 3: Experience score
    experience_score = _experience_score(
        candidate_data.get("years_of_experience", 0),
        job_description
    )

    # Step 4: Education score
    education_score = _education_score(
        candidate_data.get("education", []),
        job_description
    )

    # Weighted final score
    final_score = (
        tfidf_score * 0.30 +
        skill_score * 0.40 +
        experience_score * 0.20 +
        education_score * 0.10
    ) * 100

    final_score = round(min(max(final_score, 0), 100), 1)

    return {
        "match_score": final_score,
        "matched_skills": [s.title() for s in matched_skills],
        "missing_skills": [s.title() for s in missing_skills],
        "score_breakdown": {
            "text_similarity": round(tfidf_score * 100, 1),
            "skill_match": round(skill_score * 100, 1),
            "experience_match": round(experience_score * 100, 1),
            "education_match": round(education_score * 100, 1),
        }
    }


def _build_candidate_text(candidate_data: dict) -> str:
    """Build a full text representation of candidate for NLP matching."""
    parts = []
    if candidate_data.get("summary"):
        parts.append(candidate_data["summary"])

    for edu in candidate_data.get("education", []):
        parts.append(f"{edu.get('degree', '')} {edu.get('institution', '')} {edu.get('field', '')}")

    for exp in candidate_data.get("experience", []):
        parts.append(f"{exp.get('title', '')} {exp.get('company', '')} {exp.get('description', '')}")

    skills = candidate_data.get("skills", [])
    parts.append(" ".join(skills))

    return " ".join(parts).lower()


def _tfidf_similarity(candidate_text: str, job_description: str) -> float:
    """Compute TF-IDF cosine similarity between two texts."""
    if not candidate_text.strip() or not job_description.strip():
        return 0.0
    try:
        vectorizer = TfidfVectorizer(stop_words='english', ngram_range=(1, 2))
        tfidf_matrix = vectorizer.fit_transform([candidate_text, job_description.lower()])
        score = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]
        return float(score)
    except Exception as e:
        logger.error(f"TF-IDF error: {e}")
        return 0.0


def _extract_skills_from_jd(job_description: str) -> list:
    """Extract required skills from job description."""
    from cv_parser import TECH_SKILLS, SOFT_SKILLS
    jd_lower = job_description.lower()
    found = []
    for skill in TECH_SKILLS + SOFT_SKILLS:
        if skill in jd_lower:
            found.append(skill)
    return found


def _skill_overlap(candidate_skills: list, job_skills: list) -> tuple:
    """Calculate skill overlap between candidate and job requirements."""
    if not job_skills:
        return 0.5, [], []

    candidate_set = set(candidate_skills)
    job_set = set(job_skills)

    matched = list(candidate_set & job_set)
    missing = list(job_set - candidate_set)

    score = len(matched) / len(job_set) if job_set else 0
    return score, matched, missing


def _experience_score(years: float, job_description: str) -> float:
    """Score experience level match."""
    jd_lower = job_description.lower()

    # Detect required experience from JD
    exp_patterns = [
        (r'(\d+)\+?\s*years?\s*(?:of\s*)?experience', 1.0),
        (r'minimum\s*(\d+)\s*years?', 1.0),
        (r'at\s*least\s*(\d+)\s*years?', 1.0),
        (r'(\d+)\s*-\s*\d+\s*years?', 0.8),
    ]

    required_years = None
    for pattern, _ in exp_patterns:
        match = re.search(pattern, jd_lower)
        if match:
            required_years = float(match.group(1))
            break

    # Level keywords
    if required_years is None:
        if any(kw in jd_lower for kw in ["senior", "lead", "principal", "architect"]):
            required_years = 5
        elif any(kw in jd_lower for kw in ["mid", "intermediate", "associate"]):
            required_years = 3
        elif any(kw in jd_lower for kw in ["junior", "entry", "fresh", "graduate", "intern"]):
            required_years = 0
        else:
            required_years = 2

    if years >= required_years:
        return 1.0
    elif required_years > 0:
        return min(years / required_years, 1.0)
    return 0.8


def _education_score(education: list, job_description: str) -> float:
    """Score education level match."""
    jd_lower = job_description.lower()

    if not education:
        return 0.5

    has_bachelor = any(
        any(kw in str(edu).lower() for kw in ["bachelor", "s1", "sarjana", "b.s", "b.a"])
        for edu in education
    )
    has_master = any(
        any(kw in str(edu).lower() for kw in ["master", "s2", "magister", "m.s", "m.a", "mba"])
        for edu in education
    )
    has_phd = any(
        any(kw in str(edu).lower() for kw in ["phd", "s3", "doktor", "doctorate"])
        for edu in education
    )

    if any(kw in jd_lower for kw in ["phd", "doctorate", "s3", "doktor"]):
        return 1.0 if has_phd else (0.7 if has_master else 0.4)
    elif any(kw in jd_lower for kw in ["master", "s2", "magister", "mba"]):
        return 1.0 if (has_master or has_phd) else (0.6 if has_bachelor else 0.3)
    elif any(kw in jd_lower for kw in ["bachelor", "s1", "sarjana", "degree"]):
        return 1.0 if (has_bachelor or has_master or has_phd) else 0.4
    else:
        return 0.8 if (has_bachelor or has_master or has_phd) else 0.5
