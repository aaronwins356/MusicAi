"""
FightIQ-Football Streamlit Dashboard
Main entry point for the web interface.
"""

import streamlit as st
from streamlit_autorefresh import st_autorefresh
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from utils import Config, load_parquet, load_json
from datetime import datetime

# Page configuration
st.set_page_config(
    page_title="FightIQ-Football",
    page_icon="🏈",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Auto-refresh every 5 minutes (300 seconds = 300000 ms)
count = st_autorefresh(interval=300000, key="datarefresh")

# Load configuration
config = Config()
config.load()

# Custom CSS
st.markdown("""
<style>
    .main-header {
        font-size: 3rem;
        font-weight: bold;
        color: #1f77b4;
        text-align: center;
        padding: 1rem;
    }
    .metric-card {
        background-color: #f0f2f6;
        padding: 1rem;
        border-radius: 0.5rem;
        margin: 0.5rem 0;
    }
    .stTabs [data-baseweb="tab-list"] {
        gap: 2rem;
    }
</style>
""", unsafe_allow_html=True)

# Header
st.markdown('<h1 class="main-header">🏈 FightIQ-Football: NFL Analytics</h1>', unsafe_allow_html=True)
st.markdown("### Production-Grade NFL Prediction & Analytics System")

# Sidebar
with st.sidebar:
    st.image("https://via.placeholder.com/150x150.png?text=FightIQ", width=150)
    st.markdown("## Navigation")
    st.markdown("Use the pages above to explore:")
    st.markdown("- **Home**: Overview & model health")
    st.markdown("- **Teams**: Team profiles & Elo")
    st.markdown("- **Players**: Player stats & projections")
    st.markdown("- **Rankings**: Elo leaderboards")
    st.markdown("- **Matchups**: Game predictions")
    st.markdown("- **Live Play-by-Play**: Real-time updates")
    st.markdown("- **Model Report**: Performance metrics")
    
    st.markdown("---")
    st.markdown(f"**Last Updated:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    st.markdown(f"**Refresh Count:** {count}")
    st.markdown(f"**Version:** {config.get('system.version', '1.0.0')}")

# Main content
st.markdown("## Welcome to FightIQ-Football")

col1, col2, col3, col4 = st.columns(4)

with col1:
    st.metric("Active Models", "3", delta="All systems operational")

with col2:
    st.metric("Data Freshness", "5 min", delta="Auto-refresh enabled")

with col3:
    st.metric("Historical Coverage", "2015-2024", delta="10 seasons")

with col4:
    st.metric("Update Frequency", "Every 5min", delta="Live during games")

st.markdown("---")

# Quick stats
st.markdown("### System Features")

feature_col1, feature_col2 = st.columns(2)

with feature_col1:
    st.markdown("""
    **Predictive Models:**
    - ✅ Team win probability (calibrated)
    - ✅ Score distributions & spreads
    - ✅ Player stat projections
    - ✅ Player & Team Elo ratings
    """)

with feature_col2:
    st.markdown("""
    **Analysis Features:**
    - ✅ Unsupervised QB archetypes
    - ✅ Offensive/Defensive schemes
    - ✅ Rolling team metrics
    - ✅ Live play-by-play tracking
    """)

st.markdown("---")

# Recent predictions
st.markdown("### Recent Game Predictions")

try:
    # Try to load latest predictions
    import glob
    import os
    
    pred_files = glob.glob("artifacts/projections/games_*.parquet")
    
    if pred_files:
        latest_file = max(pred_files, key=os.path.getctime)
        predictions = load_parquet(latest_file)
        
        if predictions is not None and len(predictions) > 0:
            # Display predictions table
            display_cols = ['home_team_id', 'away_team_id', 'home_win_prob', 'spread', 'total']
            display_df = predictions[display_cols].head(10)
            
            # Format probabilities as percentages
            display_df['home_win_prob'] = (display_df['home_win_prob'] * 100).round(1).astype(str) + '%'
            display_df['spread'] = display_df['spread'].round(1)
            display_df['total'] = display_df['total'].round(1)
            
            st.dataframe(display_df, use_container_width=True)
        else:
            st.info("No predictions available yet. Run inference to generate predictions.")
    else:
        st.info("No prediction files found. Run the inference pipeline to generate predictions.")
        
except Exception as e:
    st.warning(f"Could not load predictions: {e}")

st.markdown("---")

# Data sources
with st.expander("📊 Data Sources & Methodology"):
    st.markdown("""
    **Data Collection:**
    - All data scraped from public sources (no paid APIs)
    - Aggressive caching with 5-minute update cadence
    - Historical data: 2015-present
    
    **Models:**
    - Ensemble approach: XGBoost + Meta-learner
    - Isotonic calibration for probability predictions
    - Player-adjusted team Elo ratings
    - Unsupervised clustering for archetypes
    
    **Validation:**
    - Time-series cross-validation
    - Out-of-sample testing
    - Calibration curves and Brier scores
    
    ⚠️ **Disclaimer:** This system is for research and analysis only. Not for wagering purposes.
    """)

# Footer
st.markdown("---")
st.markdown("""
<div style='text-align: center; color: #666;'>
    FightIQ-Football v1.0 | NFL Analytics System | Local Deployment<br>
    No paid APIs • Fully reproducible • Production-grade architecture
</div>
""", unsafe_allow_html=True)
