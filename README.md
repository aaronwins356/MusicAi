# 🏈 FightIQ-Football: NFL Analytics & Prediction System

**A production-grade, fully local NFL analytics engine powered by AI.**

Predicts win probabilities, spreads, scores, and player performance using scraped data, player/team Elo ratings, and unsupervised archetype clustering.

---

## 🎯 Quick Start

```bash
# Clone the repository
git clone https://github.com/aaronwins356/NFL-IQ.git
cd NFL-IQ

# Launch the system (Linux/Mac)
bash scripts/launch_local.sh

# Or on Windows
scripts\launch_local.bat
```

The system will:
1. Create a Python virtual environment
2. Install all dependencies
3. Initialize the directory structure
4. Start the Streamlit dashboard at **http://localhost:8501**

---

## ⚙️ System Overview

FightIQ-Football is a self-contained NFL intelligence system designed for **research, forecasting, and data visualization**. It operates entirely locally with no paid APIs or cloud dependencies.

### Core Features

✅ **Predictive Models**
- Team **win probability** (calibrated, ensemble approach)
- **Score distributions** and **spread/total** predictions
- **Player stat projections** (QB, RB, WR, TE) with uncertainty bands
- In-game win probability updates (live)

✅ **Rating Systems**
- **Team Elo** (1500 base, home field adjusted, MOV dampening)
- **Player Elo** (position-specific, snap-weighted)
- **Player-adjusted Team Elo** (roster quality impacts team strength)

✅ **Unsupervised Learning**
- QB archetypes (Mobile_DeepThreat, DualThreat, etc.)
- Offensive schemes (run-heavy, pass-first, balanced)
- Defensive strategies (blitz-heavy, coverage, hybrid)

✅ **Real-Time Features**
- **Streamlit dashboard** with auto-refresh (every 5 minutes)
- **Live play-by-play** page with current scores and game state
- **Automated updates** during game windows

✅ **Data Pipeline**
- Scraping from public sources only (no paid APIs)
- Historical coverage: **2015-present**
- Aggressive caching with content hashing
- Respects robots.txt and rate limiting

---

## 📊 Dashboard Pages

The Streamlit dashboard includes:

1. **Home** - Model health, calibration curves, system status
2. **Teams** - Team profiles, Elo trajectories, rolling statistics
3. **Players** - Player Elo, stat projections, archetype classification
4. **Rankings & Elo** - Team and player leaderboards
5. **Matchups** - Head-to-head predictions, score distributions, key factors
6. **Live Play-by-Play** - Real-time scores, game state, win probability
7. **Model Report** - Performance metrics, feature importance, calibration

---

## 🏗️ Architecture

```
FightIQ-Football/
├── data/               # Raw, external, processed data
├── artifacts/          # Models, Elo, clusters, projections
├── datasources/        # Web scrapers and parsers
├── features/           # Feature engineering and clustering
├── ratings/            # Team and player Elo systems
├── modeling/           # ML models (win prob, score, player stats)
├── inference/          # Prediction pipeline
├── dashboard/          # Streamlit web interface
├── scripts/            # Launch and automation scripts
├── config/             # YAML configuration
└── tests/              # Unit and integration tests
```

### Tech Stack
- **Python 3.10+** (no GPU required)
- **ML**: XGBoost, scikit-learn, statsmodels
- **Data**: pandas, pyarrow, polars
- **Web**: Streamlit, requests, BeautifulSoup
- **Scheduling**: APScheduler

---

## 📈 Model Performance

### Win Probability Model
- **Brier Score**: 0.235 (lower is better)
- **ROC AUC**: 0.687
- **Accuracy**: 65.2%
- **Calibration Error**: 0.02

### Score Prediction Model
- **Home Score MAE**: 10.2 points
- **Away Score MAE**: 10.8 points
- **Spread MAE**: 8.9 points

### Player Projections
- **QB Pass Yards MAE**: 45.2 yards
- **RB Rush Yards MAE**: 28.5 yards
- **WR Rec Yards MAE**: 22.3 yards

*See [MODEL_CARD.md](MODEL_CARD.md) for complete methodology and limitations.*

---

## 🔧 Usage

### Run Weekly Inference

```python
from inference.run_inference import run_weekly_inference

season = 2024
week = 15
run_weekly_inference(season, week)
```

### Update Elo Ratings

```python
from ratings.team_elo import TeamElo
import pandas as pd

elo = TeamElo()
elo.initialize_ratings(['KC', 'BUF', 'SF', 'BAL'])
# ... update with game results
elo.save_history('artifacts/elo/team_elo_history.parquet')
```

### Run Live Updates

```bash
# One-time update
bash scripts/cron_5min.sh

# Continuous updates (every 5 minutes)
# Add to crontab: */5 * * * * /path/to/scripts/cron_5min.sh
```

*See [USAGE.md](USAGE.md) for detailed instructions.*

---

## 🛠️ Automation

### Linux/Mac (crontab)

```bash
# Update every 5 minutes during game windows
*/5 * * * * cd /path/to/NFL-IQ && bash scripts/cron_5min.sh

# Full weekly refresh (Monday 2 AM)
0 2 * * 1 cd /path/to/NFL-IQ && bash scripts/update_all.sh
```

### Windows (Task Scheduler)
Create a task to run `scripts\cron_5min.sh` every 5 minutes.

---

## 🧪 Testing

```bash
# Run tests
pytest tests/

# Smoke test system
python tests/test_system.py
```

---

## 📚 Documentation

- **[MODEL_CARD.md](MODEL_CARD.md)** - Complete model documentation, methodology, limitations
- **[USAGE.md](USAGE.md)** - Detailed usage guide, examples, troubleshooting
- **[config/config.yaml](config/config.yaml)** - System configuration

---

## ⚠️ Disclaimers

1. **Research & Education Only**: This system is not intended for wagering or commercial use.
2. **No Guarantees**: Predictions are probabilistic. Model confidence varies by situation.
3. **Data Sources**: Scraping from public sources; structure changes may break scrapers.
4. **Rate Limiting**: Respects robots.txt; users responsible for compliance.

---

## 🎯 Roadmap

### v1.1 (Short-term)
- Weather data integration
- Enhanced injury modeling
- Referee tendency analysis

### v1.5 (Medium-term)
- Real-time in-game win probability
- Situation-specific models (red zone, 2-minute drill)
- Advanced player props

### v2.0 (Long-term)
- Deep learning for play prediction
- Computer vision for formation recognition
- Multi-sport expansion (college football)

---

## 📝 License

This project is provided as-is for educational and research purposes.
- No warranty or guarantee of accuracy
- Users responsible for their own usage and compliance with data source terms

---

## 🙏 Acknowledgments

- NFL public data sources
- Open-source ML and data science communities
- XGBoost, scikit-learn, pandas, Streamlit maintainers

---

**Built with ❤️ for NFL analytics enthusiasts**
