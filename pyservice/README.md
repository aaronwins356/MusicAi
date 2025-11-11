# Singing Object Studio - Python API Service

FastAPI microservice for composing songs from singing objects. This service can optionally be used by the Next.js application for backend song generation.

## Features

- **FastAPI** backend with automatic API documentation
- **Pydantic** models for type-safe data validation
- **CORS** enabled for cross-origin requests
- **Deterministic waveform generation** with distinct patterns in harmony mode
- **Mock audio generation** with silent MP3 data URLs
- **Full test coverage** with pytest

## Installation

### Using pip

```bash
cd pyservice
pip install -r requirements.txt
```

### Using Poetry

```bash
cd pyservice
poetry install
```

## Running the Service

### Development Mode

```bash
# Using uvicorn directly
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Or using Python
python main.py
```

The service will be available at:
- API: http://localhost:8000
- Interactive docs: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

### Production Mode

```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

## Configuration

### Connecting to Next.js

Set the environment variable in your Next.js application:

```bash
# In dashboard/.env.local
PY_BACKEND_URL=http://localhost:8000
```

Or:

```bash
# In dashboard/.env.local
NEXT_PUBLIC_PY_BACKEND_URL=http://localhost:8000
```

When this is set, the Next.js `/api/generateSong` endpoint will delegate to this Python service instead of using the mock generator.

## API Endpoints

### GET /

Health check and service information.

**Response:**
```json
{
  "service": "Singing Object Studio API",
  "status": "ok",
  "version": "1.0.0"
}
```

### GET /health

Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "timestamp": 1704067200.0
}
```

### POST /compose

Compose a song from singing objects.

**Request Body:**
```json
{
  "title": "Optional Song Title",
  "harmonyMode": false,
  "objects": [
    {
      "id": "lamp-1",
      "type": "Lamp",
      "name": "Melancholic Lamp",
      "personality": "A tired lamp...",
      "genre": "jazz",
      "vocalRange": "tenor",
      "mood": {
        "happy": 0.2,
        "calm": 0.8,
        "bright": 0.3
      },
      "icon": "💡",
      "color": "#FFD700",
      "volume": 0.7,
      "enabled": true,
      "createdAt": "2025-01-01T00:00:00Z",
      "updatedAt": "2025-01-01T00:00:00Z"
    }
  ]
}
```

**Response:**
```json
{
  "id": "song-1704067200000",
  "title": "Melancholic Lamp",
  "bpm": 120,
  "key": "C",
  "harmonyMode": false,
  "mixedAudioUrl": "data:audio/mp3;base64,...",
  "tracks": [
    {
      "objectId": "lamp-1",
      "displayName": "Melancholic Lamp",
      "genre": "jazz",
      "vocalRange": "tenor",
      "enabled": true,
      "volume": 0.7,
      "waveform": [
        {"t": 0.0, "v": 0.123},
        {"t": 0.004, "v": -0.456},
        ...
      ]
    }
  ]
}
```

## Testing

Run the test suite:

```bash
# Using pytest
pytest

# With coverage
pytest --cov=. --cov-report=html

# Verbose output
pytest -v
```

## Project Structure

```
pyservice/
├── main.py              # FastAPI application
├── models.py            # Pydantic models
├── requirements.txt     # Python dependencies
├── pyproject.toml       # Poetry configuration
├── tests/
│   └── test_api.py     # API tests
└── README.md           # This file
```

## Data Models

### SingingObject

Represents a singing object with musical characteristics.

**Fields:**
- `id`: Unique identifier
- `type`: Object type (e.g., "Lamp", "Kettle")
- `name`: Display name
- `personality`: 1-2 sentence description
- `genre`: Musical genre
- `vocalRange`: One of "bass", "tenor", "alto", "soprano"
- `mood`: Mood spectrum with happy, calm, bright (0-1)
- `lyrics`: Optional lyrics text
- `icon`: Emoji or icon representation
- `color`: Hex color code
- `volume`: Volume level (0-1)
- `enabled`: Whether the object is active
- `createdAt`: ISO timestamp
- `updatedAt`: ISO timestamp

### SongResult

Complete song composition output.

**Fields:**
- `id`: Unique song identifier
- `title`: Song title
- `bpm`: Beats per minute (40-240)
- `key`: Musical key
- `harmonyMode`: Whether harmony mode was enabled
- `mixedAudioUrl`: URL to mixed audio file
- `tracks`: Array of track data

### SongTrack

Individual track in a song.

**Fields:**
- `objectId`: ID of the singing object
- `displayName`: Track display name
- `genre`: Musical genre
- `vocalRange`: Vocal range
- `enabled`: Whether track is active
- `volume`: Volume level (0-1)
- `waveform`: Array of waveform points

## Harmony Mode

When `harmonyMode` is enabled, the service generates distinct waveforms for each track using different random seeds. This creates visual differentiation between tracks in the UI.

## Development

### Adding New Features

1. Update models in `models.py` if needed
2. Add endpoint logic in `main.py`
3. Write tests in `tests/test_api.py`
4. Update this README

### Code Style

Follow PEP 8 guidelines:

```bash
# Format code
black .

# Lint
flake8 .

# Type checking
mypy .
```

## Deployment

### Docker

```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Environment Variables

- `PORT`: Port to run the service on (default: 8000)
- `CORS_ORIGINS`: Comma-separated list of allowed origins

## License

See the main repository for license information.

## Related

- [Next.js Dashboard](../dashboard/)
- [Main Repository](../)
