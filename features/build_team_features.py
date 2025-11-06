"""
Team feature engineering for modeling.
Builds rolling window features for team offense and defense.
"""

import logging
import numpy as np
import pandas as pd
from typing import List
from utils import Config, save_parquet, ensure_dir

logger = logging.getLogger(__name__)


class TeamFeatureBuilder:
    """Build team-level features from game data."""
    
    def __init__(self):
        self.config = Config()
        self.config.load()
        self.windows = self.config.get('features.rolling_windows', [3, 5, 8])
    
    def build_team_features(self, games_df: pd.DataFrame, stats_df: pd.DataFrame) -> pd.DataFrame:
        """
        Build comprehensive team features.
        
        Args:
            games_df: Game schedule and results
            stats_df: Team-level game statistics
            
        Returns:
            DataFrame with team features per game
        """
        logger.info("Building team features")
        
        features = []
        
        # Sort by season and week
        games_df = games_df.sort_values(['season', 'week']).copy()
        
        for _, game in games_df.iterrows():
            game_features = self._compute_game_features(game, games_df, stats_df)
            features.append(game_features)
        
        features_df = pd.DataFrame(features)
        logger.info(f"Built features for {len(features)} games")
        
        return features_df
    
    def _compute_game_features(self, game: pd.Series, games_df: pd.DataFrame, stats_df: pd.DataFrame) -> dict:
        """Compute features for a single game."""
        season = game['season']
        week = game['week']
        home_team = game['home_team_id']
        away_team = game['away_team_id']
        
        # Base features
        features = {
            'game_id': game['game_id'],
            'season': season,
            'week': week,
            'home_team_id': home_team,
            'away_team_id': away_team
        }
        
        # Get historical games for both teams
        home_history = self._get_team_history(games_df, home_team, season, week)
        away_history = self._get_team_history(games_df, away_team, season, week)
        
        # Compute rolling features
        for window in self.windows:
            home_roll = self._rolling_features(home_history, window, prefix=f'home_L{window}')
            away_roll = self._rolling_features(away_history, window, prefix=f'away_L{window}')
            features.update(home_roll)
            features.update(away_roll)
        
        # Matchup features
        features['rest_diff'] = self._compute_rest_days(game, games_df, home_team) - \
                               self._compute_rest_days(game, games_df, away_team)
        
        return features
    
    def _get_team_history(self, games_df: pd.DataFrame, team: str, season: int, week: int) -> pd.DataFrame:
        """Get historical games for a team before a given week."""
        # Games before this week
        mask = ((games_df['season'] == season) & (games_df['week'] < week)) | \
               (games_df['season'] < season)
        
        # Games involving this team
        team_mask = (games_df['home_team_id'] == team) | (games_df['away_team_id'] == team)
        
        history = games_df[mask & team_mask].copy()
        return history.sort_values(['season', 'week'])
    
    def _rolling_features(self, history: pd.DataFrame, window: int, prefix: str) -> dict:
        """Compute rolling window features."""
        features = {}
        
        if len(history) < 1:
            # No history, return defaults
            return self._default_features(prefix)
        
        # Take last N games
        recent = history.tail(window)
        
        # Compute aggregates (placeholder - would compute from actual stats)
        features[f'{prefix}_games'] = len(recent)
        features[f'{prefix}_points_per_game'] = recent.get('points', pd.Series([21])).mean()
        features[f'{prefix}_points_allowed'] = recent.get('points_allowed', pd.Series([21])).mean()
        features[f'{prefix}_win_pct'] = recent.get('win', pd.Series([0.5])).mean()
        
        return features
    
    def _default_features(self, prefix: str) -> dict:
        """Default features when no history available."""
        return {
            f'{prefix}_games': 0,
            f'{prefix}_points_per_game': 21.0,
            f'{prefix}_points_allowed': 21.0,
            f'{prefix}_win_pct': 0.5
        }
    
    def _compute_rest_days(self, game: pd.Series, games_df: pd.DataFrame, team: str) -> int:
        """Compute rest days since last game."""
        # Placeholder - would compute from actual dates
        return 7
    
    def save_features(self, features_df: pd.DataFrame, output_path: str):
        """Save features to parquet."""
        ensure_dir(output_path.rsplit('/', 1)[0])
        save_parquet(features_df, output_path)
        logger.info(f"Saved team features to {output_path}")


def build_team_features_main():
    """Main function to build team features."""
    builder = TeamFeatureBuilder()
    
    # Load games (placeholder)
    games_df = pd.DataFrame({
        'game_id': ['2024_01_KC_BUF'],
        'season': [2024],
        'week': [1],
        'home_team_id': ['KC'],
        'away_team_id': ['BUF']
    })
    
    stats_df = pd.DataFrame()
    
    features = builder.build_team_features(games_df, stats_df)
    builder.save_features(features, 'artifacts/datasets/team_features.parquet')


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    
    builder = TeamFeatureBuilder()
    print(f"Configured windows: {builder.windows}")
    
    build_team_features_main()
    print("\nTeam feature builder test complete!")
