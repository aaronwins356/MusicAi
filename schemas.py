"""
Pydantic data models for FightIQ-Football.
Defines schemas for teams, players, games, plays, and live state.
"""

from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field, validator
from enum import Enum


class Position(str, Enum):
    """Player position enumeration."""
    QB = "QB"
    RB = "RB"
    WR = "WR"
    TE = "TE"
    OL = "OL"
    DL = "DL"
    LB = "LB"
    CB = "CB"
    S = "S"
    K = "K"
    P = "P"
    UNKNOWN = "UNKNOWN"


class PlayerStatus(str, Enum):
    """Player availability status."""
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"
    INJURED = "INJURED"
    QUESTIONABLE = "QUESTIONABLE"
    DOUBTFUL = "DOUBTFUL"
    OUT = "OUT"
    IR = "IR"
    PRACTICE_SQUAD = "PRACTICE_SQUAD"


class GameStatus(str, Enum):
    """Game status enumeration."""
    SCHEDULED = "SCHEDULED"
    IN_PROGRESS = "IN_PROGRESS"
    FINAL = "FINAL"
    POSTPONED = "POSTPONED"
    CANCELLED = "CANCELLED"


class PlayType(str, Enum):
    """Play type enumeration."""
    PASS = "PASS"
    RUSH = "RUSH"
    PUNT = "PUNT"
    FIELD_GOAL = "FIELD_GOAL"
    KICKOFF = "KICKOFF"
    EXTRA_POINT = "EXTRA_POINT"
    TWO_POINT = "TWO_POINT"
    PENALTY = "PENALTY"
    TIMEOUT = "TIMEOUT"
    END_QUARTER = "END_QUARTER"
    UNKNOWN = "UNKNOWN"


class Team(BaseModel):
    """NFL team model."""
    team_id: str
    abbr: str = Field(..., description="Team abbreviation (e.g., KC, BUF)")
    full_name: str
    city: str
    conference: str  # AFC or NFC
    division: str  # North, South, East, West
    stadium: Optional[str] = None
    surface: Optional[str] = None  # Turf, Grass
    
    class Config:
        use_enum_values = True


class Player(BaseModel):
    """NFL player model."""
    player_id: str
    name: str
    team_id: str
    position: Position
    jersey_number: Optional[int] = None
    status: PlayerStatus = PlayerStatus.ACTIVE
    depth_chart_order: Optional[int] = None
    height_inches: Optional[int] = None
    weight_lbs: Optional[int] = None
    college: Optional[str] = None
    draft_year: Optional[int] = None
    
    class Config:
        use_enum_values = True


class Game(BaseModel):
    """NFL game model."""
    game_id: str
    season: int
    week: int
    game_type: str = "REG"  # REG, POST, PRE
    home_team_id: str
    away_team_id: str
    kickoff: datetime
    venue: Optional[str] = None
    weather: Optional[Dict[str, Any]] = None
    status: GameStatus = GameStatus.SCHEDULED
    home_score: Optional[int] = None
    away_score: Optional[int] = None
    
    class Config:
        use_enum_values = True


class Play(BaseModel):
    """Play-by-play data model."""
    play_id: str
    game_id: str
    drive_id: Optional[str] = None
    quarter: int
    time_remaining: Optional[str] = None  # MM:SS format
    down: Optional[int] = None
    distance: Optional[int] = None
    yard_line: Optional[int] = None  # 0-100, relative to offense
    possession_team_id: str
    play_type: PlayType
    play_description: str
    yards_gained: Optional[int] = None
    is_touchdown: bool = False
    is_turnover: bool = False
    is_penalty: bool = False
    is_scoring_play: bool = False
    epa: Optional[float] = None  # Expected Points Added (if calculated)
    
    class Config:
        use_enum_values = True


class BoxScoreLine(BaseModel):
    """Player game statistics."""
    game_id: str
    player_id: str
    team_id: str
    
    # Passing stats
    pass_attempts: int = 0
    pass_completions: int = 0
    pass_yards: int = 0
    pass_touchdowns: int = 0
    interceptions: int = 0
    sacks_taken: int = 0
    
    # Rushing stats
    rush_attempts: int = 0
    rush_yards: int = 0
    rush_touchdowns: int = 0
    
    # Receiving stats
    targets: int = 0
    receptions: int = 0
    receiving_yards: int = 0
    receiving_touchdowns: int = 0
    
    # Other
    fumbles: int = 0
    fumbles_lost: int = 0
    snaps_played: Optional[int] = None


class LiveState(BaseModel):
    """Live game state model."""
    game_id: str
    timestamp: datetime
    quarter: int
    time_remaining: str  # MM:SS
    possession_team_id: str
    down: Optional[int] = None
    distance: Optional[int] = None
    yard_line: Optional[int] = None
    home_score: int
    away_score: int
    is_red_zone: bool = False
    home_timeouts: int = 3
    away_timeouts: int = 3
    last_play_description: Optional[str] = None
    
    @validator('is_red_zone', always=True)
    def check_red_zone(cls, v, values):
        """Determine if offense is in red zone."""
        if 'yard_line' in values and values['yard_line'] is not None:
            return values['yard_line'] >= 80
        return False


class EloRating(BaseModel):
    """Elo rating snapshot."""
    entity_id: str  # team_id or player_id
    entity_type: str  # "team" or "player"
    season: int
    week: int
    rating: float
    games_played: int = 0
    
    # Player-specific
    position: Optional[Position] = None
    
    class Config:
        use_enum_values = True


class GamePrediction(BaseModel):
    """Game prediction output."""
    game_id: str
    season: int
    week: int
    home_team_id: str
    away_team_id: str
    
    # Win probability
    home_win_prob: float = Field(..., ge=0.0, le=1.0)
    away_win_prob: float = Field(..., ge=0.0, le=1.0)
    
    # Score predictions
    home_score_mean: float
    away_score_mean: float
    home_score_median: Optional[float] = None
    away_score_median: Optional[float] = None
    
    # Spread and total
    spread: float  # Positive = home favored
    total: float
    spread_std: Optional[float] = None
    total_std: Optional[float] = None
    
    # Model metadata
    model_version: str
    prediction_timestamp: datetime
    
    @validator('away_win_prob', always=True)
    def validate_probabilities(cls, v, values):
        """Ensure probabilities sum to 1."""
        if 'home_win_prob' in values:
            assert abs(values['home_win_prob'] + v - 1.0) < 0.01
        return v


class PlayerStatProjection(BaseModel):
    """Player stat projection."""
    game_id: str
    player_id: str
    position: Position
    
    # Projections (mean, std, percentiles)
    pass_attempts_proj: Optional[Dict[str, float]] = None
    pass_yards_proj: Optional[Dict[str, float]] = None
    pass_td_proj: Optional[Dict[str, float]] = None
    int_proj: Optional[Dict[str, float]] = None
    
    rush_attempts_proj: Optional[Dict[str, float]] = None
    rush_yards_proj: Optional[Dict[str, float]] = None
    rush_td_proj: Optional[Dict[str, float]] = None
    
    targets_proj: Optional[Dict[str, float]] = None
    receptions_proj: Optional[Dict[str, float]] = None
    receiving_yards_proj: Optional[Dict[str, float]] = None
    receiving_td_proj: Optional[Dict[str, float]] = None
    
    model_version: str
    projection_timestamp: datetime
    
    class Config:
        use_enum_values = True


class ClusterArchetype(BaseModel):
    """Player/team archetype from clustering."""
    entity_id: str
    entity_type: str  # "qb", "coach", "defense"
    season: int
    cluster_id: int
    cluster_label: str
    cluster_confidence: Optional[float] = None
    features: Optional[Dict[str, float]] = None


if __name__ == "__main__":
    # Test models
    team = Team(
        team_id="KC",
        abbr="KC",
        full_name="Kansas City Chiefs",
        city="Kansas City",
        conference="AFC",
        division="West",
        stadium="GEHA Field at Arrowhead Stadium",
        surface="Grass"
    )
    print(f"Team: {team.full_name}")
    
    player = Player(
        player_id="P001",
        name="Patrick Mahomes",
        team_id="KC",
        position=Position.QB,
        jersey_number=15,
        status=PlayerStatus.ACTIVE
    )
    print(f"Player: {player.name} - {player.position}")
    
    print("All schemas validated successfully!")
