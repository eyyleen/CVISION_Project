@echo off
echo ============================================
echo  CVision - AI-Powered CV Extractor
echo  Starting Frontend Dev Server...
echo ============================================
cd /d "%~dp0frontend"

IF NOT EXIST "node_modules" (
    echo Installing Node.js dependencies...
    npm install
)

echo.
echo Frontend running at: http://localhost:3000
echo.
npm run dev
