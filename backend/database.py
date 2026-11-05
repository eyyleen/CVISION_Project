from sqlalchemy import create_engine, Column, Integer, String, Text, Float, DateTime, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime

DATABASE_URL = "sqlite:///./cvision.db"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class Candidate(Base):
    __tablename__ = "candidates"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), index=True)
    phone = Column(String(50))
    location = Column(String(255))
    summary = Column(Text)
    education = Column(JSON, default=[])
    experience = Column(JSON, default=[])
    skills = Column(JSON, default=[])
    languages = Column(JSON, default=[])
    certifications = Column(JSON, default=[])
    raw_text = Column(Text)
    file_name = Column(String(255))
    file_type = Column(String(10))
    years_of_experience = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class JobMatch(Base):
    __tablename__ = "job_matches"

    id = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(Integer, index=True)
    job_title = Column(String(255))
    job_description = Column(Text)
    match_score = Column(Float)
    matched_skills = Column(JSON, default=[])
    missing_skills = Column(JSON, default=[])
    created_at = Column(DateTime, default=datetime.utcnow)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    Base.metadata.create_all(bind=engine)
