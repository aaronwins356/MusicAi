"""
Rankings & Elo page - Team and player Elo leaderboards.
"""

import streamlit as st
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from utils import load_parquet
import pandas as pd

st.set_page_config(page_title="Rankings - FightIQ", page_icon="📊", layout="wide")

st.title("📊 Rankings & Elo Leaderboards")

tab1, tab2 = st.tabs(["Team Elo", "Player Elo"])

with tab1:
    st.subheader("Team Elo Rankings")
    
    # Sample team Elo data
    team_elo_data = {
        'Rank': list(range(1, 11)),
        'Team': ['SF', 'KC', 'BAL', 'BUF', 'PHI', 'DAL', 'DET', 'MIA', 'CIN', 'LAC'],
        'Elo Rating': [1615, 1595, 1580, 1575, 1560, 1545, 1540, 1535, 1525, 1520],
        'Change': ['+25', '+18', '+12', '-5', '+8', '+15', '+22', '-8', '+5', '+10'],
        'Record': ['11-2', '10-3', '10-3', '9-4', '10-3', '9-4', '9-4', '9-4', '8-5', '8-5']
    }
    
    st.dataframe(pd.DataFrame(team_elo_data), use_container_width=True, hide_index=True)
    
    # Conference breakdown
    st.subheader("By Conference")
    
    col1, col2 = st.columns(2)
    
    with col1:
        st.markdown("**AFC Top 5**")
        afc_data = {
            'Rank': [1, 2, 3, 4, 5],
            'Team': ['KC', 'BAL', 'BUF', 'MIA', 'CIN'],
            'Elo': [1595, 1580, 1575, 1535, 1525]
        }
        st.dataframe(pd.DataFrame(afc_data), use_container_width=True, hide_index=True)
    
    with col2:
        st.markdown("**NFC Top 5**")
        nfc_data = {
            'Rank': [1, 2, 3, 4, 5],
            'Team': ['SF', 'PHI', 'DAL', 'DET', 'LAR'],
            'Elo': [1615, 1560, 1545, 1540, 1510]
        }
        st.dataframe(pd.DataFrame(nfc_data), use_container_width=True, hide_index=True)

with tab2:
    st.subheader("Player Elo Rankings")
    
    # Position selector
    position_filter = st.selectbox("Filter by Position", ["All", "QB", "RB", "WR", "TE", "Defense"])
    
    # Sample player Elo data
    player_elo_data = {
        'Rank': list(range(1, 11)),
        'Player': ['Patrick Mahomes', 'Josh Allen', 'Jalen Hurts', 'Tyreek Hill', 
                  'Christian McCaffrey', 'Travis Kelce', 'Justin Jefferson', 'Micah Parsons',
                  'Nick Bosa', 'Sauce Gardner'],
        'Team': ['KC', 'BUF', 'PHI', 'MIA', 'SF', 'KC', 'MIN', 'DAL', 'SF', 'NYJ'],
        'Position': ['QB', 'QB', 'QB', 'WR', 'RB', 'TE', 'WR', 'LB', 'DL', 'CB'],
        'Player Elo': [1250, 1235, 1225, 1180, 1195, 1175, 1185, 1165, 1170, 1155],
        'Games': [13, 13, 13, 13, 12, 13, 13, 13, 11, 13]
    }
    
    st.dataframe(pd.DataFrame(player_elo_data), use_container_width=True, hide_index=True)
    
    # Position-specific leaderboards
    st.subheader(f"Top Quarterbacks")
    
    qb_data = {
        'Rank': [1, 2, 3, 4, 5],
        'Player': ['Patrick Mahomes', 'Josh Allen', 'Jalen Hurts', 'Lamar Jackson', 'Joe Burrow'],
        'Team': ['KC', 'BUF', 'PHI', 'BAL', 'CIN'],
        'Elo': [1250, 1235, 1225, 1215, 1205],
        'Archetype': ['Mobile_DeepThreat', 'DualThreat', 'DualThreat', 'DualThreat', 'WestCoast_Distributor']
    }
    st.dataframe(pd.DataFrame(qb_data), use_container_width=True, hide_index=True)

# Historical Elo leaders
st.subheader("Historical Peak Elo Ratings")

historical_data = {
    'Season': [2019, 2020, 2021, 2022, 2023],
    'Team': ['BAL', 'KC', 'GB', 'BUF', 'SF'],
    'Peak Elo': [1680, 1665, 1640, 1630, 1625],
    'Player (QB)': ['L. Jackson', 'P. Mahomes', 'A. Rodgers', 'J. Allen', 'B. Purdy'],
    'Peak Player Elo': [1280, 1265, 1255, 1250, 1240]
}
st.dataframe(pd.DataFrame(historical_data), use_container_width=True, hide_index=True)
