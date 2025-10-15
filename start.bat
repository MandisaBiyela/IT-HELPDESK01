@echo off
REM Start the Helpdesk application

cd /d "%~dp0"

echo Starting Ndabase IT Helpdesk...
echo.

REM Check if virtual environment exists
if not exist venv (
    echo ERROR: Virtual environment not found!
    echo Please run setup.bat first.
    pause
    exit /b 1
)

REM Check if .env exists
if not exist .env (
    echo ERROR: .env file not found!
    echo Please copy .env.example to .env and configure it.
    pause
    exit /b 1
)

REM Activate virtual environment
call venv\Scripts\activate

REM Start the server
echo Server starting on http://localhost:8000
echo.
echo Access the application:
echo - Frontend: http://localhost:8000/static/index.html
echo - API Docs: http://localhost:8000/docs
echo.
echo Press Ctrl+C to stop the server
echo.

python run_server.py
