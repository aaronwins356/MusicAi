from pydantic import BaseModel, Field
from typing import List, Literal, Optional

# Vocal range types
VocalRange = Literal['bass', 'tenor', 'alto', 'soprano']


class Mood(BaseModel):
    """Mood spectrum for a singing object"""
    happy: float = Field(..., ge=0.0, le=1.0, description="Happiness level (0-1)")
    calm: float = Field(..., ge=0.0, le=1.0, description="Calmness level (0-1)")
    bright: float = Field(..., ge=0.0, le=1.0, description="Brightness level (0-1)")


class SingingObject(BaseModel):
    """A singing object with personality and musical characteristics"""
    id: str
    type: str = Field(..., description="e.g., 'Lamp', 'Kettle'")
    name: str = Field(..., description="Display name")
    personality: str = Field(..., description="1-2 sentence personality description")
    genre: str = Field(..., description="Musical genre")
    vocalRange: VocalRange
    mood: Mood
    lyrics: Optional[str] = None
    icon: str = Field(default="🎵")
    color: str = Field(default="#000000")
    volume: float = Field(default=0.75, ge=0.0, le=1.0)
    enabled: bool = True
    createdAt: str
    updatedAt: str


class TrackWaveformPoint(BaseModel):
    """Single point in a waveform"""
    t: float = Field(..., description="Time position (0-1)")
    v: float = Field(..., ge=-1.0, le=1.0, description="Value (-1 to 1)")


class SongTrack(BaseModel):
    """Individual track in a song"""
    objectId: str
    displayName: str
    genre: str
    vocalRange: VocalRange
    enabled: bool
    volume: float = Field(..., ge=0.0, le=1.0)
    waveform: List[TrackWaveformPoint]


class SongResult(BaseModel):
    """Complete song output"""
    id: str
    title: str
    bpm: int = Field(..., ge=40, le=240)
    key: str = Field(..., description="Musical key")
    harmonyMode: bool
    mixedAudioUrl: str = Field(..., description="URL to mixed audio file")
    tracks: List[SongTrack]


class ComposeRequest(BaseModel):
    """Request to compose a song"""
    title: Optional[str] = None
    harmonyMode: bool = False
    objects: List[SingingObject]
