"""
Basic smoke tests for FightIQ-Football system.
Tests core utilities and model interfaces.
"""

import pytest
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))


def test_config_loading():
    """Test configuration loading."""
    from utils import Config
    
    config = Config()
    config.load()
    
    assert config.get('system.name') == 'FightIQ-Football'
    assert config.get('system.version') is not None
    assert config.get('elo.team.initial_rating') == 1500


def test_schemas():
    """Test Pydantic schemas."""
    from schemas import Team, Player, Game, Position
    
    team = Team(
        team_id='KC',
        abbr='KC',
        full_name='Kansas City Chiefs',
        city='Kansas City',
        conference='AFC',
        division='West'
    )
    
    assert team.team_id == 'KC'
    assert team.conference == 'AFC'
    
    player = Player(
        player_id='P001',
        name='Test Player',
        team_id='KC',
        position=Position.QB
    )
    
    assert player.position == 'QB'


def test_team_elo():
    """Test team Elo rating system."""
    from ratings.team_elo import TeamElo
    
    elo = TeamElo()
    elo.initialize_ratings(['KC', 'BUF'])
    
    assert elo.get_rating('KC') == 1500
    
    # Simulate a game
    new_home, new_away = elo.update_ratings(
        home_team='KC',
        away_team='BUF',
        home_score=27,
        away_score=24,
        season=2024,
        week=1
    )
    
    assert new_home > 1500  # KC won, should gain rating
    assert new_away < 1500  # BUF lost, should lose rating


def test_player_elo():
    """Test player Elo rating system."""
    from ratings.player_elo import PlayerElo
    
    elo = PlayerElo()
    elo.initialize_player('P_MAHOMES', 'QB')
    
    assert elo.get_rating('P_MAHOMES') == 1000
    
    # Update rating
    new_rating = elo.update_rating(
        player_id='P_MAHOMES',
        opponent_strength=1000,
        performance_score=0.7,
        snap_share=1.0,
        season=2024,
        week=1
    )
    
    assert new_rating > 1000  # Good performance should increase rating


def test_win_prob_model_interface():
    """Test win probability model interface."""
    import numpy as np
    import pandas as pd
    from modeling.winprob_ensemble import WinProbabilityModel
    
    model = WinProbabilityModel()
    
    # Create dummy training data
    X_train = pd.DataFrame(
        np.random.randn(100, 10),
        columns=[f'feature_{i}' for i in range(10)]
    )
    y_train = np.random.randint(0, 2, 100)
    
    # Train model
    metrics = model.train(X_train, y_train)
    
    assert 'brier' in metrics
    assert 'auc' in metrics
    
    # Predict
    X_test = X_train.head(5)
    preds = model.predict_proba(X_test)
    
    assert len(preds) == 5
    assert all(0 <= p <= 1 for p in preds)


def test_score_model_interface():
    """Test score model interface."""
    import numpy as np
    import pandas as pd
    from modeling.score_model import ScoreModel
    
    model = ScoreModel()
    
    # Create dummy training data
    X_train = pd.DataFrame(
        np.random.randn(100, 10),
        columns=[f'feature_{i}' for i in range(10)]
    )
    y_home = np.random.poisson(24, 100)
    y_away = np.random.poisson(21, 100)
    
    # Train model
    model.train(X_train, y_home, y_away)
    
    # Predict
    X_test = X_train.head(5)
    predictions = model.predict_spread_total(X_test)
    
    assert len(predictions) == 5
    assert 'spread' in predictions.columns
    assert 'total' in predictions.columns


def test_clustering():
    """Test clustering functionality."""
    import numpy as np
    import pandas as pd
    from features.clustering import ArchetypeClustering
    
    clusterer = ArchetypeClustering()
    
    # Create dummy QB features
    qb_features = pd.DataFrame({
        'player_id': [f'QB{i}' for i in range(20)],
        'scramble_rate': np.random.uniform(0.05, 0.25, 20),
        'deep_pass_rate': np.random.uniform(0.10, 0.25, 20),
        'short_pass_rate': np.random.uniform(0.40, 0.65, 20)
    })
    
    # Cluster
    qb_clustered = clusterer.cluster_qbs(qb_features)
    
    assert 'cluster_id' in qb_clustered.columns
    assert 'cluster_label' in qb_clustered.columns
    assert len(qb_clustered) == 20


def test_inference_pipeline():
    """Test inference pipeline."""
    import pandas as pd
    from inference.run_inference import InferencePipeline
    
    pipeline = InferencePipeline()
    
    # Create dummy game and features
    games_df = pd.DataFrame({
        'game_id': ['TEST_GAME'],
        'season': [2024],
        'week': [1],
        'home_team_id': ['KC'],
        'away_team_id': ['BUF']
    })
    
    features_df = games_df.copy()
    for i in range(20):
        features_df[f'feature_{i}'] = 0.0
    
    # Note: This will use baseline predictions since models aren't trained
    # In real usage, models would be loaded
    # The pipeline gracefully falls back to baseline predictions
    predictions = pipeline.run_game_predictions(games_df, features_df)
    
    assert len(predictions) == 1
    assert 'home_win_prob' in predictions.columns
    # Baseline prediction should be 0.50 (50-50 game)
    assert 0.4 <= predictions['home_win_prob'].iloc[0] <= 0.6


def test_file_operations():
    """Test file I/O utilities."""
    import pandas as pd
    import tempfile
    import os
    from utils import save_parquet, load_parquet, save_json, load_json
    
    # Test parquet
    df = pd.DataFrame({'a': [1, 2, 3], 'b': [4, 5, 6]})
    
    with tempfile.TemporaryDirectory() as tmpdir:
        parquet_path = os.path.join(tmpdir, 'test.parquet')
        save_parquet(df, parquet_path)
        
        loaded_df = load_parquet(parquet_path)
        assert loaded_df is not None
        assert len(loaded_df) == 3
        
        # Test JSON
        data = {'key': 'value', 'number': 42}
        json_path = os.path.join(tmpdir, 'test.json')
        save_json(data, json_path)
        
        loaded_data = load_json(json_path)
        assert loaded_data['key'] == 'value'
        assert loaded_data['number'] == 42


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
