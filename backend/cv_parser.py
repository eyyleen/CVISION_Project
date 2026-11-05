import re
import json
import logging
from typing import Optional
import pdfplumber
import docx
from io import BytesIO

logger = logging.getLogger(__name__)


def extract_text_from_pdf(file_bytes: bytes) -> str:
    """Extract raw text from PDF file."""
    text = ""
    try:
        with pdfplumber.open(BytesIO(file_bytes)) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
    except Exception as e:
        logger.error(f"PDF extraction error: {e}")
    return text.strip()


def extract_text_from_docx(file_bytes: bytes) -> str:
    """Extract raw text from DOCX file."""
    text = ""
    try:
        doc = docx.Document(BytesIO(file_bytes))
        for para in doc.paragraphs:
            if para.text.strip():
                text += para.text + "\n"
        for table in doc.tables:
            for row in table.rows:
                for cell in row.cells:
                    if cell.text.strip():
                        text += cell.text + " "
                text += "\n"
    except Exception as e:
        logger.error(f"DOCX extraction error: {e}")
    return text.strip()


def extract_email(text: str) -> Optional[str]:
    """Extract email address from text."""
    pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
    matches = re.findall(pattern, text)
    return matches[0] if matches else None


def extract_phone(text: str) -> Optional[str]:
    """Extract phone number from text."""
    patterns = [
        r'(\+?62[\s-]?8\d{2}[\s-]?\d{3,4}[\s-]?\d{3,4})',
        r'(08\d{2}[\s-]?\d{3,4}[\s-]?\d{3,4})',
        r'(\+?1?\s?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4})',
        r'(\+?\d{1,3}[\s-]?\d{2,3}[\s-]?\d{3,4}[\s-]?\d{3,4})',
    ]
    for pattern in patterns:
        matches = re.findall(pattern, text)
        if matches:
            return matches[0].strip()
    return None


def extract_linkedin(text: str) -> Optional[str]:
    """Extract LinkedIn URL from text."""
    pattern = r'linkedin\.com/in/[\w-]+'
    matches = re.findall(pattern, text, re.IGNORECASE)
    return f"https://{matches[0]}" if matches else None


# Common skills database
TECH_SKILLS = [
    # Programming languages
    "python", "java", "javascript", "typescript", "c++", "c#", "ruby", "go", "rust",
    "php", "swift", "kotlin", "scala", "r", "matlab", "perl", "bash", "shell",
    # Web frameworks
    "react", "angular", "vue", "nextjs", "nuxtjs", "django", "flask", "fastapi",
    "spring", "laravel", "express", "nodejs", "nestjs", "rails",
    # Databases
    "mysql", "postgresql", "sqlite", "mongodb", "redis", "elasticsearch",
    "oracle", "mssql", "cassandra", "dynamodb", "firebase",
    # Cloud & DevOps
    "aws", "azure", "gcp", "docker", "kubernetes", "terraform", "ansible",
    "jenkins", "github actions", "circleci", "nginx", "apache",
    # Data & AI
    "machine learning", "deep learning", "nlp", "computer vision", "tensorflow",
    "pytorch", "keras", "scikit-learn", "pandas", "numpy", "matplotlib",
    "spark", "hadoop", "airflow", "tableau", "power bi",
    # Tools
    "git", "jira", "confluence", "slack", "figma", "postman", "swagger",
    "linux", "windows", "macos", "agile", "scrum", "kanban",
]

SOFT_SKILLS = [
    "leadership", "communication", "teamwork", "problem solving", "critical thinking",
    "time management", "project management", "analytical thinking", "creativity",
    "adaptability", "collaboration", "mentoring", "public speaking", "negotiation",
]


def extract_skills(text: str) -> list:
    """Extract skills from text using keyword matching."""
    text_lower = text.lower()
    found_skills = set()

    for skill in TECH_SKILLS + SOFT_SKILLS:
        if skill in text_lower:
            found_skills.add(skill.title())

    return list(found_skills)


EDUCATION_KEYWORDS = [
    "bachelor", "master", "phd", "doctorate", "diploma", "associate",
    "b.s.", "m.s.", "b.a.", "m.a.", "mba", "s1", "s2", "s3", "d3", "d4",
    "sarjana", "magister", "doktor",
    "university", "universitas", "college", "institut", "institute",
    "school", "sekolah", "academy", "akademi",
]

EDUCATION_SECTION_HEADERS = [
    "education", "pendidikan", "academic background", "academic history",
    "educational background", "riwayat pendidikan", "latar belakang pendidikan"
]

EXPERIENCE_SECTION_HEADERS = [
    "experience", "work experience", "employment", "career", "professional experience",
    "pengalaman kerja", "pengalaman", "riwayat pekerjaan", "work history"
]

SKILLS_SECTION_HEADERS = [
    "skills", "technical skills", "competencies", "expertise", "capabilities",
    "keahlian", "keterampilan", "kemampuan teknis", "kompetensi"
]


def parse_sections(text: str) -> dict:
    """Parse CV text into sections."""
    lines = text.split('\n')
    sections = {
        "header": [],
        "education": [],
        "experience": [],
        "skills": [],
        "other": []
    }

    current_section = "header"

    for line in lines:
        line_stripped = line.strip()
        if not line_stripped:
            continue

        line_lower = line_stripped.lower()

        # Detect section headers
        is_header = False
        for header in EDUCATION_SECTION_HEADERS:
            if header in line_lower and len(line_stripped) < 60:
                current_section = "education"
                is_header = True
                break

        if not is_header:
            for header in EXPERIENCE_SECTION_HEADERS:
                if header in line_lower and len(line_stripped) < 60:
                    current_section = "experience"
                    is_header = True
                    break

        if not is_header:
            for header in SKILLS_SECTION_HEADERS:
                if header in line_lower and len(line_stripped) < 60:
                    current_section = "skills"
                    is_header = True
                    break

        if not is_header:
            sections[current_section].append(line_stripped)

    return sections


def parse_education(education_lines: list) -> list:
    """Parse education section into structured data."""
    education = []
    current_entry = {}

    year_pattern = re.compile(r'\b(19|20)\d{2}\b')

    for line in education_lines:
        line_lower = line.lower()
        years = year_pattern.findall(line)

        is_edu_line = any(kw in line_lower for kw in EDUCATION_KEYWORDS)

        if is_edu_line or (years and not current_entry):
            if current_entry and current_entry.get("institution"):
                education.append(current_entry)
            current_entry = {
                "degree": "",
                "institution": line,
                "field": "",
                "start_year": years[0] if len(years) > 0 else "",
                "end_year": years[1] if len(years) > 1 else years[0] if years else "",
                "gpa": ""
            }

            # Extract degree
            for degree in ["bachelor", "master", "phd", "s1", "s2", "s3", "d3", "d4",
                            "sarjana", "magister", "doktor", "mba", "diploma"]:
                if degree in line_lower:
                    current_entry["degree"] = degree.title()
                    break
        elif current_entry:
            gpa_match = re.search(r'(?:gpa|ipk)[:\s]*(\d+[.,]\d+)', line_lower)
            if gpa_match:
                current_entry["gpa"] = gpa_match.group(1)

    if current_entry and current_entry.get("institution"):
        education.append(current_entry)

    return education


def parse_experience(experience_lines: list) -> list:
    """Parse work experience section into structured data."""
    experience = []
    current_entry = {}

    year_pattern = re.compile(r'\b(20\d{2}|19\d{2})\b')
    date_range_pattern = re.compile(
        r'(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|january|february|march|april|june|'
        r'july|august|september|october|november|december|'
        r'jan|feb|mar|apr|mei|jun|jul|agt|sep|okt|nov|des)\w*\s+\d{4}',
        re.IGNORECASE
    )
    present_pattern = re.compile(r'\b(present|current|sekarang|now)\b', re.IGNORECASE)

    job_title_keywords = [
        "engineer", "developer", "manager", "analyst", "designer", "lead",
        "senior", "junior", "intern", "consultant", "architect", "specialist",
        "coordinator", "director", "officer", "staff", "associate", "head"
    ]

    for line in experience_lines:
        line_lower = line.lower()
        years = year_pattern.findall(line)
        has_date = date_range_pattern.search(line) or (years and len(years) >= 1)
        has_present = present_pattern.search(line)

        is_job_title = any(kw in line_lower for kw in job_title_keywords)

        if (has_date or is_job_title) and len(line) < 120:
            if current_entry and current_entry.get("company"):
                experience.append(current_entry)

            current_entry = {
                "title": "",
                "company": line,
                "start_date": years[0] if years else "",
                "end_date": "Present" if has_present else (years[1] if len(years) > 1 else years[0] if years else ""),
                "description": "",
                "is_current": bool(has_present)
            }

            if is_job_title:
                current_entry["title"] = line
        elif current_entry:
            if not current_entry.get("description"):
                current_entry["description"] = line
            else:
                current_entry["description"] += " " + line

    if current_entry and current_entry.get("company"):
        experience.append(current_entry)

    return experience


def calculate_years_of_experience(experience: list) -> float:
    """Estimate total years of experience from parsed experience list."""
    total_years = 0
    current_year = 2024

    for exp in experience:
        start = exp.get("start_date", "")
        end = exp.get("end_date", "")

        try:
            start_yr = int(re.search(r'\d{4}', str(start)).group()) if re.search(r'\d{4}', str(start)) else None
            if exp.get("is_current") or "present" in str(end).lower():
                end_yr = current_year
            else:
                end_yr = int(re.search(r'\d{4}', str(end)).group()) if re.search(r'\d{4}', str(end)) else (start_yr + 1 if start_yr else None)

            if start_yr and end_yr:
                total_years += max(0, end_yr - start_yr)
        except Exception:
            pass

    return round(min(total_years, 40), 1)


def extract_name_from_text(text: str) -> str:
    """Extract candidate name (first non-empty lines heuristic)."""
    lines = [l.strip() for l in text.split('\n') if l.strip()]
    for line in lines[:5]:
        # Skip lines that look like headers, emails, phones
        if '@' in line or re.search(r'\d{5,}', line):
            continue
        if len(line.split()) >= 2 and len(line) < 60:
            # Check it's mostly alphabetic
            alpha_ratio = sum(c.isalpha() or c.isspace() for c in line) / len(line)
            if alpha_ratio > 0.8:
                return line
    return lines[0] if lines else "Unknown"


def extract_location(text: str) -> Optional[str]:
    """Extract location/address from CV text."""
    location_patterns = [
        r'(?:address|alamat|location|lokasi)[:\s]+([^\n]+)',
        r'(?:jakarta|bandung|surabaya|yogyakarta|medan|bali|semarang|malang|depok|tangerang|bekasi)',
        r'(?:new york|san francisco|london|singapore|kuala lumpur)',
    ]
    for pattern in location_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            return match.group(1).strip() if match.lastindex else match.group(0).title()
    return None


def extract_languages(text: str) -> list:
    """Extract languages from CV text."""
    common_languages = [
        "english", "indonesian", "bahasa indonesia", "mandarin", "chinese",
        "japanese", "korean", "french", "german", "spanish", "arabic",
        "inggris", "indonesia", "mandarin", "jepang", "korea", "prancis"
    ]
    found = []
    text_lower = text.lower()
    for lang in common_languages:
        if lang in text_lower:
            found.append(lang.title())
    return list(set(found))


def extract_summary(text: str) -> str:
    """Extract professional summary/objective from CV."""
    summary_patterns = [
        r'(?:summary|ringkasan|objective|tujuan|profile|profil|about me|tentang saya)[:\s]*\n([^\n]+(?:\n[^\n]+){0,3})',
        r'(?:professional summary|ringkasan profesional)[:\s]*\n([^\n]+(?:\n[^\n]+){0,3})',
    ]
    for pattern in summary_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            return match.group(1).strip()
    return ""
