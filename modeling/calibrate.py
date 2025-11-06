"""
Model calibration utilities.
Ensures predicted probabilities match observed frequencies.
"""

import logging
import numpy as np
from sklearn.isotonic import IsotonicRegression
from sklearn.calibration import calibration_curve
import joblib
from utils import ensure_dir

logger = logging.getLogger(__name__)


class ModelCalibrator:
    """Calibrate probability predictions."""
    
    def __init__(self, method: str = 'isotonic'):
        self.method = method
        self.calibrator = None
    
    def fit(self, y_true: np.ndarray, y_pred: np.ndarray):
        """Fit calibrator on validation data."""
        logger.info(f"Fitting {self.method} calibrator")
        
        if self.method == 'isotonic':
            self.calibrator = IsotonicRegression(out_of_bounds='clip')
            self.calibrator.fit(y_pred, y_true)
        else:
            raise ValueError(f"Unknown calibration method: {self.method}")
    
    def transform(self, y_pred: np.ndarray) -> np.ndarray:
        """Apply calibration to predictions."""
        if self.calibrator is None:
            return y_pred
        return self.calibrator.transform(y_pred)
    
    def evaluate(self, y_true: np.ndarray, y_pred: np.ndarray) -> dict:
        """Evaluate calibration."""
        prob_true, prob_pred = calibration_curve(y_true, y_pred, n_bins=10)
        
        calibration_error = np.mean(np.abs(prob_true - prob_pred))
        
        return {
            'prob_true': prob_true,
            'prob_pred': prob_pred,
            'calibration_error': calibration_error
        }
    
    def save(self, output_path: str):
        """Save calibrator."""
        ensure_dir(output_path.rsplit('/', 1)[0])
        joblib.dump(self.calibrator, output_path)
        logger.info(f"Calibrator saved to {output_path}")
    
    def load(self, input_path: str):
        """Load calibrator."""
        self.calibrator = joblib.load(input_path)
        logger.info(f"Calibrator loaded from {input_path}")


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    
    # Test calibrator
    np.random.seed(42)
    y_true = np.random.randint(0, 2, 1000)
    y_pred = np.random.uniform(0, 1, 1000)
    
    calibrator = ModelCalibrator()
    calibrator.fit(y_true, y_pred)
    
    y_cal = calibrator.transform(y_pred)
    
    metrics_before = calibrator.evaluate(y_true, y_pred)
    metrics_after = calibrator.evaluate(y_true, y_cal)
    
    print(f"Calibration error before: {metrics_before['calibration_error']:.4f}")
    print(f"Calibration error after: {metrics_after['calibration_error']:.4f}")
    
    print("\nCalibration test complete!")
