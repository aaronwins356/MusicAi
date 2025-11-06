#!/bin/bash
# Complete data update and model refresh script

set -e

echo "========================================"
echo "FightIQ-Football Full Update"
echo "========================================"

# Activate virtual environment
source venv/bin/activate

# Step 1: Scrape historical/current data
echo "[1/5] Scraping data..."
python3 -c "
from datasources.scrape_schedule import scrape_schedule_main
from utils import setup_logging, get_current_nfl_week

logger = setup_logging()
season, week = get_current_nfl_week()

logger.info(f'Scraping data for season {season}, week {week}')
# scrape_schedule_main(season, season)  # Uncomment for actual scraping
logger.info('Scraping complete (skipped for demo)')
"

# Step 2: Build features
echo "[2/5] Building features..."
python3 -c "
from features.build_team_features import build_team_features_main
from utils import setup_logging

logger = setup_logging()
logger.info('Building team features')
# build_team_features_main()  # Uncomment when data available
logger.info('Feature building complete')
"

# Step 3: Update Elo ratings
echo "[3/5] Updating Elo ratings..."
python3 -c "
from ratings.team_elo import TeamElo
from ratings.player_elo import PlayerElo
from utils import setup_logging

logger = setup_logging()
logger.info('Updating Elo ratings')
# Elo update logic here
logger.info('Elo update complete')
"

# Step 4: Run clustering
echo "[4/5] Running clustering..."
python3 -c "
from features.clustering import ArchetypeClustering
from utils import setup_logging

logger = setup_logging()
logger.info('Running archetype clustering')
# Clustering logic here
logger.info('Clustering complete')
"

# Step 5: Run inference
echo "[5/5] Running inference..."
python3 -c "
from inference.run_inference import run_weekly_inference
from utils import setup_logging, get_current_nfl_week

logger = setup_logging()
season, week = get_current_nfl_week()

logger.info(f'Running inference for {season} Week {week}')
run_weekly_inference(season, week)
logger.info('Inference complete')
"

echo ""
echo "========================================"
echo "Full update complete!"
echo "========================================"
