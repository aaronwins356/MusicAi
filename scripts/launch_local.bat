@echo off
REM Launch script for FightIQ-Football system (Windows)

echo ============================================
echo   FightIQ-Football Launch Script (Windows)
echo ============================================

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo Error: Python not found. Please install Python 3.10+
    pause
    exit /b 1
)

REM Create virtual environment if it doesn't exist
if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
)

REM Activate virtual environment
echo Activating virtual environment...
call venv\Scripts\activate.bat

REM Install/upgrade dependencies
echo Installing dependencies...
python -m pip install --upgrade pip
pip install -r requirements.txt

REM Create necessary directories
echo Setting up directory structure...
if not exist "data\raw" mkdir data\raw
if not exist "data\external" mkdir data\external
if not exist "data\interim" mkdir data\interim
if not exist "data\processed" mkdir data\processed
if not exist "artifacts\datasets" mkdir artifacts\datasets
if not exist "artifacts\models" mkdir artifacts\models
if not exist "artifacts\elo" mkdir artifacts\elo
if not exist "artifacts\clusters" mkdir artifacts\clusters
if not exist "artifacts\projections" mkdir artifacts\projections
if not exist "artifacts\reports" mkdir artifacts\reports
if not exist "artifacts\live" mkdir artifacts\live
if not exist "logs" mkdir logs

REM Initialize configuration
echo Checking configuration...
if not exist "config\config.yaml" (
    echo Error: config\config.yaml not found
    pause
    exit /b 1
)

REM Launch dashboard
echo.
echo ==========================================
echo   Launching Streamlit dashboard...
echo ==========================================
echo.
echo Dashboard will open at http://localhost:8501
echo Press Ctrl+C to stop the dashboard
echo.

cd dashboard
streamlit run app.py --server.port=8501 --server.address=localhost
