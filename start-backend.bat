@echo off
echo ============================================
echo  CVision - AI-Powered CV Extractor
echo  Starting Backend API Server...
echo ============================================
cd /d "%~dp0backend"

IF NOT EXIST "venv\Scripts\activate.bat" (
    echo Creating virtual environment...
    python -m venv venv
    call venv\Scripts\activate.bat
    echo Installing dependencies...
    pip install -r requirements.txt
    python -m spacy download en_core_web_sm
) ELSE (
    call venv\Scripts\activate.bat
)

echo.
echo Backend running at: http://localhost:8000
echo API Docs at:         http://localhost:8000/docs
echo.
uvicorn main:app --reload --host 0.0.0.0 --port 8000
