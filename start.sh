#!/bin/bash
set -e

echo "============================================"
echo " CVision – AI-Powered CV Extractor"
echo " macOS/Linux Quick Start"
echo "============================================"

# Backend
cd backend

if [ ! -d "venv" ]; then
  echo "Creating virtual environment..."
  python3 -m venv venv
  source venv/bin/activate
  echo "Installing Python dependencies..."
  pip install -r requirements.txt
  python -m spacy download en_core_web_sm
else
  source venv/bin/activate
fi

echo ""
echo "Starting backend at http://localhost:8000 ..."
uvicorn main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

# Frontend
cd ../frontend
if [ ! -d "node_modules" ]; then
  echo "Installing Node.js dependencies..."
  npm install
fi

echo ""
echo "Starting frontend at http://localhost:3000 ..."
npm run dev &
FRONTEND_PID=$!

echo ""
echo "============================================"
echo " Backend:  http://localhost:8000"
echo " API Docs: http://localhost:8000/docs"
echo " Frontend: http://localhost:3000"
echo "============================================"
echo ""
echo "Press Ctrl+C to stop all servers."

wait $BACKEND_PID $FRONTEND_PID
