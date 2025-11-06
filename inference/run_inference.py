"""
Inference pipeline for running predictions on upcoming games.
Orchestrates feature building, model loading, and prediction generation.
"""

import logging
import pandas as pd
from datetime import datetime
from modeling.winprob_ensemble import WinProbabilityModel
from modeling.score_model import ScoreModel
from modeling.player_stat_models import PlayerStatModel
from modeling.calibrate import ModelCalibrator
from utils import Config, save_parquet, load_parquet, ensure_dir, get_current_nfl_week

logger = logging.getLogger(__name__)


class InferencePipeline:
    """Run predictions for upcoming games."""
    
    def __init__(self):
        self.config = Config()
        self.config.load()
        
        self.winprob_model = None
        self.score_model = None
        self.calibrator = None
        
        self.models_loaded = False
    
    def load_models(self):
        """Load trained models from disk."""
        logger.info("Loading models for inference")
        
        try:
            # Win probability model
            self.winprob_model = WinProbabilityModel()
            self.winprob_model.load('artifacts/models/winprob')
            
            # Score model
            self.score_model = ScoreModel()
            self.score_model.load('artifacts/models/score')
            
            # Calibrator
            self.calibrator = ModelCalibrator()
            self.calibrator.load('artifacts/models/winprob/calibrator.pkl')
            
            self.models_loaded = True
            logger.info("Models loaded successfully")
            
        except Exception as e:
            logger.warning(f"Could not load all models: {e}")
            logger.info("Will use baseline predictions")
    
    def run_game_predictions(self, games_df: pd.DataFrame, features_df: pd.DataFrame) -> pd.DataFrame:
        """
        Run predictions for a set of games.
        
        Args:
            games_df: DataFrame with game schedule
            features_df: DataFrame with game features
            
        Returns:
            DataFrame with predictions
        """
        logger.info(f"Running predictions for {len(games_df)} games")
        
        if not self.models_loaded:
            self.load_models()
        
        predictions = []
        
        for _, game in games_df.iterrows():
            game_id = game['game_id']
            
            # Get features for this game
            game_features = features_df[features_df['game_id'] == game_id]
            
            if len(game_features) == 0:
                logger.warning(f"No features found for game {game_id}")
                continue
            
            # Predict win probability
            if self.winprob_model and self.models_loaded:
                try:
                    X = game_features.drop(['game_id', 'season', 'week', 'home_team_id', 'away_team_id'], 
                                          axis=1, errors='ignore')
                    
                    home_win_prob = self.winprob_model.predict_proba(X)[0]
                    
                    # Apply calibration
                    if self.calibrator:
                        home_win_prob = self.calibrator.transform([home_win_prob])[0]
                except Exception as e:
                    logger.warning(f"Error in win prob prediction: {e}, using baseline")
                    home_win_prob = 0.50
            else:
                # Baseline: 50-50
                home_win_prob = 0.50
            
            # Predict scores and spread/total
            if self.score_model and self.models_loaded:
                try:
                    X = game_features.drop(['game_id', 'season', 'week', 'home_team_id', 'away_team_id'],
                                          axis=1, errors='ignore')
                    
                    spread_total = self.score_model.predict_spread_total(X)
                    home_score = spread_total['home_score_mean'].iloc[0]
                    away_score = spread_total['away_score_mean'].iloc[0]
                    spread = spread_total['spread'].iloc[0]
                    total = spread_total['total'].iloc[0]
                except Exception as e:
                    logger.warning(f"Error in score prediction: {e}, using baseline")
                    home_score = 24.0
                    away_score = 21.0
                    spread = 3.0
                    total = 45.0
            else:
                # Baseline scores
                home_score = 24.0
                away_score = 21.0
                spread = 3.0
                total = 45.0
            
            prediction = {
                'game_id': game_id,
                'season': game['season'],
                'week': game['week'],
                'home_team_id': game['home_team_id'],
                'away_team_id': game['away_team_id'],
                'home_win_prob': home_win_prob,
                'away_win_prob': 1.0 - home_win_prob,
                'home_score_mean': home_score,
                'away_score_mean': away_score,
                'spread': spread,
                'total': total,
                'model_version': 'v1.0',
                'prediction_timestamp': datetime.now()
            }
            
            predictions.append(prediction)
        
        predictions_df = pd.DataFrame(predictions)
        logger.info(f"Generated {len(predictions_df)} game predictions")
        
        return predictions_df
    
    def run_player_projections(self, players_df: pd.DataFrame, features_df: pd.DataFrame) -> pd.DataFrame:
        """
        Run player stat projections.
        
        Args:
            players_df: DataFrame with player roster
            features_df: DataFrame with player features
            
        Returns:
            DataFrame with player projections
        """
        logger.info(f"Running projections for {len(players_df)} players")
        
        # Placeholder - would load and run player stat models
        projections = []
        
        for _, player in players_df.iterrows():
            projection = {
                'game_id': player.get('game_id'),
                'player_id': player['player_id'],
                'position': player['position'],
                'pass_yards_proj': {'mean': 250.0, 'std': 50.0, 'p10': 200, 'p50': 250, 'p90': 300},
                'model_version': 'v1.0',
                'projection_timestamp': datetime.now()
            }
            projections.append(projection)
        
        return pd.DataFrame(projections)
    
    def save_predictions(self, predictions_df: pd.DataFrame, output_path: str):
        """Save predictions to parquet."""
        ensure_dir(output_path.rsplit('/', 1)[0])
        save_parquet(predictions_df, output_path)
        logger.info(f"Predictions saved to {output_path}")


def run_weekly_inference(season: int, week: int):
    """
    Run inference for a specific week.
    
    Args:
        season: NFL season
        week: Week number
    """
    logger.info(f"Running inference for {season} Week {week}")
    
    pipeline = InferencePipeline()
    
    # Load schedule and features (placeholder)
    games_df = pd.DataFrame({
        'game_id': [f'{season}_{week:02d}_GAME'],
        'season': [season],
        'week': [week],
        'home_team_id': ['KC'],
        'away_team_id': ['BUF']
    })
    
    # Create dummy features
    features_df = games_df.copy()
    for i in range(20):
        features_df[f'feature_{i}'] = 0.0
    
    # Run predictions
    predictions = pipeline.run_game_predictions(games_df, features_df)
    
    # Save predictions
    output_path = f"artifacts/projections/games_{season}_W{week:02d}.parquet"
    pipeline.save_predictions(predictions, output_path)
    
    logger.info("Inference complete")


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    
    # Test inference pipeline
    season, week = get_current_nfl_week()
    run_weekly_inference(season, week)
    
    print("\nInference pipeline test complete!")
