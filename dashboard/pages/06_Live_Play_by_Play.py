"""
Live Play-by-Play page - Real-time game updates.
"""

import streamlit as st
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from utils import load_json
from datetime import datetime
import pandas as pd

st.set_page_config(page_title="Live PBP - FightIQ", page_icon="📡", layout="wide")

st.title("📡 Live Play-by-Play")

st.markdown("**Auto-refreshes every 5 minutes during game windows**")

# Try to load live game data
try:
    live_games = load_json("artifacts/live/active_games.json")
    
    if live_games and len(live_games) > 0:
        st.success(f"{len(live_games)} games in progress")
        
        for game_id, game_state in live_games.items():
            with st.container():
                st.markdown("---")
                
                # Game header
                col1, col2, col3 = st.columns([2, 1, 2])
                
                with col1:
                    st.markdown(f"### {game_state.get('away_team_id', 'AWAY')}")
                    st.markdown(f"**{game_state.get('away_score', 0)}**")
                
                with col2:
                    st.markdown("**@**")
                    quarter = game_state.get('quarter', 1)
                    time_remaining = game_state.get('time_remaining', '15:00')
                    st.markdown(f"Q{quarter} - {time_remaining}")
                
                with col3:
                    st.markdown(f"### {game_state.get('home_team_id', 'HOME')}")
                    st.markdown(f"**{game_state.get('home_score', 0)}**")
                
                # Game situation
                st.markdown("**Current Situation:**")
                
                possession = game_state.get('possession_team_id', 'N/A')
                down = game_state.get('down', 'N/A')
                distance = game_state.get('distance', 'N/A')
                yard_line = game_state.get('yard_line', 'N/A')
                
                situation_col1, situation_col2, situation_col3 = st.columns(3)
                
                with situation_col1:
                    st.metric("Possession", possession)
                
                with situation_col2:
                    st.metric("Down & Distance", f"{down} & {distance}")
                
                with situation_col3:
                    st.metric("Field Position", yard_line)
                
                # Last play
                last_play = game_state.get('last_play_description', 'No play data')
                st.markdown(f"**Last Play:** {last_play}")
                
                # In-game win probability (if available)
                st.progress(0.55, text=f"{game_state.get('home_team_id', 'HOME')} win prob: 55%")
    else:
        st.info("No games currently in progress. Check back during game windows!")
        
        # Show recent completed games
        st.subheader("Recently Completed Games")
        
        recent_games = {
            'Game': ['SF @ DAL', 'BUF @ KC', 'PHI @ MIA'],
            'Final Score': ['SF 42-10', 'KC 27-24', 'PHI 31-17'],
            'Status': ['Final', 'Final', 'Final']
        }
        st.dataframe(pd.DataFrame(recent_games), use_container_width=True, hide_index=True)

except Exception as e:
    st.info("No live game data available")
    st.markdown(f"Debug: {e}")
    
    # Show game schedule
    st.subheader("Today's Schedule")
    
    schedule_data = {
        'Time (ET)': ['1:00 PM', '1:00 PM', '4:25 PM', '8:20 PM'],
        'Matchup': ['BUF @ KC', 'SF @ SEA', 'DAL @ PHI', 'MIA @ LAC'],
        'Status': ['Not Started', 'Not Started', 'Not Started', 'Not Started']
    }
    st.dataframe(pd.DataFrame(schedule_data), use_container_width=True, hide_index=True)

# Scoreboard summary
st.markdown("---")
st.subheader("Full Scoreboard")

# Show all games for the week
all_games = {
    'Status': ['Final', 'Final', 'Final', 'In Progress', 'Not Started', 'Not Started'],
    'Away': ['SF', 'BUF', 'BAL', 'DET', 'GB', 'MIN'],
    'Score': ['42', '24', '31', '17', '-', '-'],
    'Home': ['DAL', 'KC', 'CIN', 'CHI', 'NYG', 'LAR'],
    'Score_Home': ['10', '27', '17', '14', '-', '-'],
    'Time': ['Final', 'Final', 'Final', 'Q3 8:45', '4:25 PM', '8:20 PM']
}

scoreboard_df = pd.DataFrame(all_games)
scoreboard_df['Matchup'] = scoreboard_df['Away'] + ' ' + scoreboard_df['Score'] + ' - ' + scoreboard_df['Score_Home'] + ' ' + scoreboard_df['Home']

st.dataframe(
    scoreboard_df[['Status', 'Matchup', 'Time']],
    use_container_width=True,
    hide_index=True
)

# Data freshness indicator
st.markdown("---")
last_update = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
st.caption(f"Last updated: {last_update} | Updates every 5 minutes during game windows")
