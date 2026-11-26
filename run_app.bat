@echo off
echo Starting AquaGuard AI Backend (FastAPI on port 8000)...
start "AquaGuard Backend" cmd /k "cd /d %~dp0backend && uvicorn app.main:app --reload --port 8000"

timeout /t 3 /nobreak >nul

echo Starting AquaGuard AI Frontend (Vite on port 5173)...
start "AquaGuard Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo AquaGuard AI is launching! Open http://localhost:5173 in your browser.
