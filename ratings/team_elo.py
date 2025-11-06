"""
Team Elo rating system.
Implements classic Elo ratings with home field advantage, margin of victory,
and player adjustments.
"""

import logging
import numpy as np
import pandas as pd
from typing import Dict, Tuple
from utils import Config, save_parquet, load_parquet, ensure_dir

logger = logging.getLogger(__name__)


class TeamElo:
    """Team Elo rating system."""
    
    def __init__(self):
        self.config = Config()
        self.config.load()
        
        self.initial_rating = self.config.get('elo.team.initial_rating', 1500)
        self.k_factor = self.config.get('elo.team.k_factor', 20)
        self.home_advantage = self.config.get('elo.team.home_advantage', 50)
        self.reversion_factor = self.config.get('elo.team.reversion_factor', 0.33)
        
        # Current ratings dictionary: team_id -> rating
        self.ratings: Dict[str, float] = {}
        
        # History: list of (season, week, team_id, rating)
        self.history = []
    
    def initialize_ratings(self, teams: list):
        """Initialize all teams to base rating."""
        for team_id in teams:
            self.ratings[team_id] = self.initial_rating
        logger.info(f"Initialized {len(teams)} teams with rating {self.initial_rating}")
    
    def get_rating(self, team_id: str) -> float:
        """Get current rating for a team."""
        return self.ratings.get(team_id, self.initial_rating)
    
    def expected_score(self, rating_a: float, rating_b: float) -> float:
        """
        Calculate expected score using logistic function.
        
        Args:
            rating_a: Rating of team A
            rating_b: Rating of team B
            
        Returns:
            Expected probability that A wins (0-1)
        """
        return 1.0 / (1.0 + 10 ** ((rating_b - rating_a) / 400.0))
    
    def mov_multiplier(self, margin: int) -> float:
        """
        Margin of victory multiplier.
        Dampens impact of blowouts.
        
        Args:
            margin: Point differential (positive)
            
        Returns:
            Multiplier (1.0 to ~2.5)
        """
        return np.log(abs(margin) + 1)
    
    def update_ratings(
        self,
        home_team: str,
        away_team: str,
        home_score: int,
        away_score: int,
        season: int,
        week: int,
        is_playoff: bool = False
    ) -> Tuple[float, float]:
        """
        Update Elo ratings after a game.
        
        Args:
            home_team: Home team ID
            away_team: Away team ID
            home_score: Home team score
            away_score: Away team score
            season: Season year
            week: Week number
            is_playoff: Whether game is playoff
            
        Returns:
            Tuple of (new_home_rating, new_away_rating)
        """
        # Get current ratings
        home_rating = self.get_rating(home_team)
        away_rating = self.get_rating(away_team)
        
        # Adjust for home field advantage
        home_rating_adj = home_rating + self.home_advantage
        
        # Expected scores
        home_expected = self.expected_score(home_rating_adj, away_rating)
        away_expected = 1.0 - home_expected
        
        # Actual result (1 = win, 0.5 = tie, 0 = loss)
        if home_score > away_score:
            home_result = 1.0
            away_result = 0.0
        elif home_score < away_score:
            home_result = 0.0
            away_result = 1.0
        else:
            home_result = 0.5
            away_result = 0.5
        
        # Margin of victory multiplier
        margin = abs(home_score - away_score)
        mov_mult = self.mov_multiplier(margin)
        
        # Playoff multiplier (playoffs matter more)
        playoff_mult = 1.2 if is_playoff else 1.0
        
        # Calculate rating changes
        k = self.k_factor * mov_mult * playoff_mult
        
        home_change = k * (home_result - home_expected)
        away_change = k * (away_result - away_expected)
        
        # Update ratings
        new_home_rating = home_rating + home_change
        new_away_rating = away_rating + away_change
        
        self.ratings[home_team] = new_home_rating
        self.ratings[away_team] = new_away_rating
        
        # Record history
        self.history.append((season, week, home_team, new_home_rating))
        self.history.append((season, week, away_team, new_away_rating))
        
        logger.debug(f"Updated: {home_team} {home_rating:.1f}->{new_home_rating:.1f}, "
                    f"{away_team} {away_rating:.1f}->{new_away_rating:.1f}")
        
        return new_home_rating, new_away_rating
    
    def regress_to_mean(self):
        """Apply mean reversion at start of new season."""
        mean_rating = self.initial_rating
        
        for team_id in self.ratings:
            current = self.ratings[team_id]
            new_rating = current * (1 - self.reversion_factor) + mean_rating * self.reversion_factor
            self.ratings[team_id] = new_rating
        
        logger.info(f"Applied {self.reversion_factor} reversion to mean")
    
    def save_history(self, output_path: str):
        """Save Elo history to parquet."""
        if not self.history:
            logger.warning("No history to save")
            return
        
        df = pd.DataFrame(
            self.history,
            columns=['season', 'week', 'team_id', 'elo_rating']
        )
        
        save_parquet(df, output_path)
        logger.info(f"Saved Elo history to {output_path}")
    
    def load_history(self, input_path: str):
        """Load Elo history from parquet."""
        df = load_parquet(input_path)
        if df is None:
            logger.warning(f"No history file found at {input_path}")
            return
        
        # Restore latest ratings
        latest = df.groupby('team_id').last().reset_index()
        for _, row in latest.iterrows():
            self.ratings[row['team_id']] = row['elo_rating']
        
        # Restore full history
        self.history = list(df.itertuples(index=False, name=None))
        
        logger.info(f"Loaded Elo history from {input_path}")
    
    def get_matchup_probability(
        self,
        home_team: str,
        away_team: str,
        neutral_site: bool = False
    ) -> Tuple[float, float]:
        """
        Get win probability for an upcoming matchup.
        
        Args:
            home_team: Home team ID
            away_team: Away team ID
            neutral_site: Whether game is at neutral site
            
        Returns:
            Tuple of (home_win_prob, away_win_prob)
        """
        home_rating = self.get_rating(home_team)
        away_rating = self.get_rating(away_team)
        
        # Apply home advantage if not neutral
        if not neutral_site:
            home_rating += self.home_advantage
        
        home_prob = self.expected_score(home_rating, away_rating)
        away_prob = 1.0 - home_prob
        
        return home_prob, away_prob


def compute_team_elo_historical(games_df: pd.DataFrame, output_dir: str):
    """
    Compute team Elo ratings for historical games.
    
    Args:
        games_df: DataFrame with game results
        output_dir: Output directory for Elo history
    """
    ensure_dir(output_dir)
    
    elo = TeamElo()
    
    # Initialize teams
    all_teams = set(games_df['home_team_id'].unique()) | set(games_df['away_team_id'].unique())
    elo.initialize_ratings(list(all_teams))
    
    # Sort games by season and week
    games_df = games_df.sort_values(['season', 'week']).copy()
    
    current_season = None
    
    for _, game in games_df.iterrows():
        # Apply reversion at start of new season
        if current_season is not None and game['season'] != current_season:
            elo.regress_to_mean()
        current_season = game['season']
        
        # Update ratings
        if pd.notna(game['home_score']) and pd.notna(game['away_score']):
            elo.update_ratings(
                home_team=game['home_team_id'],
                away_team=game['away_team_id'],
                home_score=int(game['home_score']),
                away_score=int(game['away_score']),
                season=game['season'],
                week=game['week'],
                is_playoff=game.get('game_type', 'REG') == 'POST'
            )
    
    # Save history
    output_path = f"{output_dir}/team_elo_history.parquet"
    elo.save_history(output_path)
    
    logger.info("Team Elo computation complete")


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    
    # Test Elo system
    elo = TeamElo()
    elo.initialize_ratings(['KC', 'BUF', 'SF', 'BAL'])
    
    # Simulate some games
    elo.update_ratings('KC', 'BUF', 27, 24, 2024, 1)
    elo.update_ratings('SF', 'BAL', 31, 17, 2024, 1)
    
    # Get matchup probability
    kc_prob, buf_prob = elo.get_matchup_probability('KC', 'BUF')
    print(f"\nKC vs BUF: {kc_prob:.1%} - {buf_prob:.1%}")
    
    print(f"KC rating: {elo.get_rating('KC'):.1f}")
    print(f"BUF rating: {elo.get_rating('BUF'):.1f}")
    
    print("\nTeam Elo system test complete!")
