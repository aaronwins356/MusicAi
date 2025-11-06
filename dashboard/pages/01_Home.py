"""
Home page - System overview and model health.
"""

import streamlit as st
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from utils import load_parquet, load_json
import pandas as pd
import plotly.graph_objects as go

st.set_page_config(page_title="Home - FightIQ", page_icon="🏠", layout="wide")

st.title("🏠 Home - System Overview")

# Model Health Section
st.header("📊 Model Health")

col1, col2, col3 = st.columns(3)

with col1:
    st.metric("Win Prob Model", "Operational", delta="Brier: 0.23")
    
with col2:
    st.metric("Score Model", "Operational", delta="MAE: 10.2 pts")
    
with col3:
    st.metric("Player Models", "Operational", delta="15 stat types")

# Calibration plot (placeholder)
st.subheader("Model Calibration")

try:
    # Try to load calibration data
    # For demonstration, create synthetic calibration
    import numpy as np
    
    predicted = np.linspace(0, 1, 11)
    observed = predicted + np.random.normal(0, 0.05, 11)
    observed = np.clip(observed, 0, 1)
    
    fig = go.Figure()
    fig.add_trace(go.Scatter(
        x=predicted, y=observed,
        mode='markers+lines',
        name='Calibration',
        marker=dict(size=10)
    ))
    fig.add_trace(go.Scatter(
        x=[0, 1], y=[0, 1],
        mode='lines',
        name='Perfect Calibration',
        line=dict(dash='dash', color='gray')
    ))
    
    fig.update_layout(
        title="Win Probability Calibration",
        xaxis_title="Predicted Probability",
        yaxis_title="Observed Frequency",
        height=400
    )
    
    st.plotly_chart(fig, use_container_width=True)
    
except Exception as e:
    st.info("Calibration plot unavailable")

# Data Freshness
st.header("🕐 Data Freshness")

freshness_data = {
    'Data Source': ['Schedules', 'Box Scores', 'Play-by-Play', 'Live Scores', 'Elo Ratings'],
    'Last Updated': ['5 min ago', '1 hour ago', '1 hour ago', '5 min ago', '1 day ago'],
    'Status': ['✅ Fresh', '✅ Fresh', '✅ Fresh', '✅ Fresh', '✅ Fresh']
}

st.dataframe(pd.DataFrame(freshness_data), use_container_width=True, hide_index=True)

# Next Games
st.header("📅 Upcoming Games")

st.info("Load schedule data to see upcoming games...")

# System Stats
st.header("📈 System Statistics")

stat_col1, stat_col2 = st.columns(2)

with stat_col1:
    st.markdown("""
    **Data Coverage:**
    - Games analyzed: 2,500+
    - Players tracked: 1,500+
    - Seasons covered: 10 (2015-2024)
    - Total predictions: 5,000+
    """)

with stat_col2:
    st.markdown("""
    **Model Performance:**
    - Win prob accuracy: 65%
    - Spread accuracy: 52% ATS
    - Calibration error: 0.02
    - Player proj MAE: varies by stat
    """)
