"""
Player stat projection models.
Predicts individual player statistics using hierarchical models.
"""

import logging
import numpy as np
import pandas as pd
import xgboost as xgb
import joblib
from utils import ensure_dir

logger = logging.getLogger(__name__)


class PlayerStatModel:
    """Model for player stat projections."""
    
    def __init__(self, stat_name: str):
        self.stat_name = stat_name
        self.model = None
        self.feature_names = None
    
    def train(self, X_train: pd.DataFrame, y_train: np.ndarray):
        """Train model for a specific stat."""
        logger.info(f"Training {self.stat_name} projection model")
        
        self.feature_names = X_train.columns.tolist()
        
        # Use Poisson objective for count data (attempts, yards, etc.)
        self.model = xgb.XGBRegressor(
            objective='count:poisson',
            max_depth=4,
            learning_rate=0.05,
            n_estimators=150,
            random_state=42
        )
        self.model.fit(X_train, y_train)
        
        preds = self.model.predict(X_train)
        mae = np.mean(np.abs(y_train - preds))
        logger.info(f"{self.stat_name} MAE: {mae:.2f}")
    
    def predict(self, X: pd.DataFrame) -> dict:
        """Predict stat with distribution."""
        mean_pred = self.model.predict(X)
        
        # Estimate distribution (simplified)
        std_pred = np.sqrt(mean_pred + 1)  # Poisson-like variance
        
        return {
            'mean': mean_pred,
            'std': std_pred,
            'p10': mean_pred - 1.28 * std_pred,
            'p50': mean_pred,
            'p90': mean_pred + 1.28 * std_pred
        }
    
    def save(self, output_dir: str):
        """Save model."""
        ensure_dir(output_dir)
        joblib.dump(self.model, f"{output_dir}/{self.stat_name}_model.pkl")
        joblib.dump(self.feature_names, f"{output_dir}/{self.stat_name}_features.pkl")
    
    def load(self, input_dir: str):
        """Load model."""
        self.model = joblib.load(f"{input_dir}/{self.stat_name}_model.pkl")
        self.feature_names = joblib.load(f"{input_dir}/{self.stat_name}_features.pkl")


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    print("Player stat models initialized")
