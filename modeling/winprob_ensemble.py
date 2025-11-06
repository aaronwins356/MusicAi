"""
Win probability model using ensemble approach.
Combines gradient boosting with neural network in stacked ensemble.
"""

import logging
import numpy as np
import pandas as pd
from sklearn.model_selection import TimeSeriesSplit
from sklearn.linear_model import LogisticRegression
import xgboost as xgb
import joblib
from typing import Tuple
from utils import Config, ensure_dir

logger = logging.getLogger(__name__)


class WinProbabilityModel:
    """Ensemble model for pre-game win probability."""
    
    def __init__(self):
        self.config = Config()
        self.config.load()
        
        self.xgb_params = {
            'max_depth': self.config.get('modeling.xgboost.max_depth', 6),
            'learning_rate': self.config.get('modeling.xgboost.learning_rate', 0.05),
            'n_estimators': self.config.get('modeling.xgboost.n_estimators', 200),
            'subsample': self.config.get('modeling.xgboost.subsample', 0.8),
            'colsample_bytree': self.config.get('modeling.xgboost.colsample_bytree', 0.8),
            'objective': 'binary:logistic',
            'eval_metric': 'logloss',
            'random_state': 42
        }
        
        self.base_models = []
        self.meta_model = None
        self.feature_names = None
    
    def train(self, X_train: pd.DataFrame, y_train: np.ndarray) -> dict:
        """
        Train the ensemble win probability model.
        
        Args:
            X_train: Training features
            y_train: Training labels (1 = home win, 0 = away win)
            
        Returns:
            Training metrics dictionary
        """
        logger.info("Training win probability model")
        
        self.feature_names = X_train.columns.tolist()
        
        # Train base models
        # Model 1: XGBoost
        xgb_model = xgb.XGBClassifier(**self.xgb_params)
        xgb_model.fit(X_train, y_train)
        self.base_models.append(('xgb', xgb_model))
        
        # Model 2: Could add LightGBM or neural network here
        # For simplicity, using single base model
        
        # Generate out-of-fold predictions for meta-model
        oof_preds = self._get_oof_predictions(X_train, y_train)
        
        # Train meta-model (logistic regression)
        self.meta_model = LogisticRegression(random_state=42)
        self.meta_model.fit(oof_preds, y_train)
        
        # Compute training metrics
        train_preds = self.predict_proba(X_train)
        metrics = self._compute_metrics(y_train, train_preds)
        
        logger.info(f"Training complete. Brier: {metrics['brier']:.4f}, AUC: {metrics['auc']:.4f}")
        
        return metrics
    
    def _get_oof_predictions(self, X: pd.DataFrame, y: np.ndarray) -> np.ndarray:
        """Generate out-of-fold predictions for stacking."""
        tscv = TimeSeriesSplit(n_splits=5)
        oof_preds = np.zeros((len(X), len(self.base_models)))
        
        for fold_idx, (train_idx, val_idx) in enumerate(tscv.split(X)):
            X_fold_train = X.iloc[train_idx]
            y_fold_train = y[train_idx]
            X_fold_val = X.iloc[val_idx]
            
            for model_idx, (name, model) in enumerate(self.base_models):
                # Clone and train on fold
                fold_model = xgb.XGBClassifier(**self.xgb_params)
                fold_model.fit(X_fold_train, y_fold_train)
                
                # Predict on validation
                oof_preds[val_idx, model_idx] = fold_model.predict_proba(X_fold_val)[:, 1]
        
        return oof_preds
    
    def predict_proba(self, X: pd.DataFrame) -> np.ndarray:
        """
        Predict win probabilities.
        
        Args:
            X: Features
            
        Returns:
            Array of home team win probabilities
        """
        if not self.base_models or self.meta_model is None:
            raise ValueError("Model not trained. Call train() first.")
        
        # Get predictions from base models
        base_preds = np.column_stack([
            model.predict_proba(X)[:, 1]
            for name, model in self.base_models
        ])
        
        # Meta-model prediction
        final_preds = self.meta_model.predict_proba(base_preds)[:, 1]
        
        return final_preds
    
    def _compute_metrics(self, y_true: np.ndarray, y_pred: np.ndarray) -> dict:
        """Compute evaluation metrics."""
        from sklearn.metrics import brier_score_loss, roc_auc_score, log_loss
        
        metrics = {
            'brier': brier_score_loss(y_true, y_pred),
            'logloss': log_loss(y_true, y_pred),
            'auc': roc_auc_score(y_true, y_pred)
        }
        
        return metrics
    
    def save(self, output_dir: str):
        """Save model to disk."""
        ensure_dir(output_dir)
        
        # Save base models
        for i, (name, model) in enumerate(self.base_models):
            model_path = f"{output_dir}/base_model_{name}_{i}.pkl"
            joblib.dump(model, model_path)
        
        # Save meta model
        meta_path = f"{output_dir}/meta_model.pkl"
        joblib.dump(self.meta_model, meta_path)
        
        # Save feature names
        feature_path = f"{output_dir}/feature_names.pkl"
        joblib.dump(self.feature_names, feature_path)
        
        logger.info(f"Model saved to {output_dir}")
    
    def load(self, input_dir: str):
        """Load model from disk."""
        import glob
        
        # Load base models
        self.base_models = []
        for model_path in sorted(glob.glob(f"{input_dir}/base_model_*.pkl")):
            model = joblib.load(model_path)
            name = model_path.split('_')[-2]
            self.base_models.append((name, model))
        
        # Load meta model
        meta_path = f"{input_dir}/meta_model.pkl"
        self.meta_model = joblib.load(meta_path)
        
        # Load feature names
        feature_path = f"{input_dir}/feature_names.pkl"
        self.feature_names = joblib.load(feature_path)
        
        logger.info(f"Model loaded from {input_dir}")


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    
    # Test model with synthetic data
    np.random.seed(42)
    n_samples = 1000
    n_features = 20
    
    X_train = pd.DataFrame(
        np.random.randn(n_samples, n_features),
        columns=[f'feature_{i}' for i in range(n_features)]
    )
    y_train = np.random.randint(0, 2, n_samples)
    
    model = WinProbabilityModel()
    metrics = model.train(X_train, y_train)
    
    print("\nTraining Metrics:")
    for metric, value in metrics.items():
        print(f"  {metric}: {value:.4f}")
    
    # Test prediction
    X_test = X_train.head(10)
    preds = model.predict_proba(X_test)
    print(f"\nSample predictions: {preds[:5]}")
    
    # Test save/load
    model.save('artifacts/models/winprob')
    
    model2 = WinProbabilityModel()
    model2.load('artifacts/models/winprob')
    preds2 = model2.predict_proba(X_test)
    
    print(f"Loaded model predictions match: {np.allclose(preds, preds2)}")
    
    print("\nWin probability model test complete!")
