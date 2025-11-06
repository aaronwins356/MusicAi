"""
Players page - Player stats, projections, and Elo ratings.
"""

import streamlit as st
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from utils import load_parquet
import pandas as pd
import plotly.graph_objects as go

st.set_page_config(page_title="Players - FightIQ", page_icon="👤", layout="wide")

st.title("👤 Player Profiles & Projections")

# Position filter
position = st.selectbox("Position", ["QB", "RB", "WR", "TE", "All"])

# Sample players
players_data = {
    'Player': ['Patrick Mahomes', 'Josh Allen', 'Tyreek Hill', 'Christian McCaffrey'],
    'Team': ['KC', 'BUF', 'MIA', 'SF'],
    'Position': ['QB', 'QB', 'WR', 'RB'],
    'Player Elo': [1250, 1235, 1180, 1195],
    'Rank': [1, 2, 3, 8]
}

st.subheader("Top Players")
st.dataframe(pd.DataFrame(players_data), use_container_width=True, hide_index=True)

# Player detail
st.subheader("Player Detail: Patrick Mahomes")

col1, col2, col3, col4 = st.columns(4)

with col1:
    st.metric("Player Elo", "1250", delta="+15")

with col2:
    st.metric("Position Rank", "1st", delta="QB")

with col3:
    st.metric("Games Played", "13", delta="100%")

with col4:
    st.metric("Archetype", "Mobile_DeepThreat")

# Weekly projections
st.subheader("Week 15 Projections")

proj_col1, proj_col2 = st.columns(2)

with proj_col1:
    st.markdown("**Passing**")
    proj_pass = {
        'Stat': ['Attempts', 'Completions', 'Yards', 'TDs', 'INTs'],
        'Mean': [38.5, 26.2, 285.0, 2.3, 0.8],
        'P10': [32, 21, 220, 1, 0],
        'P90': [45, 31, 350, 4, 2]
    }
    st.dataframe(pd.DataFrame(proj_pass), use_container_width=True, hide_index=True)

with proj_col2:
    st.markdown("**Rushing**")
    proj_rush = {
        'Stat': ['Attempts', 'Yards', 'TDs'],
        'Mean': [4.5, 28.0, 0.3],
        'P10': [2, 10, 0],
        'P90': [7, 45, 1]
    }
    st.dataframe(pd.DataFrame(proj_rush), use_container_width=True, hide_index=True)

# Player Elo history
st.subheader("Player Elo History")

import numpy as np
weeks = list(range(1, 14))
elo_history = 1200 + np.cumsum(np.random.randn(13) * 8)

fig = go.Figure()
fig.add_trace(go.Scatter(
    x=weeks, y=elo_history,
    mode='lines+markers',
    name='Player Elo'
))
fig.update_layout(
    title="Patrick Mahomes - 2024 Elo Trajectory",
    xaxis_title="Week",
    yaxis_title="Player Elo",
    height=400
)
st.plotly_chart(fig, use_container_width=True)

# Season stats
st.subheader("2024 Season Statistics")

season_stats = {
    'Category': ['Passing Yards', 'Passing TDs', 'Interceptions', 'Completion %', 'Passer Rating', 'Rush Yards', 'Rush TDs'],
    'Total': [3450, 28, 9, 67.8, 105.2, 285, 3],
    'Per Game': [265.4, 2.2, 0.7, 67.8, 105.2, 21.9, 0.2]
}
st.dataframe(pd.DataFrame(season_stats), use_container_width=True, hide_index=True)
