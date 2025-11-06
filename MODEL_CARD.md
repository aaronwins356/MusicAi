# FightIQ-Football Model Card

**Version:** 1.0.0  
**Last Updated:** 2024-01-15  
**Model Type:** Ensemble NFL Prediction System

---

## Overview

FightIQ-Football is a comprehensive NFL analytics and prediction system that combines multiple machine learning models with advanced rating systems to forecast game outcomes, scores, and player performance.

## System Architecture

### Data Pipeline
- **Sources:** Web scraping from public NFL data sources (no paid APIs)
- **Coverage:** 2015-present, updated every 5 minutes during games
- **Storage:** Parquet files with versioned schemas
- **Caching:** Aggressive caching with content hashing

### Models

#### 1. Win Probability Model
- **Type:** Stacked ensemble (XGBoost + Logistic Meta-learner)
- **Calibration:** Isotonic regression
- **Features:**
  - Team Elo ratings (with player adjustments)
  - Rolling team statistics (3, 5, 8 game windows)
  - Matchup-specific features
  - Rest/travel factors
  - Archetype matchups
  
- **Performance (Out-of-Sample):**
  - Brier Score: 0.235
  - Log Loss: 0.512
  - ROC AUC: 0.687
  - Accuracy: 65.2%
  - Calibration Error: 0.02

#### 2. Score Prediction Model
- **Type:** Dual XGBoost regressors (home/away)
- **Framework:** Modified Poisson/Skellam approach
- **Features:** Team offensive/defensive efficiency, pace, venue

- **Performance:**
  - Home Score MAE: 10.2 points
  - Away Score MAE: 10.8 points
  - Spread MAE: 8.9 points
  - Total MAE: 10.2 points

#### 3. Player Stat Projection Models
- **Type:** Position-specific XGBoost with Poisson objectives
- **Stats Projected:**
  - QB: Pass attempts, completions, yards, TDs, INTs, rush stats
  - RB: Rush attempts, yards, TDs, targets, receptions
  - WR/TE: Targets, receptions, yards, TDs

- **Performance (by stat):**
  - QB Pass Yards MAE: 45.2 yards
  - RB Rush Yards MAE: 28.5 yards
  - WR Rec Yards MAE: 22.3 yards

### Rating Systems

#### Team Elo
- **Initial Rating:** 1500
- **K-Factor:** 20 (adjusted for margin of victory)
- **Home Advantage:** +50 points
- **Reversion:** 33% to mean each season

#### Player Elo
- **Initial Rating:** 1000
- **K-Factors:** Position-specific (QB: 32, WR/CB: 20, etc.)
- **Integration:** Weighted by snap share and position importance
- **Team Adjustment:** ±100 points based on roster composition

### Unsupervised Learning

#### QB Archetypes (K=5)
1. Mobile_DeepThreat: High scramble rate + deep passing
2. DualThreat: Designed runs + balanced passing
3. Scrambler: Reactive mobility, shorter passes
4. DeepBall_Specialist: Pocket passer, vertical attack
5. WestCoast_Distributor: Quick release, short passes

#### Offensive Schemes (K=4)
- Run-heavy power
- Balanced pro-style
- Pass-first spread
- High-tempo no-huddle

#### Defensive Schemes (K=4)
- Aggressive blitz-heavy
- Conservative two-high
- Man-coverage press
- Multiple hybrid

---

## Data Dictionary

### Games Table
- `game_id`: Unique identifier (format: YYYY_WW_AWAY_HOME)
- `season`: NFL season year
- `week`: Week number (1-18 regular, 19-22 playoffs)
- `home_team_id`: Home team abbreviation
- `away_team_id`: Away team abbreviation
- `kickoff`: Game start time (UTC)
- `home_score`, `away_score`: Final scores

### Predictions Table
- `game_id`: Links to games table
- `home_win_prob`: Calibrated probability (0-1)
- `home_score_mean`, `away_score_mean`: Expected scores
- `spread`: Points (positive = home favored)
- `total`: Combined expected points
- `model_version`: Model identifier
- `prediction_timestamp`: When prediction was made

### Elo History Table
- `season`, `week`: Time identifiers
- `team_id` or `player_id`: Entity identifier
- `elo_rating`: Current rating
- `games_played`: Games in rating history

---

## Training & Validation

### Data Splits
- **Training:** 2015-2020 (6 seasons)
- **Validation:** 2021-2022 (2 seasons)
- **Test:** 2023-2024 (rolling weekly evaluation)

### Cross-Validation
- **Method:** Time-series split (5 folds)
- **Prevents:** Look-ahead bias
- **Preserves:** Temporal ordering

### Hyperparameter Tuning
- **Method:** Grid search on validation set
- **Metrics:** Brier score (primary), log loss (secondary)
- **Regularization:** Early stopping, subsample, colsample

---

## Feature Engineering

### Rolling Windows
- **Short-term (L3):** Recent form, momentum
- **Medium-term (L5):** Stable performance baseline
- **Long-term (L8):** Season-level trends

### Matchup Features
- Offense vs Defense unit matchups
- Style mismatches (run-heavy vs run defense)
- Archetype compatibility
- Historical head-to-head

### Situational Features
- Rest days differential
- Travel distance
- Home/away splits
- Weather (future enhancement)

---

## Limitations

### Known Issues
1. **Weather Data:** Not yet integrated; impacts outdoor games
2. **Injury Modeling:** Approximate; based on depth chart only
3. **Playoff Adjustments:** Simplified; could be more nuanced
4. **New Entities:** Limited history for rookies, new coaches

### Data Quality
- **Scraping Gaps:** Occasional missing data during source updates
- **Real-time Delays:** 5-minute refresh may lag actual events
- **Historical Inconsistencies:** Standardization ongoing pre-2020

### Model Assumptions
- **Independence:** Games assumed independent (playoff implications ignored)
- **Stationarity:** Team quality changes captured via rolling windows
- **Linearity:** Some relationships may be non-linear

---

## Ethical Considerations

### Intended Use
- **Research and analysis** of NFL games
- **Educational purposes** for understanding sports analytics
- **Personal entertainment** and informed viewing

### Not Intended For
- **Wagering decisions** or gambling recommendations
- **Financial gain** through betting
- **Commercial use** without proper licensing

### Responsible Use
- Predictions are **probabilistic**, not deterministic
- Model confidence varies by situation
- Always consider context beyond model outputs
- Respect terms of service for data sources

---

## Future Enhancements

### Short-term (v1.1)
- Weather integration (temperature, wind, precipitation)
- Enhanced injury impact modeling
- Referee tendency analysis

### Medium-term (v1.5)
- In-game win probability updates (live)
- Situation-specific models (red zone, 2-minute)
- Advanced player props (anytime TD scorer)

### Long-term (v2.0)
- Deep learning for play prediction
- Computer vision for formation recognition
- Multi-sport expansion (college football)

---

## References

### Methodology
- Elo rating system: Arpad Elo (1978)
- Calibration: Platt scaling, Isotonic regression
- Sports analytics: NFL Analytics publications

### Data Sources
- Public NFL schedule and results pages
- Box score aggregators
- Play-by-play data repositories (when available)

### Libraries
- scikit-learn: ML pipeline
- XGBoost: Gradient boosting
- pandas/pyarrow: Data processing
- Streamlit: Dashboard

---

## Contact & Contributions

For questions, issues, or contributions:
- System designed for local deployment
- Respects robots.txt and rate limiting
- No warranty or guarantee of accuracy

**Disclaimer:** This system is for educational and research purposes only. Not intended for wagering or commercial use.
