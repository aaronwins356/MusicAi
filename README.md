# 🏈 FightIQ-Football (NFL)
**A fully local, AI-driven NFL analytics and prediction engine.**
Predicts win probabilities, spreads, scores, and player performance using scraped data, player/team Elo ratings, and unsupervised archetype clustering.

---

## ⚙️ System Overview
FightIQ-Football is a self-contained NFL intelligence system designed for **research, forecasting, and data visualization**.
It continuously scrapes public sources (no paid APIs) and updates every 5 minutes during live games.

### Core Features
- **NFL-only coverage** (2015–present).
- **Scraping-only data collection** — no API dependencies.
- **Predictive models** for:
  - Team **win probability**
  - **Score distributions** and **spread/total**
  - **Player stat projections** (QB, RB, WR, TE)
- **Player & Team Elo ratings**, where player-level performance influences team-level ratings.
- **Unsupervised clustering** for player, coach, and defense archetypes.
- **Streamlit dashboard** that auto-refreshes every 5 minutes and displays live scores, team rankings, projections, and model health.
- **Automated 5-minute update loop** for live data and inference.

---

## 🧩 Architecture
(See full README content above for details.)
