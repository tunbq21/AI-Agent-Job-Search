@echo off
echo Starting Backend and Frontend...
start cmd /k "cd backend && venv\Scripts\activate && python main.py"
start cmd /k "cd frontend && npm run dev"
echo Both servers are starting in separate windows.
pause
