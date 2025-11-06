"""
Utility functions for FightIQ-Football system.
Shared helpers for configuration, logging, file I/O, and common operations.
"""

import os
import yaml
import logging
import hashlib
import json
from pathlib import Path
from typing import Any, Dict, Optional
from datetime import datetime
import pandas as pd
import pyarrow.parquet as pq


# Configuration management
class Config:
    """Global configuration singleton."""
    _instance = None
    _config = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    def load(self, config_path: str = "config/config.yaml"):
        """Load configuration from YAML file."""
        if self._config is None:
            with open(config_path, 'r') as f:
                self._config = yaml.safe_load(f)
        return self._config
    
    def get(self, key_path: str, default: Any = None) -> Any:
        """Get config value using dot notation (e.g., 'system.version')."""
        if self._config is None:
            self.load()
        
        keys = key_path.split('.')
        value = self._config
        for key in keys:
            if isinstance(value, dict) and key in value:
                value = value[key]
            else:
                return default
        return value


# Logging setup
def setup_logging(log_dir: str = "logs", level: str = "INFO") -> logging.Logger:
    """Configure logging with file and console handlers."""
    os.makedirs(log_dir, exist_ok=True)
    
    log_file = os.path.join(log_dir, f"fightiq_{datetime.now().strftime('%Y%m%d')}.log")
    
    logging.basicConfig(
        level=getattr(logging, level),
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.FileHandler(log_file),
            logging.StreamHandler()
        ]
    )
    
    return logging.getLogger('FightIQ-Football')


# File operations
def ensure_dir(path: str) -> None:
    """Create directory if it doesn't exist."""
    Path(path).mkdir(parents=True, exist_ok=True)


def hash_content(content: str) -> str:
    """Generate SHA256 hash of content."""
    return hashlib.sha256(content.encode('utf-8')).hexdigest()


def save_json(data: Dict, filepath: str) -> None:
    """Save dictionary as JSON."""
    ensure_dir(os.path.dirname(filepath))
    with open(filepath, 'w') as f:
        json.dump(data, f, indent=2, default=str)


def load_json(filepath: str) -> Optional[Dict]:
    """Load JSON file."""
    if not os.path.exists(filepath):
        return None
    with open(filepath, 'r') as f:
        return json.load(f)


def save_parquet(df: pd.DataFrame, filepath: str) -> None:
    """Save DataFrame as Parquet."""
    ensure_dir(os.path.dirname(filepath))
    df.to_parquet(filepath, index=False, engine='pyarrow', compression='snappy')


def load_parquet(filepath: str) -> Optional[pd.DataFrame]:
    """Load Parquet file."""
    if not os.path.exists(filepath):
        return None
    return pd.read_parquet(filepath, engine='pyarrow')


# Timestamp utilities
def get_timestamp(format: str = "%Y%m%d_%H%M%S") -> str:
    """Get current timestamp string."""
    return datetime.now().strftime(format)


def get_season_from_date(date: datetime) -> int:
    """Determine NFL season from date (season starts in September)."""
    if date.month >= 9:
        return date.year
    else:
        return date.year - 1


# Data validation
def validate_schema(df: pd.DataFrame, required_columns: list) -> bool:
    """Check if DataFrame has required columns."""
    return all(col in df.columns for col in required_columns)


# Cache management
class CacheManager:
    """Simple file-based cache with content hashing."""
    
    def __init__(self, cache_dir: str = "data/raw"):
        self.cache_dir = cache_dir
        ensure_dir(cache_dir)
    
    def get_cache_path(self, source: str, identifier: str) -> str:
        """Generate cache file path."""
        timestamp = get_timestamp()
        safe_id = identifier.replace('/', '_').replace(':', '_')
        return os.path.join(self.cache_dir, source, f"{safe_id}_{timestamp}.html")
    
    def save(self, source: str, identifier: str, content: str) -> str:
        """Save content to cache."""
        cache_path = self.get_cache_path(source, identifier)
        ensure_dir(os.path.dirname(cache_path))
        
        with open(cache_path, 'w', encoding='utf-8') as f:
            f.write(content)
        
        # Save metadata
        metadata = {
            'timestamp': get_timestamp(),
            'source': source,
            'identifier': identifier,
            'hash': hash_content(content)
        }
        meta_path = cache_path.replace('.html', '_meta.json')
        save_json(metadata, meta_path)
        
        return cache_path
    
    def get_latest(self, source: str, pattern: str = "*") -> Optional[str]:
        """Get most recent cached file matching pattern."""
        source_dir = os.path.join(self.cache_dir, source)
        if not os.path.exists(source_dir):
            return None
        
        files = sorted(Path(source_dir).glob(f"{pattern}*.html"))
        return str(files[-1]) if files else None


# Retry decorator
def retry_with_backoff(max_retries: int = 3, base_delay: float = 1.0):
    """Decorator for retrying functions with exponential backoff."""
    import time
    import functools
    
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            for attempt in range(max_retries):
                try:
                    return func(*args, **kwargs)
                except Exception as e:
                    if attempt == max_retries - 1:
                        raise
                    delay = base_delay * (2 ** attempt)
                    logging.warning(f"Attempt {attempt + 1} failed: {e}. Retrying in {delay}s...")
                    time.sleep(delay)
        return wrapper
    return decorator


# Season/Week helpers
def get_current_nfl_week() -> tuple:
    """Get current NFL season and week (approximate)."""
    now = datetime.now()
    season = get_season_from_date(now)
    
    # Rough approximation: season starts early September
    season_start = datetime(season, 9, 1)
    if now < season_start:
        # Offseason
        return season - 1, 18
    
    weeks_elapsed = (now - season_start).days // 7
    week = min(weeks_elapsed + 1, 18)
    
    return season, week


# Parallel processing helper
def parallel_apply(func, items, n_jobs: int = -1):
    """Apply function to items in parallel using joblib."""
    from joblib import Parallel, delayed
    return Parallel(n_jobs=n_jobs)(delayed(func)(item) for item in items)


if __name__ == "__main__":
    # Test utilities
    config = Config()
    config.load()
    print(f"System: {config.get('system.name')}")
    print(f"Version: {config.get('system.version')}")
    
    logger = setup_logging()
    logger.info("Utilities module loaded successfully")
    
    season, week = get_current_nfl_week()
    print(f"Current NFL season: {season}, Week: {week}")
