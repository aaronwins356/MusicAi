# FightIQ-Football Usage Guide

## Quick Start

### 1. Installation

```bash
# Clone repository
git clone https://github.com/aaronwins356/NFL-IQ.git
cd NFL-IQ

# Launch the system (Linux/Mac)
bash scripts/launch_local.sh

# Or on Windows
scripts\launch_local.bat
```

The launch script will:
- Create a Python virtual environment
- Install all dependencies
- Set up directory structure
- Initialize the system
- Start the Streamlit dashboard at http://localhost:8501

### 2. First-Time Setup

The initial launch creates demo data. For full functionality:

```bash
# Activate environment
source venv/bin/activate  # Linux/Mac
# or
venv\Scripts\activate  # Windows

# Run full data pipeline
bash scripts/update_all.sh
```

---

## Dashboard Usage

### Home Page
- **Model Health:** Check system status and calibration
- **Data Freshness:** See when data was last updated
- **Quick Stats:** Overview of recent predictions

### Teams Page
- Select a team to view:
  - Current Elo rating and league rank
  - Elo trajectory over the season
  - Rolling offensive/defensive statistics
  - Team archetype and playing style

### Players Page
- View player profiles with:
  - Player Elo ratings by position
  - Weekly stat projections (mean, P10, P90)
  - Season statistics
  - Archetype classification (for QBs)

### Rankings & Elo
- **Team Elo:** Current rankings, conference breakdowns
- **Player Elo:** Position-specific leaderboards
- Filter and sort by multiple criteria

### Matchups
- **Select Teams:** Choose home and away teams
- **Predictions:** Win probability, spread, total
- **Score Distributions:** Visualize possible outcomes
- **Key Factors:** See what's driving the prediction
- **Archetype Matchup:** Style compatibility analysis

### Live Play-by-Play
- **Real-time Updates:** Refreshes every 5 minutes
- **Game Status:** Score, clock, quarter
- **Current Situation:** Down, distance, field position
- **Last Play:** Most recent play description
- **In-game Win Prob:** Updated probabilities (when available)

### Model Report
- **Performance Metrics:** Brier, AUC, calibration
- **Calibration Curves:** Visual assessment
- **Feature Importance:** Top predictive features
- **Historical Performance:** Trends over time

---

## Command-Line Usage

### Run Inference for Specific Week

```python
from inference.run_inference import run_weekly_inference

season = 2024
week = 15
run_weekly_inference(season, week)
```

Output saved to: `artifacts/projections/games_2024_W15.parquet`

### Update Elo Ratings

```python
from ratings.team_elo import TeamElo
import pandas as pd

# Load game results
games = pd.read_parquet('data/processed/schedules/schedule_2024.parquet')

# Compute Elo
elo = TeamElo()
# ... initialize and update
elo.save_history('artifacts/elo/team_elo_history.parquet')
```

### Run Clustering

```python
from features.clustering import ArchetypeClustering
import pandas as pd

# Load QB features
qb_features = pd.read_parquet('artifacts/datasets/qb_features.parquet')

# Cluster
clusterer = ArchetypeClustering()
qb_clustered = clusterer.cluster_qbs(qb_features)
clusterer.save_clusters('qb', qb_clustered, 'artifacts/clusters')
```

### Live Updates

```python
from inference.live_pipeline import LiveInferencePipeline

# Run once
pipeline = LiveInferencePipeline()
pipeline.update_cycle()

# Or run continuously (every 5 minutes)
pipeline.run_continuous()
```

---

## Automation

### Continuous Live Updates

#### Linux/Mac (crontab)

```bash
# Edit crontab
crontab -e

# Add this line for updates every 5 minutes during game windows
*/5 * * * * cd /path/to/NFL-IQ && bash scripts/cron_5min.sh >> logs/cron.log 2>&1
```

#### Windows (Task Scheduler)
1. Open Task Scheduler
2. Create Basic Task
3. Trigger: Repeat every 5 minutes
4. Action: Start Program
   - Program: `cmd.exe`
   - Arguments: `/c scripts\cron_5min.sh`
   - Start in: `C:\path\to\NFL-IQ`

### Weekly Full Updates

Run every Monday to refresh historical data:

```bash
# Monday at 2 AM
0 2 * * 1 cd /path/to/NFL-IQ && bash scripts/update_all.sh >> logs/update.log 2>&1
```

---

## Configuration

Edit `config/config.yaml` to customize:

### Data Collection
```yaml
scraping:
  delay_seconds: 2        # Delay between requests
  max_retries: 3          # Retry failed requests
  timeout_seconds: 30     # Request timeout
```

### Elo Settings
```yaml
elo:
  team:
    initial_rating: 1500
    k_factor: 20
    home_advantage: 50
  player:
    initial_rating: 1000
    k_factors:
      QB: 32
      WR: 20
```

### Model Training
```yaml
modeling:
  train_seasons: [2015, 2016, 2017, 2018, 2019, 2020]
  val_seasons: [2021, 2022]
  test_seasons: [2023, 2024]
```

---

## Data Access

### Load Predictions

```python
from utils import load_parquet
import glob

# Get latest predictions
pred_files = glob.glob('artifacts/projections/games_*.parquet')
latest = max(pred_files)
predictions = load_parquet(latest)

print(predictions[['home_team_id', 'away_team_id', 'home_win_prob']])
```

### Load Elo History

```python
elo_history = load_parquet('artifacts/elo/team_elo_history.parquet')

# Filter for specific team
kc_elo = elo_history[elo_history['team_id'] == 'KC']
print(kc_elo.tail())
```

### Load Live Game State

```python
from utils import load_json

live_games = load_json('artifacts/live/active_games.json')

for game_id, state in live_games.items():
    print(f"{game_id}: Q{state['quarter']} {state['time_remaining']}")
    print(f"  Score: {state['away_score']}-{state['home_score']}")
```

---

## Troubleshooting

### Dashboard Won't Start
```bash
# Check Python version (need 3.10+)
python3 --version

# Reinstall dependencies
pip install -r requirements.txt

# Try running directly
cd dashboard
streamlit run app.py
```

### Missing Data
```bash
# Run full update pipeline
bash scripts/update_all.sh

# Or create demo data
python3 -c "from utils import ensure_dir; ensure_dir('artifacts/projections')"
```

### Import Errors
```bash
# Add project to PYTHONPATH
export PYTHONPATH="${PYTHONPATH}:/path/to/NFL-IQ"

# Or use absolute imports in scripts
```

### Scraping Issues
- Check `logs/fightiq_*.log` for errors
- Verify internet connection
- Sites may have changed structure (update parsers)
- Respect rate limits (increase `delay_seconds` in config)

---

## Performance Optimization

### Speed Up Inference
- Use fewer features (edit feature builders)
- Reduce rolling window sizes
- Sample data for development

### Reduce Memory Usage
- Use polars instead of pandas for large files
- Process data in chunks
- Clear old cache files regularly

### Dashboard Performance
- Increase auto-refresh interval
- Cache loaded data with `@st.cache_data`
- Use smaller datasets for display

---

## Development

### Run Tests
```bash
pytest tests/
```

### Add New Features
1. Edit `features/build_team_features.py`
2. Add feature calculation logic
3. Update feature list in models
4. Retrain models

### Add New Model
1. Create model file in `modeling/`
2. Implement `train()`, `predict()`, `save()`, `load()`
3. Integrate in `inference/run_inference.py`
4. Update MODEL_CARD.md

---

## Support

### Common Questions

**Q: Can I use this for betting?**  
A: No. This system is for research and education only.

**Q: How accurate are the predictions?**  
A: Win probability has ~65% accuracy. See MODEL_CARD.md for details.

**Q: Can I add college football?**  
A: Yes, but requires new scrapers and historical data collection.

**Q: Is GPU required?**  
A: No. Models train on CPU in reasonable time.

**Q: Can I deploy to cloud?**  
A: Yes, but manage API rate limits and costs carefully.

---

## License & Disclaimer

This system is provided as-is for educational purposes.
- No warranty or guarantee of accuracy
- Not intended for commercial use or wagering
- Respects data source terms of service
- Users responsible for their own usage and compliance
