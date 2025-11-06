"""
Matchups page - Game predictions and analysis.
"""

import streamlit as st
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from utils import load_parquet
import pandas as pd
import plotly.graph_objects as go
import numpy as np

st.set_page_config(page_title="Matchups - FightIQ", page_icon="⚔️", layout="wide")

st.title("⚔️ Game Matchups & Predictions")

# Team selector
col1, col2 = st.columns(2)

teams = ['KC', 'BUF', 'SF', 'BAL', 'PHI', 'DAL', 'CIN', 'DET']

with col1:
    home_team = st.selectbox("Home Team", teams, index=0)

with col2:
    away_team = st.selectbox("Away Team", teams, index=1)

st.markdown("---")

# Game prediction
st.header(f"{away_team} @ {home_team}")

# Main prediction metrics
metric_col1, metric_col2, metric_col3, metric_col4 = st.columns(4)

with metric_col1:
    st.metric("Home Win Prob", "58.5%", delta="↑ 8.5%")

with metric_col2:
    st.metric("Model Spread", f"{home_team} -2.5", delta="Fair line")

with metric_col3:
    st.metric("Projected Total", "47.5", delta="Over/Under")

with metric_col4:
    st.metric("Confidence", "Medium", delta="75%")

# Score distribution
st.subheader("Predicted Score Distribution")

# Create score distribution visualization
home_mean = 25.0
away_mean = 22.5
std = 7.0

scores = np.linspace(0, 50, 100)
home_dist = np.exp(-0.5 * ((scores - home_mean) / std) ** 2)
away_dist = np.exp(-0.5 * ((scores - away_mean) / std) ** 2)

fig = go.Figure()
fig.add_trace(go.Scatter(
    x=scores, y=home_dist,
    mode='lines',
    name=f'{home_team} (Home)',
    fill='tozeroy',
    line=dict(color='blue')
))
fig.add_trace(go.Scatter(
    x=scores, y=away_dist,
    mode='lines',
    name=f'{away_team} (Away)',
    fill='tozeroy',
    line=dict(color='red')
))

fig.update_layout(
    title="Score Distribution",
    xaxis_title="Points",
    yaxis_title="Probability Density",
    height=400
)

st.plotly_chart(fig, use_container_width=True)

# Score probabilities
st.subheader("Score Percentiles")

score_col1, score_col2 = st.columns(2)

with score_col1:
    st.markdown(f"**{home_team} (Home) Projected Score**")
    home_scores = {
        'Percentile': ['10th', '25th', '50th (Median)', '75th', '90th'],
        'Score': [17, 21, 25, 29, 33]
    }
    st.dataframe(pd.DataFrame(home_scores), use_container_width=True, hide_index=True)

with score_col2:
    st.markdown(f"**{away_team} (Away) Projected Score**")
    away_scores = {
        'Percentile': ['10th', '25th', '50th (Median)', '75th', '90th'],
        'Score': [15, 19, 23, 27, 31]
    }
    st.dataframe(pd.DataFrame(away_scores), use_container_width=True, hide_index=True)

# Feature importance
st.subheader("Key Matchup Factors")

matchup_col1, matchup_col2 = st.columns(2)

with matchup_col1:
    st.markdown(f"**{home_team} Advantages:**")
    st.markdown("""
    - ✅ Home field (+3 pts expected)
    - ✅ Better pass defense (Rank 5 vs 12)
    - ✅ Recent form (4-1 L5 vs 3-2)
    - ⚠️ Injury to key WR
    """)

with matchup_col2:
    st.markdown(f"**{away_team} Advantages:**")
    st.markdown("""
    - ✅ Higher offensive efficiency
    - ✅ Better 3rd down conversion
    - ⚠️ Worse rush defense
    - ⚠️ Road performance (3-4)
    """)

# Archetype matchup
st.subheader("Archetype Matchup")

arch_col1, arch_col2 = st.columns(2)

with arch_col1:
    st.markdown(f"""
    **{home_team} Style:**
    - QB: Mobile_DeepThreat
    - Offense: Balanced, high tempo
    - Defense: Multiple front, 2-high
    """)

with arch_col2:
    st.markdown(f"""
    **{away_team} Style:**
    - QB: DualThreat
    - Offense: Pass-heavy, quick tempo
    - Defense: Aggressive blitz, man coverage
    """)

# Historical matchups
st.subheader("Recent Head-to-Head")

h2h_data = {
    'Date': ['2024-09-15', '2023-12-10', '2023-01-29'],
    'Winner': [home_team, away_team, home_team],
    'Score': [f'{home_team} 27-24', f'{away_team} 30-21', f'{home_team} 38-35'],
    'Location': ['Home', 'Away', 'Neutral']
}
st.dataframe(pd.DataFrame(h2h_data), use_container_width=True, hide_index=True)

# Betting market comparison (if available)
with st.expander("⚠️ Market Lines (Reference Only)"):
    st.markdown("""
    **Disclaimer:** This system does not recommend betting. Market lines shown for comparison only.
    
    Model predictions may differ from market consensus. Use for analysis purposes only.
    """)
