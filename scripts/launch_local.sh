#!/bin/bash
# Launch script for FightIQ-Football system (Linux/Mac)

set -e  # Exit on error

echo "🏈 FightIQ-Football Launch Script"
echo "=================================="

# Check Python version
python_version=$(python3 --version 2>&1 | awk '{print $2}')
echo "Python version: $python_version"

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Install/upgrade dependencies
echo "Installing dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

# Create necessary directories
echo "Setting up directory structure..."
mkdir -p data/{raw,external,interim,processed}
mkdir -p artifacts/{datasets,models,elo,clusters,projections,reports,live}
mkdir -p logs

# Initialize configuration
echo "Checking configuration..."
if [ ! -f "config/config.yaml" ]; then
    echo "Error: config/config.yaml not found"
    exit 1
fi

# Run initial data collection (minimal for demo)
echo "Running initial setup..."
python3 -c "
from utils import setup_logging, Config
import sys

logger = setup_logging()
logger.info('FightIQ-Football initialization')

config = Config()
config.load()
logger.info(f'System: {config.get(\"system.name\")}')
logger.info(f'Version: {config.get(\"system.version\")}')
logger.info('Configuration loaded successfully')
"

# Create dummy model artifacts for demo
echo "Setting up demo artifacts..."
python3 -c "
import numpy as np
import pandas as pd
from utils import save_parquet, save_json, ensure_dir

# Create sample schedule
ensure_dir('data/processed/schedules')
schedule = pd.DataFrame({
    'game_id': ['2024_14_KC_BUF', '2024_14_SF_SEA'],
    'season': [2024, 2024],
    'week': [14, 14],
    'home_team_id': ['KC', 'SF'],
    'away_team_id': ['BUF', 'SEA']
})
save_parquet(schedule, 'data/processed/schedules/schedule_2024.parquet')

# Create sample Elo history
ensure_dir('artifacts/elo')
teams = ['KC', 'BUF', 'SF', 'BAL', 'PHI', 'DAL']
elo_data = []
for team in teams:
    for week in range(1, 15):
        elo_data.append({
            'season': 2024,
            'week': week,
            'team_id': team,
            'elo_rating': 1500 + np.random.randint(-100, 100)
        })
elo_df = pd.DataFrame(elo_data)
save_parquet(elo_df, 'artifacts/elo/team_elo_history.parquet')

print('Demo artifacts created')
"

# Launch dashboard
echo ""
echo "======================================"
echo "🚀 Launching Streamlit dashboard..."
echo "======================================"
echo ""
echo "Dashboard will open in your browser at http://localhost:8501"
echo "Press Ctrl+C to stop the dashboard"
echo ""

# Launch Streamlit
cd dashboard
streamlit run app.py --server.port=8501 --server.address=localhost
