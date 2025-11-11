"""
FastAPI service for Singing Object Studio
Provides real audio synthesis and song composition
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import random
import time
import base64
import io
from typing import List

import numpy as np
from scipy.io import wavfile

from models import ComposeRequest, SongResult, SongTrack, TrackWaveformPoint

# Configuration
SAMPLE_RATE = 44100
MAX_TRACKS = 10
DEFAULT_DURATION = 8  # seconds

app = FastAPI(
    title="Singing Object Studio API",
    description="Backend service for composing songs with real audio synthesis",
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


def synth_track(obj: dict, duration: float, sr: int = SAMPLE_RATE) -> np.ndarray:
    """
    Synthesize a single audio track using oscillators
    
    Args:
        obj: Singing object with vocalRange, mood, volume, etc.
        duration: Length in seconds
        sr: Sample rate
    
    Returns:
        numpy array of audio samples
    """
    num_samples = int(duration * sr)
    t = np.linspace(0, duration, num_samples, False)
    
    # Base frequencies for vocal ranges
    base_freqs = {
        'bass': 110,    # A2
        'tenor': 196,   # G3
        'alto': 262,    # C4
        'soprano': 392  # G4
    }
    base_freq = base_freqs.get(obj.get('vocalRange', 'alto'), 262)
    
    # Create melodic pattern based on object ID
    seed = sum(ord(c) for c in obj.get('id', 'default'))
    rng = np.random.RandomState(seed)
    
    # Musical scale intervals (major scale)
    scale = np.array([0, 2, 4, 5, 7, 9, 11, 12])
    note_duration = 0.5  # seconds per note
    notes_count = int(duration / note_duration)
    
    # Generate audio
    audio = np.zeros(num_samples)
    
    for note_idx in range(notes_count):
        start_sample = int(note_idx * note_duration * sr)
        end_sample = int((note_idx + 1) * note_duration * sr)
        if end_sample > num_samples:
            end_sample = num_samples
        
        note_samples = end_sample - start_sample
        note_t = np.linspace(0, note_duration, note_samples, False)
        
        # Choose random note from scale
        semitones = scale[rng.randint(0, len(scale))]
        freq = base_freq * (2 ** (semitones / 12))
        
        # Mix sine and triangle waves
        sine_wave = np.sin(2 * np.pi * freq * note_t)
        triangle_wave = (2 / np.pi) * np.arcsin(np.sin(2 * np.pi * freq * note_t))
        
        # Envelope (ADSR-like)
        envelope = np.ones(note_samples)
        attack_samples = int(0.1 * note_duration * sr)
        release_samples = int(0.2 * note_duration * sr)
        
        if attack_samples > 0:
            envelope[:attack_samples] = np.linspace(0, 1, attack_samples)
        if release_samples > 0:
            envelope[-release_samples:] = np.linspace(1, 0, release_samples)
        
        # Mix waveforms
        mix = 0.6 * sine_wave + 0.4 * triangle_wave
        
        # Apply mood modulation
        mood = obj.get('mood', {})
        brightness = mood.get('bright', 0.5)
        happiness = mood.get('happy', 0.5)
        calmness = mood.get('calm', 0.5)
        
        # Brightness affects tremolo
        tremolo = 1 + brightness * 0.2 * np.sin(2 * np.pi * 5 * note_t)
        
        # Energy based on happiness
        energy = 0.3 + happiness * 0.5
        
        # Sustain based on calmness
        sustain = calmness * 0.8 + 0.2
        
        # Apply effects
        note_audio = mix * envelope * tremolo * energy * sustain
        
        # Add to main audio
        audio[start_sample:end_sample] += note_audio
    
    # Apply volume
    volume = obj.get('volume', 0.7)
    audio *= volume
    
    return audio


def mix_tracks(tracks: List[np.ndarray]) -> np.ndarray:
    """
    Mix multiple audio tracks together with normalization
    
    Args:
        tracks: List of numpy audio arrays
    
    Returns:
        Mixed and normalized audio
    """
    if not tracks:
        raise ValueError("No tracks to mix")
    
    # Ensure all tracks have same length
    max_length = max(len(track) for track in tracks)
    mixed = np.zeros(max_length)
    
    for track in tracks:
        if len(track) < max_length:
            # Pad with zeros
            padded = np.zeros(max_length)
            padded[:len(track)] = track
            mixed += padded
        else:
            mixed += track
    
    # Normalize to prevent clipping
    max_val = np.abs(mixed).max()
    if max_val > 0:
        mixed = mixed / max_val * 0.8  # Leave some headroom
    
    return mixed


def wav_data_url(audio: np.ndarray, sr: int = SAMPLE_RATE) -> str:
    """
    Encode audio as WAV data URL
    
    Args:
        audio: numpy audio array
        sr: Sample rate
    
    Returns:
        data URL string
    """
    # Convert to 16-bit PCM
    audio_int = np.int16(audio * 32767)
    
    # Create WAV file in memory
    buffer = io.BytesIO()
    wavfile.write(buffer, sr, audio_int)
    
    # Get WAV data
    wav_data = buffer.getvalue()
    
    # Encode as base64 data URL
    b64_data = base64.b64encode(wav_data).decode('utf-8')
    return f"data:audio/wav;base64,{b64_data}"


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
    Compose a song from singing objects with real audio synthesis
    
    This endpoint generates real audio using numpy-based synthesis,
    creates distinct waveforms for visualization, and returns a
    data URL containing the mixed WAV audio.
    """
    try:
        # Filter enabled objects
        enabled_objects = [obj for obj in request.objects if obj.enabled]
        
        if not enabled_objects:
            raise HTTPException(status_code=400, detail="At least one object must be enabled")
        
        if len(enabled_objects) > MAX_TRACKS:
            raise HTTPException(
                status_code=400,
                detail=f"Too many tracks (max {MAX_TRACKS})"
            )
        
        # Synthesize audio for each track
        audio_tracks = []
        song_tracks = []
        
        for index, obj in enumerate(enabled_objects):
            # Convert Pydantic model to dict for synth_track
            obj_dict = obj.model_dump()
            
            # Generate audio
            track_audio = synth_track(obj_dict, DEFAULT_DURATION, SAMPLE_RATE)
            audio_tracks.append(track_audio)
            
            # Generate visualization waveform with distinct seed
            seed = 42 + (index * 137) if request.harmonyMode else 42
            waveform = make_waveform(256, seed)
            
            # Create track metadata
            track = SongTrack(
                objectId=obj.id,
                displayName=obj.name,
                genre=obj.genre,
                vocalRange=obj.vocalRange,
                enabled=obj.enabled,
                volume=obj.volume,
                waveform=waveform
            )
            song_tracks.append(track)
        
        # Mix all tracks together
        mixed_audio = mix_tracks(audio_tracks)
        
        # Encode as WAV data URL
        audio_data_url = wav_data_url(mixed_audio, SAMPLE_RATE)
        
        # Generate song metadata
        keys = ['C', 'D', 'E', 'F', 'G', 'A', 'B']
        random_key = random.choice(keys)
        random_bpm = random.randint(100, 160)
        
        default_title = (
            f"Harmony of {len(enabled_objects)} Objects" 
            if request.harmonyMode 
            else enabled_objects[0].name
        )
        
        song_result = SongResult(
            id=f"song-{int(time.time() * 1000)}",
            title=request.title or default_title,
            bpm=random_bpm,
            key=random_key,
            harmonyMode=request.harmonyMode,
            mixedAudioUrl=audio_data_url,
            tracks=song_tracks
        )
        
        return song_result
        
    except HTTPException:
        raise
    except Exception as e:
        # Log error and return graceful failure
        import traceback
        print(f"Error composing song: {e}")
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to compose song: {str(e)}"
        )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
