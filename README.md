# CVision – AI-Powered CV Extractor

> **Capstone Project** — Intelligent resume analysis system using AI and NLP to automatically extract, classify, and match candidate profiles.

![Stack](https://img.shields.io/badge/Backend-FastAPI%20%2B%20Python-009688?style=flat-square)
![Stack](https://img.shields.io/badge/Frontend-React%20%2B%20Tailwind-61DAFB?style=flat-square)
![Stack](https://img.shields.io/badge/Database-SQLite-003B57?style=flat-square)
![Stack](https://img.shields.io/badge/NLP-spaCy%20%2B%20TF--IDF-FF6F00?style=flat-square)

---

## ✨ Features

| Feature | Description |
|---|---|
| **CV Upload** | Upload PDF and DOCX files (up to 10MB) via drag & drop |
| **AI Extraction** | Automatically extracts name, email, phone, location, summary |
| **NLP Analysis** | Parses education, work experience, skills using regex + NLP heuristics |
| **Skills Categorization** | Groups 80+ skills into Programming, Cloud, Data/AI, and more |
| **Job Matching** | TF-IDF cosine similarity + skill overlap + experience scoring |
| **Candidate Search** | Filter by name, skills, location, and experience range |
| **Dashboard** | Interactive charts for skill distribution, experience levels |
| **Analytics** | Radar charts, bar charts, location map, skill frequency |
| **History** | Persists all matches and candidates to SQLite database |

---

## 🏗️ Architecture

```
cvision/
├── backend/               # Python FastAPI API server
│   ├── main.py            # API routes & endpoints
│   ├── database.py        # SQLAlchemy ORM models + SQLite
│   ├── schemas.py         # Pydantic request/response schemas
│   ├── crud.py            # Database operations
│   ├── cv_parser.py       # PDF/DOCX text extraction + NLP parsing
│   ├── nlp_engine.py      # TF-IDF job matching + skill analysis
│   └── requirements.txt   # Python dependencies
└── frontend/              # React.js SPA
    ├── src/
    │   ├── App.jsx         # Router setup
    │   ├── components/
    │   │   ├── Layout.jsx         # Sidebar + nav shell
    │   │   ├── FileUploader.jsx   # Drag & drop upload
    │   │   ├── CandidateCard.jsx  # Profile display
    │   │   └── JobMatchResult.jsx # Score visualization
    │   ├── pages/
    │   │   ├── DashboardPage.jsx  # Stats + charts overview
    │   │   ├── UploadPage.jsx     # CV upload + extraction result
    │   │   ├── CandidatesPage.jsx # Paginated candidate table
    │   │   ├── CandidateDetailPage.jsx  # Edit + match history
    │   │   ├── SearchPage.jsx     # Advanced search
    │   │   ├── JobMatchPage.jsx   # Job matching interface
    │   │   └── AnalyticsPage.jsx  # Deep analytics + charts
    │   └── utils/
    │       ├── api.js       # Axios API client
    │       └── helpers.js   # Utility functions
    └── package.json
```

---

## 🚀 Installation

### Prerequisites

| Requirement | Version |
|---|---|
| Python | 3.10+ |
| Node.js | 18+ |
| npm | 9+ |

---

### Step 1 — Clone & enter project

```bash
cd cvision
```

---

### Step 2 — Backend Setup

```bash
# Enter backend directory
cd backend

# Create and activate virtual environment
python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Download spaCy English model
python -m spacy download en_core_web_sm
```

---

### Step 3 — Start Backend

```bash
# From the backend/ directory with venv active
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The API will be live at **http://localhost:8000**  
Interactive API docs at **http://localhost:8000/docs**

---

### Step 4 — Frontend Setup

Open a **new terminal**:

```bash
# Enter frontend directory
cd frontend

# Install Node.js dependencies
npm install

# Start development server
npm run dev
```

The app will be live at **http://localhost:3000**

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/upload` | Upload CV file (PDF/DOCX) → extract data |
| `GET` | `/api/candidates` | List all candidates |
| `GET` | `/api/candidates/{id}` | Get single candidate |
| `PATCH` | `/api/candidates/{id}` | Update candidate info |
| `DELETE` | `/api/candidates/{id}` | Delete candidate |
| `POST` | `/api/candidates/search` | Advanced search |
| `GET` | `/api/search?q=…` | Quick keyword search |
| `POST` | `/api/job-match` | Run job matching |
| `GET` | `/api/candidates/{id}/matches` | Match history |
| `GET` | `/api/candidates/{id}/skills-analysis` | Skills breakdown |
| `GET` | `/api/dashboard/stats` | Dashboard statistics |
| `GET` | `/api/health` | Health check |

---

## 🤖 How the AI/NLP Works

### CV Extraction Pipeline
1. **File parsing** — `pdfplumber` (PDF) or `python-docx` (DOCX) extracts raw text
2. **Section detection** — Regex-based section header recognition for Education, Experience, Skills
3. **Entity extraction** — Custom regex patterns for email, phone, LinkedIn, location
4. **Name heuristic** — Analyzes top lines, filters non-name patterns
5. **Skill matching** — Dictionary of 80+ tech/soft skills matched against full text
6. **Structured parsing** — Education and experience entries parsed into JSON objects
7. **Experience calculation** — Extracts year ranges, computes total years of experience

### Job Matching Algorithm
The match score is a **weighted composite** of four signals:

| Signal | Weight | Method |
|---|---|---|
| Text Similarity | 30% | TF-IDF cosine similarity (scikit-learn) |
| Skill Overlap | 40% | Jaccard intersection of skill sets |
| Experience Match | 20% | Ratio of actual vs. required years |
| Education Match | 10% | Degree level comparison |

**Final Score = (text × 0.30) + (skills × 0.40) + (exp × 0.20) + (edu × 0.10) × 100**

---

## 📊 Dashboard & Analytics

- **Top 10 skills** — horizontal bar chart by frequency
- **Experience distribution** — bar chart (0-1y, 1-3y, 3-5y, 5-10y, 10+y)
- **Skills by category** — pie chart (Programming, Web, Cloud, Data/AI, etc.)
- **Radar chart** — multi-axis skill category visualization
- **Location map** — candidates by city/region
- **Recent uploads** — quick-access list of last 5 candidates

---

## 🛠️ Development

### Backend (hot reload)
```bash
cd backend
uvicorn main:app --reload
```

### Frontend (hot reload)
```bash
cd frontend
npm run dev
```

### Build for production
```bash
# Frontend
cd frontend
npm run build   # outputs to frontend/dist/

# Backend (serve with gunicorn for production)
pip install gunicorn
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker
```

---

## 🔧 Configuration

| Setting | Location | Default |
|---|---|---|
| Database file | `backend/database.py` | `./cvision.db` |
| API port | `backend/main.py` | `8000` |
| Frontend port | `frontend/vite.config.js` | `3000` |
| CORS origins | `backend/main.py` | `localhost:3000, localhost:5173` |
| Max file size | `backend/main.py` | `10MB` |

---

## 📋 Tech Stack

**Backend**
- [FastAPI](https://fastapi.tiangolo.com/) — Modern async Python API framework
- [SQLAlchemy](https://www.sqlalchemy.org/) — ORM with SQLite
- [pdfplumber](https://github.com/jsvine/pdfplumber) — PDF text extraction
- [python-docx](https://python-docx.readthedocs.io/) — DOCX text extraction
- [scikit-learn](https://scikit-learn.org/) — TF-IDF vectorization + cosine similarity
- [spaCy](https://spacy.io/) — NLP pipeline (extensible)

**Frontend**
- [React 18](https://react.dev/) + [Vite](https://vitejs.dev/) — SPA framework
- [Tailwind CSS 3](https://tailwindcss.com/) — Utility-first styling
- [Recharts](https://recharts.org/) — Data visualization
- [react-dropzone](https://react-dropzone.js.org/) — File upload UX
- [lucide-react](https://lucide.dev/) — Icon library
- [react-hot-toast](https://react-hot-toast.com/) — Notifications

---

## 📝 License

MIT License — free to use and modify.
