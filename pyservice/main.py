"""
FastAPI service for Singing Object Studio
Provides song composition endpoint that mirrors the Node.js mock implementation
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import random
import time
from typing import List

from models import ComposeRequest, SongResult, SongTrack, TrackWaveformPoint

app = FastAPI(
    title="Singing Object Studio API",
    description="Backend service for composing songs from singing objects",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def pseudo_random(seed: int):
    """Pseudo-random number generator with seed for deterministic results"""
    def generator():
        nonlocal seed
        seed = (seed * 9301 + 49297) % 233280
        return seed / 233280
    return generator


def make_waveform(length: int = 256, seed: int = 42) -> List[TrackWaveformPoint]:
    """Generate a deterministic waveform for visualization"""
    rnd = pseudo_random(seed)
    waveform = []
    
    for i in range(length):
        t = i / (length - 1)
        # smooth-ish noise
        import math
        v = (rnd() - 0.5) * 2 * (0.6 + 0.4 * math.sin(i / 12))
        v = max(-1.0, min(1.0, v))
        waveform.append(TrackWaveformPoint(t=t, v=v))
    
    return waveform


@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "service": "Singing Object Studio API",
        "status": "ok",
        "version": "1.0.0"
    }


@app.get("/health")
async def health():
    """Health check endpoint"""
    return {
        "status": "ok",
        "timestamp": time.time()
    }


@app.post("/compose", response_model=SongResult)
async def compose_song(request: ComposeRequest):
    """
    Compose a song from singing objects
    
    This endpoint generates a mock song result with distinct waveforms
    for each track when in harmony mode.
    """
    # Filter enabled objects
    enabled_objects = [obj for obj in request.objects if obj.enabled]
    
    if not enabled_objects:
        raise HTTPException(status_code=400, detail="At least one object must be enabled")
    
    # Generate distinct waveforms for each track
    tracks: List[SongTrack] = []
    for index, obj in enumerate(enabled_objects):
        # In harmony mode, use different seeds to create distinct waveforms
        seed = 42 + (index * 137) if request.harmonyMode else 42
        waveform = make_waveform(256, seed)
        
        track = SongTrack(
            objectId=obj.id,
            displayName=obj.name,
            genre=obj.genre,
            vocalRange=obj.vocalRange,
            enabled=obj.enabled,
            volume=obj.volume,
            waveform=waveform
        )
        tracks.append(track)
    
    # Generate song metadata
    keys = ['C', 'D', 'E', 'F', 'G', 'A', 'B']
    random_key = random.choice(keys)
    random_bpm = random.randint(100, 160)
    
    default_title = (
        f"Harmony of {len(enabled_objects)} Objects" 
        if request.harmonyMode 
        else enabled_objects[0].name
    )
    
    # Generate mock audio URL (silent MP3 data URL)
    mock_audio_url = "data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAADhAC7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7v///////////////////////////////////////////////////////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAAAAAAAAAAAA4T8AgMlAAAAAAAAAAAAAAAAAAAAAP/7kGQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAADhAC7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7v///////////////////////////////////////////////////////////8AAAA8TEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/7kGQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAADhAC7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7v///////////////////////////////////////////////////////////8AAABMQU1FMy4xMDBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV"
    
    song_result = SongResult(
        id=f"song-{int(time.time() * 1000)}",
        title=request.title or default_title,
        bpm=random_bpm,
        key=random_key,
        harmonyMode=request.harmonyMode,
        mixedAudioUrl=mock_audio_url,
        tracks=tracks
    )
    
    return song_result


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
