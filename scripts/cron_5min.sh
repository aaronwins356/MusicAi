#!/bin/bash
# 5-minute update script for live data during games

set -e

echo "[$(date)] Running 5-minute update cycle"

# Activate virtual environment
source venv/bin/activate

# Run live scraping and inference
python3 -c "
from inference.live_pipeline import LiveInferencePipeline
from utils import setup_logging

logger = setup_logging()
logger.info('Starting 5-minute update cycle')

pipeline = LiveInferencePipeline()
pipeline.update_cycle()

logger.info('5-minute update complete')
"

echo "[$(date)] Update cycle complete"
