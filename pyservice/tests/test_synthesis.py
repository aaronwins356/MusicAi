"""
Tests for audio synthesis functions
"""

import pytest
import numpy as np
from main import synth_track, mix_tracks, wav_data_url, SAMPLE_RATE


def test_synth_track_generates_audio():
    """Test that synth_track generates audio of correct length"""
    obj = {
        'id': 'test-1',
        'vocalRange': 'alto',
        'mood': {
            'bright': 0.5,
            'happy': 0.5,
            'calm': 0.5,
        },
        'volume': 0.7,
    }
    
    duration = 2.0
    audio = synth_track(obj, duration, SAMPLE_RATE)
    
    # Check audio is numpy array
    assert isinstance(audio, np.ndarray)
    
    # Check correct length (within small tolerance)
    expected_samples = int(duration * SAMPLE_RATE)
    assert abs(len(audio) - expected_samples) < 10
    
    # Check audio is in valid range
    assert np.all(audio >= -1.0)
    assert np.all(audio <= 1.0)


def test_synth_track_different_vocal_ranges():
    """Test that different vocal ranges produce different audio"""
    base_obj = {
        'id': 'test-1',
        'mood': {'bright': 0.5, 'happy': 0.5, 'calm': 0.5},
        'volume': 0.7,
    }
    
    bass_audio = synth_track({**base_obj, 'vocalRange': 'bass'}, 1.0, SAMPLE_RATE)
    soprano_audio = synth_track({**base_obj, 'vocalRange': 'soprano'}, 1.0, SAMPLE_RATE)
    
    # Audio should be different for different ranges
    assert not np.array_equal(bass_audio, soprano_audio)


def test_synth_track_respects_volume():
    """Test that volume parameter affects output amplitude"""
    obj_quiet = {
        'id': 'test-1',
        'vocalRange': 'alto',
        'mood': {'bright': 0.5, 'happy': 0.5, 'calm': 0.5},
        'volume': 0.1,
    }
    
    obj_loud = {
        'id': 'test-1',
        'vocalRange': 'alto',
        'mood': {'bright': 0.5, 'happy': 0.5, 'calm': 0.5},
        'volume': 0.9,
    }
    
    audio_quiet = synth_track(obj_quiet, 1.0, SAMPLE_RATE)
    audio_loud = synth_track(obj_loud, 1.0, SAMPLE_RATE)
    
    # Louder audio should have higher RMS
    rms_quiet = np.sqrt(np.mean(audio_quiet ** 2))
    rms_loud = np.sqrt(np.mean(audio_loud ** 2))
    
    assert rms_loud > rms_quiet


def test_mix_tracks_combines_audio():
    """Test that mix_tracks combines multiple tracks"""
    track1 = np.array([0.5, 0.5, 0.5])
    track2 = np.array([0.3, 0.3, 0.3])
    
    mixed = mix_tracks([track1, track2])
    
    # Check output is normalized
    assert len(mixed) == 3
    assert np.max(np.abs(mixed)) <= 1.0


def test_mix_tracks_normalizes():
    """Test that mix_tracks prevents clipping"""
    # Create tracks that would clip if not normalized
    track1 = np.array([0.9, 0.9, 0.9])
    track2 = np.array([0.9, 0.9, 0.9])
    
    mixed = mix_tracks([track1, track2])
    
    # Output should be normalized to prevent clipping
    assert np.max(np.abs(mixed)) <= 1.0


def test_mix_tracks_handles_different_lengths():
    """Test that mix_tracks handles tracks of different lengths"""
    track1 = np.array([0.5] * 100)
    track2 = np.array([0.3] * 50)
    
    mixed = mix_tracks([track1, track2])
    
    # Output should be length of longest track
    assert len(mixed) == 100


def test_mix_tracks_raises_on_empty():
    """Test that mix_tracks raises error on empty list"""
    with pytest.raises(ValueError):
        mix_tracks([])


def test_wav_data_url_returns_string():
    """Test that wav_data_url returns a data URL string"""
    audio = np.array([0.0, 0.1, 0.2, 0.3])
    
    url = wav_data_url(audio, SAMPLE_RATE)
    
    assert isinstance(url, str)
    assert url.startswith('data:audio/wav;base64,')


def test_wav_data_url_valid_base64():
    """Test that wav_data_url returns valid base64"""
    audio = np.random.randn(1000) * 0.5
    
    url = wav_data_url(audio, SAMPLE_RATE)
    
    # Extract base64 part
    base64_part = url.split(',')[1]
    
    # Should be valid base64 (no exception)
    import base64
    decoded = base64.b64decode(base64_part)
    
    # Should be non-empty
    assert len(decoded) > 0
    
    # Should start with WAV header
    assert decoded[:4] == b'RIFF'


def test_integration_full_pipeline():
    """Test full synthesis pipeline"""
    obj1 = {
        'id': 'lamp-1',
        'vocalRange': 'tenor',
        'mood': {'bright': 0.5, 'happy': 0.7, 'calm': 0.6},
        'volume': 0.7,
    }
    
    obj2 = {
        'id': 'kettle-1',
        'vocalRange': 'soprano',
        'mood': {'bright': 0.8, 'happy': 0.9, 'calm': 0.5},
        'volume': 0.8,
    }
    
    # Synthesize tracks
    duration = 1.0
    track1 = synth_track(obj1, duration, SAMPLE_RATE)
    track2 = synth_track(obj2, duration, SAMPLE_RATE)
    
    # Mix tracks
    mixed = mix_tracks([track1, track2])
    
    # Create data URL
    url = wav_data_url(mixed, SAMPLE_RATE)
    
    # Verify final output
    assert isinstance(url, str)
    assert url.startswith('data:audio/wav;base64,')
    assert len(url) > 100  # Should have substantial content
