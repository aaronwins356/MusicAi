"""
Score prediction model using Poisson/Skellam framework.
Predicts team scores and derives spread/total distributions.
"""

import logging
import numpy as np
import pandas as pd
from scipy.stats import poisson, norm
import xgboost as xgb
import joblib
from utils import ensure_dir

logger = logging.getLogger(__name__)


class ScoreModel:
    """Model to predict team scores."""
    
    def __init__(self):
        self.home_model = None
        self.away_model = None
        self.feature_names = None
    
    def train(self, X_train: pd.DataFrame, y_home: np.ndarray, y_away: np.ndarray):
        """
        Train separate models for home and away scores.
        
        Args:
            X_train: Training features
            y_home: Home team actual scores
            y_away: Away team actual scores
        """
        logger.info("Training score models")
        
        self.feature_names = X_train.columns.tolist()
        
        # Home score model
        self.home_model = xgb.XGBRegressor(
            objective='reg:squarederror',
            max_depth=5,
            learning_rate=0.05,
            n_estimators=200,
            random_state=42
        )
        self.home_model.fit(X_train, y_home)
        
        # Away score model
        self.away_model = xgb.XGBRegressor(
            objective='reg:squarederror',
            max_depth=5,
            learning_rate=0.05,
            n_estimators=200,
            random_state=42
        )
        self.away_model.fit(X_train, y_away)
        
        # Compute training metrics
        home_preds = self.home_model.predict(X_train)
        away_preds = self.away_model.predict(X_train)
        
        home_mae = np.mean(np.abs(y_home - home_preds))
        away_mae = np.mean(np.abs(y_away - away_preds))
        
        logger.info(f"Training complete. Home MAE: {home_mae:.2f}, Away MAE: {away_mae:.2f}")
    
    def predict_scores(self, X: pd.DataFrame) -> tuple:
        """
        Predict scores for games.
        
        Args:
            X: Features
            
        Returns:
            Tuple of (home_scores, away_scores)
        """
        home_scores = self.home_model.predict(X)
        away_scores = self.away_model.predict(X)
        
        return home_scores, away_scores
    
    def predict_spread_total(self, X: pd.DataFrame) -> pd.DataFrame:
        """
        Predict spread and total with distributions.
        
        Args:
            X: Features
            
        Returns:
            DataFrame with spread/total predictions
        """
        home_scores, away_scores = self.predict_scores(X)
        
        # Spread (positive = home favored)
        spread = home_scores - away_scores
        
        # Total
        total = home_scores + away_scores
        
        # Estimate uncertainty (simplified - would use quantile regression or bootstrapping)
        spread_std = 10.0  # Typical spread uncertainty
        total_std = 8.0    # Typical total uncertainty
        
        results = pd.DataFrame({
            'home_score_mean': home_scores,
            'away_score_mean': away_scores,
            'spread': spread,
            'spread_std': spread_std,
            'total': total,
            'total_std': total_std
        })
        
        return results
    
    def save(self, output_dir: str):
        """Save models."""
        ensure_dir(output_dir)
        
        joblib.dump(self.home_model, f"{output_dir}/home_score_model.pkl")
        joblib.dump(self.away_model, f"{output_dir}/away_score_model.pkl")
        joblib.dump(self.feature_names, f"{output_dir}/feature_names.pkl")
        
        logger.info(f"Score models saved to {output_dir}")
    
    def load(self, input_dir: str):
        """Load models."""
        self.home_model = joblib.load(f"{input_dir}/home_score_model.pkl")
        self.away_model = joblib.load(f"{input_dir}/away_score_model.pkl")
        self.feature_names = joblib.load(f"{input_dir}/feature_names.pkl")
        
        logger.info(f"Score models loaded from {input_dir}")


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    
    # Test with synthetic data
    np.random.seed(42)
    n_samples = 500
    n_features = 15
    
    X_train = pd.DataFrame(
        np.random.randn(n_samples, n_features),
        columns=[f'feature_{i}' for i in range(n_features)]
    )
    
    # Synthetic scores (mean around 21-24 points)
    y_home = np.random.poisson(24, n_samples)
    y_away = np.random.poisson(21, n_samples)
    
    model = ScoreModel()
    model.train(X_train, y_home, y_away)
    
    # Test predictions
    X_test = X_train.head(5)
    predictions = model.predict_spread_total(X_test)
    
    print("\nSample Predictions:")
    print(predictions)
    
    # Test save/load
    model.save('artifacts/models/score')
    
    model2 = ScoreModel()
    model2.load('artifacts/models/score')
    
    print("\nScore model test complete!")
