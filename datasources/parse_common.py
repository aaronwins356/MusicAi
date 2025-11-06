"""
Common parsing utilities for web scraping.
Shared functions for HTML/JSON parsing, error handling, and data extraction.
"""

import re
import time
import logging
from typing import Optional, Dict, Any, List
from datetime import datetime
import requests
from bs4 import BeautifulSoup
from utils import retry_with_backoff, CacheManager, Config

logger = logging.getLogger(__name__)


class BaseScraper:
    """Base class for all scrapers."""
    
    def __init__(self, cache_enabled: bool = True):
        self.config = Config()
        self.config.load()
        
        self.cache_enabled = cache_enabled
        self.cache = CacheManager() if cache_enabled else None
        
        self.user_agent = self.config.get('scraping.user_agent')
        self.delay = self.config.get('scraping.delay_seconds', 2)
        self.timeout = self.config.get('scraping.timeout_seconds', 30)
        self.max_retries = self.config.get('scraping.max_retries', 3)
        
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': self.user_agent,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
        })
        
        self.last_request_time = 0
    
    def _rate_limit(self):
        """Enforce rate limiting between requests."""
        elapsed = time.time() - self.last_request_time
        if elapsed < self.delay:
            time.sleep(self.delay - elapsed)
        self.last_request_time = time.time()
    
    @retry_with_backoff(max_retries=3)
    def fetch_url(self, url: str, params: Optional[Dict] = None) -> Optional[str]:
        """
        Fetch URL with rate limiting and caching.
        
        Args:
            url: URL to fetch
            params: Query parameters
            
        Returns:
            HTML content or None if failed
        """
        self._rate_limit()
        
        logger.info(f"Fetching: {url}")
        
        try:
            response = self.session.get(
                url,
                params=params,
                timeout=self.timeout
            )
            response.raise_for_status()
            
            content = response.text
            
            # Cache the response
            if self.cache_enabled and self.cache:
                self.cache.save(
                    source=self.__class__.__name__,
                    identifier=url,
                    content=content
                )
            
            return content
            
        except requests.RequestException as e:
            logger.error(f"Error fetching {url}: {e}")
            return None
    
    def parse_html(self, content: str) -> Optional[BeautifulSoup]:
        """Parse HTML content with BeautifulSoup."""
        if not content:
            return None
        return BeautifulSoup(content, 'lxml')
    
    def extract_json_from_script(self, soup: BeautifulSoup, pattern: str) -> Optional[Dict]:
        """
        Extract JSON data from script tags.
        
        Args:
            soup: BeautifulSoup object
            pattern: Regex pattern to find JSON
            
        Returns:
            Parsed JSON dict or None
        """
        import json
        
        for script in soup.find_all('script'):
            if script.string:
                match = re.search(pattern, script.string, re.DOTALL)
                if match:
                    try:
                        json_str = match.group(1)
                        return json.loads(json_str)
                    except (json.JSONDecodeError, AttributeError) as e:
                        logger.warning(f"Failed to parse JSON: {e}")
        return None


# Helper functions for common parsing tasks

def parse_date(date_str: str) -> Optional[datetime]:
    """
    Parse date string into datetime object.
    Handles multiple common formats.
    """
    formats = [
        '%Y-%m-%d',
        '%m/%d/%Y',
        '%B %d, %Y',
        '%b %d, %Y',
        '%Y-%m-%dT%H:%M:%S',
        '%Y-%m-%dT%H:%M:%SZ',
    ]
    
    for fmt in formats:
        try:
            return datetime.strptime(date_str, fmt)
        except ValueError:
            continue
    
    logger.warning(f"Could not parse date: {date_str}")
    return None


def parse_time_remaining(time_str: str) -> Optional[str]:
    """
    Parse time remaining string to MM:SS format.
    
    Args:
        time_str: Time string (e.g., "10:35", "0:45")
        
    Returns:
        Normalized MM:SS string or None
    """
    if not time_str:
        return None
    
    # Already in MM:SS format
    match = re.match(r'(\d{1,2}):(\d{2})', time_str.strip())
    if match:
        minutes, seconds = match.groups()
        return f"{int(minutes):02d}:{int(seconds):02d}"
    
    return None


def parse_score(score_str: str) -> Optional[int]:
    """
    Parse score string to integer.
    
    Args:
        score_str: Score as string
        
    Returns:
        Score as int or None
    """
    if not score_str:
        return None
    
    try:
        return int(re.sub(r'[^\d]', '', score_str))
    except ValueError:
        return None


def parse_yard_line(yard_str: str) -> Optional[int]:
    """
    Parse yard line to 0-100 scale (relative to offense).
    
    Args:
        yard_str: Yard line string (e.g., "KC 25", "OPP 35")
        
    Returns:
        Yard line 0-100 or None
    """
    if not yard_str:
        return None
    
    # Extract team and yard number
    match = re.search(r'([A-Z]+)\s*(\d+)', yard_str)
    if not match:
        return None
    
    team, yard = match.groups()
    yard = int(yard)
    
    # Normalize to 0-100 scale
    # Assuming "OWN" or team abbr for own territory
    if 'OPP' in yard_str or yard > 50:
        return 50 + yard
    else:
        return 50 - yard


def clean_team_name(name: str) -> str:
    """
    Normalize team name to standard abbreviation.
    
    Args:
        name: Team name or abbreviation
        
    Returns:
        Standardized team abbreviation
    """
    # Common team abbreviations mapping
    team_map = {
        'arizona cardinals': 'ARI', 'cardinals': 'ARI',
        'atlanta falcons': 'ATL', 'falcons': 'ATL',
        'baltimore ravens': 'BAL', 'ravens': 'BAL',
        'buffalo bills': 'BUF', 'bills': 'BUF',
        'carolina panthers': 'CAR', 'panthers': 'CAR',
        'chicago bears': 'CHI', 'bears': 'CHI',
        'cincinnati bengals': 'CIN', 'bengals': 'CIN',
        'cleveland browns': 'CLE', 'browns': 'CLE',
        'dallas cowboys': 'DAL', 'cowboys': 'DAL',
        'denver broncos': 'DEN', 'broncos': 'DEN',
        'detroit lions': 'DET', 'lions': 'DET',
        'green bay packers': 'GB', 'packers': 'GB',
        'houston texans': 'HOU', 'texans': 'HOU',
        'indianapolis colts': 'IND', 'colts': 'IND',
        'jacksonville jaguars': 'JAX', 'jaguars': 'JAX',
        'kansas city chiefs': 'KC', 'chiefs': 'KC',
        'las vegas raiders': 'LV', 'raiders': 'LV',
        'los angeles chargers': 'LAC', 'chargers': 'LAC',
        'los angeles rams': 'LAR', 'rams': 'LAR',
        'miami dolphins': 'MIA', 'dolphins': 'MIA',
        'minnesota vikings': 'MIN', 'vikings': 'MIN',
        'new england patriots': 'NE', 'patriots': 'NE',
        'new orleans saints': 'NO', 'saints': 'NO',
        'new york giants': 'NYG', 'giants': 'NYG',
        'new york jets': 'NYJ', 'jets': 'NYJ',
        'philadelphia eagles': 'PHI', 'eagles': 'PHI',
        'pittsburgh steelers': 'PIT', 'steelers': 'PIT',
        'san francisco 49ers': 'SF', '49ers': 'SF',
        'seattle seahawks': 'SEA', 'seahawks': 'SEA',
        'tampa bay buccaneers': 'TB', 'buccaneers': 'TB',
        'tennessee titans': 'TEN', 'titans': 'TEN',
        'washington commanders': 'WAS', 'commanders': 'WAS',
    }
    
    name_lower = name.lower().strip()
    return team_map.get(name_lower, name.upper()[:3])


def extract_player_stats(stat_table) -> List[Dict[str, Any]]:
    """
    Extract player statistics from HTML table.
    
    Args:
        stat_table: BeautifulSoup table element
        
    Returns:
        List of player stat dictionaries
    """
    stats = []
    
    if not stat_table:
        return stats
    
    rows = stat_table.find_all('tr')
    headers = [th.get_text(strip=True) for th in rows[0].find_all('th')] if rows else []
    
    for row in rows[1:]:
        cells = row.find_all('td')
        if len(cells) >= 2:
            stat_dict = {
                headers[i]: cell.get_text(strip=True)
                for i, cell in enumerate(cells) if i < len(headers)
            }
            stats.append(stat_dict)
    
    return stats


if __name__ == "__main__":
    # Test parsing functions
    print(f"Date: {parse_date('2024-01-15')}")
    print(f"Time: {parse_time_remaining('10:35')}")
    print(f"Score: {parse_score('21')}")
    print(f"Team: {clean_team_name('Kansas City Chiefs')}")
    print("Parse utilities loaded successfully!")
