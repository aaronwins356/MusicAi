"""
Player Elo rating system.
Implements position-specific Elo ratings that feed into team strength.
"""

import logging
import numpy as np
import pandas as pd
from typing import Dict, Optional
from utils import Config, save_parquet, load_parquet
from schemas import Position

logger = logging.getLogger(__name__)


class PlayerElo:
    """Player-level Elo rating system."""
    
    def __init__(self):
        self.config = Config()
        self.config.load()
        
        self.initial_rating = self.config.get('elo.player.initial_rating', 1000)
        self.k_factors = self.config.get('elo.player.k_factors', {
            'QB': 32, 'RB': 20, 'WR': 20, 'TE': 18,
            'OL': 15, 'DL': 15, 'LB': 18, 'CB': 20, 'S': 18
        })
        self.reversion_factor = self.config.get('elo.player.reversion_factor', 0.25)
        
        # Current ratings: player_id -> rating
        self.ratings: Dict[str, float] = {}
        
        # Player metadata: player_id -> {'position': ..., 'games': ...}
        self.player_info: Dict[str, Dict] = {}
        
        # History
        self.history = []
    
    def initialize_player(self, player_id: str, position: str):
        """Initialize a player with base rating for position."""
        if player_id not in self.ratings:
            self.ratings[player_id] = self.initial_rating
            self.player_info[player_id] = {
                'position': position,
                'games': 0,
                'last_update_week': None
            }
    
    def get_rating(self, player_id: str) -> float:
        """Get current rating for a player."""
        return self.ratings.get(player_id, self.initial_rating)
    
    def get_k_factor(self, player_id: str, snap_share: float = 1.0) -> float:
        """
        Get K-factor for a player based on position and snap share.
        
        Args:
            player_id: Player identifier
            snap_share: Proportion of snaps played (0-1)
            
        Returns:
            K-factor for rating update
        """
        if player_id not in self.player_info:
            return 20.0
        
        position = self.player_info[player_id]['position']
        base_k = self.k_factors.get(position, 20)
        
        # Scale by snap share
        return base_k * snap_share
    
    def update_rating(
        self,
        player_id: str,
        opponent_strength: float,
        performance_score: float,
        snap_share: float,
        season: int,
        week: int
    ) -> float:
        """
        Update player rating based on performance.
        
        Args:
            player_id: Player identifier
            opponent_strength: Opponent unit strength (normalized)
            performance_score: Player performance (0-1 scale, 0.5 = expected)
            snap_share: Proportion of snaps played
            season: Season year
            week: Week number
            
        Returns:
            New rating
        """
        current_rating = self.get_rating(player_id)
        
        # Get K-factor
        k = self.get_k_factor(player_id, snap_share)
        
        # Expected performance (logistic curve)
        expected = 1.0 / (1.0 + 10 ** ((opponent_strength - current_rating) / 400.0))
        
        # Rating change
        change = k * (performance_score - expected)
        
        new_rating = current_rating + change
        self.ratings[player_id] = new_rating
        
        # Update player info
        if player_id in self.player_info:
            self.player_info[player_id]['games'] += 1
            self.player_info[player_id]['last_update_week'] = (season, week)
        
        # Record history
        position = self.player_info.get(player_id, {}).get('position', 'UNKNOWN')
        self.history.append((season, week, player_id, position, new_rating))
        
        return new_rating
    
    def regress_inactive_players(self, current_season: int, current_week: int):
        """
        Apply mean reversion to players who haven't played recently.
        Rookies and injured players regress more.
        """
        for player_id, info in self.player_info.items():
            last_update = info.get('last_update_week')
            
            if last_update is None:
                # Never played, keep at initial
                continue
            
            last_season, last_week = last_update
            
            # Calculate weeks since last update
            if current_season > last_season:
                weeks_inactive = (current_season - last_season) * 18 + current_week - last_week
            else:
                weeks_inactive = current_week - last_week
            
            # Apply reversion if inactive for 4+ weeks
            if weeks_inactive >= 4:
                current = self.ratings[player_id]
                new_rating = current * (1 - self.reversion_factor) + self.initial_rating * self.reversion_factor
                self.ratings[player_id] = new_rating
    
    def compute_team_adjustment(self, roster_data: pd.DataFrame) -> float:
        """
        Compute team Elo adjustment from player Elos.
        
        Args:
            roster_data: DataFrame with player_id, position, snap_share
            
        Returns:
            Team adjustment value
        """
        # Position weights (sum to 1.0)
        position_weights = {
            'QB': 0.25,
            'RB': 0.08,
            'WR': 0.12,
            'TE': 0.05,
            'OL': 0.15,
            'DL': 0.12,
            'LB': 0.10,
            'CB': 0.08,
            'S': 0.05
        }
        
        total_adjustment = 0.0
        
        for pos, weight in position_weights.items():
            pos_players = roster_data[roster_data['position'] == pos]
            
            if len(pos_players) == 0:
                continue
            
            # Weight by snap share
            pos_rating = sum(
                self.get_rating(row['player_id']) * row['snap_share']
                for _, row in pos_players.iterrows()
            )
            
            # Normalize to delta from base (1000)
            pos_delta = pos_rating - self.initial_rating
            
            total_adjustment += pos_delta * weight
        
        # Scale adjustment to reasonable range (-100 to +100)
        return np.clip(total_adjustment * 0.1, -100, 100)
    
    def save_history(self, output_path: str):
        """Save player Elo history."""
        if not self.history:
            return
        
        df = pd.DataFrame(
            self.history,
            columns=['season', 'week', 'player_id', 'position', 'elo_rating']
        )
        
        save_parquet(df, output_path)
        logger.info(f"Saved player Elo history to {output_path}")
    
    def load_history(self, input_path: str):
        """Load player Elo history."""
        df = load_parquet(input_path)
        if df is None:
            return
        
        # Restore latest ratings
        latest = df.groupby('player_id').last().reset_index()
        for _, row in latest.iterrows():
            self.ratings[row['player_id']] = row['elo_rating']
            self.player_info[row['player_id']] = {
                'position': row['position'],
                'games': 0,
                'last_update_week': (row['season'], row['week'])
            }
        
        self.history = list(df.itertuples(index=False, name=None))
        logger.info(f"Loaded player Elo history from {input_path}")


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    
    # Test player Elo
    elo = PlayerElo()
    
    # Initialize some players
    elo.initialize_player('P_MAHOMES', 'QB')
    elo.initialize_player('P_ALLEN', 'QB')
    elo.initialize_player('P_KELCE', 'TE')
    
    # Simulate performance updates
    elo.update_rating('P_MAHOMES', 1000, 0.7, 1.0, 2024, 1)
    elo.update_rating('P_ALLEN', 1000, 0.6, 1.0, 2024, 1)
    elo.update_rating('P_KELCE', 1000, 0.65, 0.8, 2024, 1)
    
    print(f"Mahomes rating: {elo.get_rating('P_MAHOMES'):.1f}")
    print(f"Allen rating: {elo.get_rating('P_ALLEN'):.1f}")
    print(f"Kelce rating: {elo.get_rating('P_KELCE'):.1f}")
    
    # Test team adjustment
    roster = pd.DataFrame([
        {'player_id': 'P_MAHOMES', 'position': 'QB', 'snap_share': 1.0},
        {'player_id': 'P_KELCE', 'position': 'TE', 'snap_share': 0.8},
    ])
    adjustment = elo.compute_team_adjustment(roster)
    print(f"\nTeam adjustment: {adjustment:+.1f}")
    
    print("\nPlayer Elo system test complete!")
