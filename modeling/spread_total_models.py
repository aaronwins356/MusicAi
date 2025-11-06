"""
Spread and total models.
Uses score model outputs to generate spread/total predictions.
"""

import logging
from modeling.score_model import ScoreModel

logger = logging.getLogger(__name__)


# Spread/total models are integrated into ScoreModel
# This file serves as a reference point for the modeling pipeline

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    print("Spread/total models use ScoreModel")
