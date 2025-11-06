"""
Teams page - Team profiles, Elo trajectories, and statistics.
"""

import streamlit as st
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from utils import load_parquet
import pandas as pd
import plotly.graph_objects as go
import plotly.express as px

st.set_page_config(page_title="Teams - FightIQ", page_icon="🏈", layout="wide")

st.title("🏈 Team Profiles & Analysis")

# Team selector
teams = ['KC', 'BUF', 'SF', 'BAL', 'PHI', 'DAL', 'CIN', 'DET', 
         'MIA', 'LAC', 'GB', 'MIN', 'LAR', 'SEA', 'NO', 'TB',
         'ATL', 'CAR', 'NYG', 'WAS', 'CHI', 'DEN', 'LV', 'NE',
         'NYJ', 'TEN', 'HOU', 'IND', 'JAX', 'CLE', 'PIT', 'ARI']

selected_team = st.selectbox("Select Team", teams, index=0)

col1, col2, col3, col4 = st.columns(4)

with col1:
    st.metric("Current Elo", "1580", delta="+45")

with col2:
    st.metric("League Rank", "3rd", delta="↑2")

with col3:
    st.metric("Season Record", "10-3", delta="Win: 77%")

with col4:
    st.metric("Points/Game", "27.5", delta="+2.3")

# Elo trajectory
st.subheader(f"{selected_team} Elo Rating Trajectory")

try:
    # Try to load actual Elo history
    elo_df = load_parquet("artifacts/elo/team_elo_history.parquet")
    
    if elo_df is not None:
        team_elo = elo_df[elo_df['team_id'] == selected_team]
        
        if len(team_elo) > 0:
            fig = px.line(
                team_elo, 
                x='week', 
                y='elo_rating',
                title=f"{selected_team} Elo Over Time",
                labels={'week': 'Week', 'elo_rating': 'Elo Rating'}
            )
            st.plotly_chart(fig, use_container_width=True)
        else:
            st.info(f"No Elo data available for {selected_team}")
    else:
        # Placeholder chart
        import numpy as np
        weeks = list(range(1, 18))
        elo_values = 1500 + np.cumsum(np.random.randn(17) * 10)
        
        fig = go.Figure()
        fig.add_trace(go.Scatter(
            x=weeks, y=elo_values,
            mode='lines+markers',
            name='Elo Rating'
        ))
        fig.update_layout(
            title=f"{selected_team} Elo Trajectory (2024)",
            xaxis_title="Week",
            yaxis_title="Elo Rating",
            height=400
        )
        st.plotly_chart(fig, use_container_width=True)
        
except Exception as e:
    st.warning(f"Could not load Elo data: {e}")

# Team statistics
st.subheader("Rolling Statistics")

tab1, tab2, tab3 = st.tabs(["Offense", "Defense", "Special Teams"])

with tab1:
    st.markdown("### Offensive Metrics (Last 5 Games)")
    
    offense_stats = {
        'Metric': ['Points/Game', 'Yards/Game', 'Pass Yards/Game', 'Rush Yards/Game', '3rd Down %'],
        'Value': [27.5, 365.2, 245.8, 119.4, 42.5],
        'League Rank': [5, 8, 6, 12, 7]
    }
    st.dataframe(pd.DataFrame(offense_stats), use_container_width=True, hide_index=True)

with tab2:
    st.markdown("### Defensive Metrics (Last 5 Games)")
    
    defense_stats = {
        'Metric': ['Points Allowed/Game', 'Yards Allowed/Game', 'Sacks/Game', 'Turnovers/Game', '3rd Down %'],
        'Value': [19.8, 325.4, 2.8, 1.2, 38.5],
        'League Rank': [8, 12, 5, 15, 9]
    }
    st.dataframe(pd.DataFrame(defense_stats), use_container_width=True, hide_index=True)

with tab3:
    st.markdown("### Special Teams Metrics")
    st.info("Special teams statistics coming soon")

# Team archetype
st.subheader("Team Archetype")

st.markdown(f"""
**Offensive Style:** Balanced (Run: 45%, Pass: 55%)  
**Defensive Scheme:** Multiple front, 2-high safety  
**Pace:** Average (65 plays/game)  
**Key Strengths:** Red zone efficiency, 3rd down defense  
**Areas for Improvement:** Turnover differential
""")
