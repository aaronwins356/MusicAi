import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_root_endpoint():
    """Test the root endpoint returns service info"""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["service"] == "Singing Object Studio API"
    assert data["status"] == "ok"
    assert "version" in data


def test_health_endpoint():
    """Test the health check endpoint"""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "timestamp" in data


def test_compose_song_success():
    """Test composing a song with valid objects"""
    request_data = {
        "title": "Test Song",
        "harmonyMode": False,
        "objects": [
            {
                "id": "test-1",
                "type": "Lamp",
                "name": "Test Lamp",
                "personality": "A test lamp",
                "genre": "jazz",
                "vocalRange": "tenor",
                "mood": {
                    "happy": 0.5,
                    "calm": 0.5,
                    "bright": 0.5
                },
                "icon": "💡",
                "color": "#FFD700",
                "volume": 0.7,
                "enabled": True,
                "createdAt": "2025-01-01T00:00:00Z",
                "updatedAt": "2025-01-01T00:00:00Z"
            }
        ]
    }
    
    response = client.post("/compose", json=request_data)
    assert response.status_code == 200
    
    data = response.json()
    assert data["title"] == "Test Song"
    assert data["harmonyMode"] is False
    assert "id" in data
    assert "bpm" in data
    assert "key" in data
    assert "mixedAudioUrl" in data
    assert len(data["tracks"]) == 1
    assert data["tracks"][0]["objectId"] == "test-1"
    assert len(data["tracks"][0]["waveform"]) > 0


def test_compose_song_harmony_mode():
    """Test composing a song with harmony mode enabled"""
    request_data = {
        "harmonyMode": True,
        "objects": [
            {
                "id": "test-1",
                "type": "Lamp",
                "name": "Test Lamp",
                "personality": "A test lamp",
                "genre": "jazz",
                "vocalRange": "tenor",
                "mood": {"happy": 0.5, "calm": 0.5, "bright": 0.5},
                "icon": "💡",
                "color": "#FFD700",
                "volume": 0.7,
                "enabled": True,
                "createdAt": "2025-01-01T00:00:00Z",
                "updatedAt": "2025-01-01T00:00:00Z"
            },
            {
                "id": "test-2",
                "type": "Kettle",
                "name": "Test Kettle",
                "personality": "A test kettle",
                "genre": "jazz",
                "vocalRange": "soprano",
                "mood": {"happy": 0.8, "calm": 0.5, "bright": 0.9},
                "icon": "🫖",
                "color": "#4A90E2",
                "volume": 0.8,
                "enabled": True,
                "createdAt": "2025-01-01T00:00:00Z",
                "updatedAt": "2025-01-01T00:00:00Z"
            }
        ]
    }
    
    response = client.post("/compose", json=request_data)
    assert response.status_code == 200
    
    data = response.json()
    assert data["harmonyMode"] is True
    assert len(data["tracks"]) == 2
    
    # Verify distinct waveforms in harmony mode
    waveform1 = data["tracks"][0]["waveform"]
    waveform2 = data["tracks"][1]["waveform"]
    assert waveform1 != waveform2  # Should be different due to different seeds


def test_compose_song_no_enabled_objects():
    """Test that composing fails when no objects are enabled"""
    request_data = {
        "harmonyMode": False,
        "objects": [
            {
                "id": "test-1",
                "type": "Lamp",
                "name": "Test Lamp",
                "personality": "A test lamp",
                "genre": "jazz",
                "vocalRange": "tenor",
                "mood": {"happy": 0.5, "calm": 0.5, "bright": 0.5},
                "icon": "💡",
                "color": "#FFD700",
                "volume": 0.7,
                "enabled": False,  # Disabled
                "createdAt": "2025-01-01T00:00:00Z",
                "updatedAt": "2025-01-01T00:00:00Z"
            }
        ]
    }
    
    response = client.post("/compose", json=request_data)
    assert response.status_code == 400
    assert "at least one object must be enabled" in response.json()["detail"].lower()


def test_compose_song_waveform_structure():
    """Test that waveforms have the correct structure"""
    request_data = {
        "harmonyMode": False,
        "objects": [
            {
                "id": "test-1",
                "type": "Lamp",
                "name": "Test Lamp",
                "personality": "A test lamp",
                "genre": "jazz",
                "vocalRange": "tenor",
                "mood": {"happy": 0.5, "calm": 0.5, "bright": 0.5},
                "icon": "💡",
                "color": "#FFD700",
                "volume": 0.7,
                "enabled": True,
                "createdAt": "2025-01-01T00:00:00Z",
                "updatedAt": "2025-01-01T00:00:00Z"
            }
        ]
    }
    
    response = client.post("/compose", json=request_data)
    assert response.status_code == 200
    
    data = response.json()
    waveform = data["tracks"][0]["waveform"]
    
    # Check waveform structure
    assert len(waveform) == 256  # Default length
    for point in waveform:
        assert "t" in point
        assert "v" in point
        assert 0 <= point["t"] <= 1
        assert -1 <= point["v"] <= 1
