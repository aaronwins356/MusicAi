"""
Live inference pipeline that runs every 5 minutes.
Updates predictions based on live game state.
"""

import logging
import time
from datetime import datetime
from datasources.scrape_live import LiveScraper, run_live_update
from inference.run_inference import run_weekly_inference
from utils import get_current_nfl_week

logger = logging.getLogger(__name__)


class LiveInferencePipeline:
    """Pipeline for live game updates."""
    
    def __init__(self):
        self.scraper = LiveScraper()
        self.update_interval = 300  # 5 minutes
    
    def update_cycle(self):
        """Run one update cycle."""
        logger.info("Starting live update cycle")
        
        try:
            # Update live game data
            run_live_update()
            
            # Run inference for current week
            season, week = get_current_nfl_week()
            run_weekly_inference(season, week)
            
            logger.info("Live update cycle complete")
            
        except Exception as e:
            logger.error(f"Error in live update cycle: {e}", exc_info=True)
    
    def run_continuous(self):
        """Run continuous update loop."""
        logger.info("Starting continuous live pipeline")
        
        while True:
            self.update_cycle()
            
            logger.info(f"Sleeping for {self.update_interval} seconds")
            time.sleep(self.update_interval)


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    
    pipeline = LiveInferencePipeline()
    
    # For testing, run once
    pipeline.update_cycle()
    
    print("\nLive pipeline test complete!")
    
    # To run continuously:
    # pipeline.run_continuous()
