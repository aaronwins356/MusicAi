# Singing Object Studio - Musical Personalities System

A complete full-stack application for creating songs where inanimate objects sing with unique musical personalities. Includes a Python core library, FastAPI backend service, and a modern React/Next.js dashboard.

![Dashboard Preview](https://github.com/user-attachments/assets/c82e750b-67ff-4521-862f-1bac16733b62)

## Overview

This system allows you to create songs where ordinary things—like lamps, mugs, or toasters—sing together to express their emotions, purposes, and relationships. Each object has unique voice characteristics, emotional mood spectrums, and genre preferences.

## Projects

### 🎵 Singing Object Studio Dashboard

A production-ready React/Next.js web application for designing and composing with singing object personalities.

**Tech Stack:**
- Next.js 14.2.18 (App Router)
- React 18.2.0
- TypeScript 5
- Tailwind CSS 4
- Zustand for state management
- Vitest for testing

**[📖 View Dashboard Documentation](dashboard/README.md)**

**Quick Start:**
```bash
cd dashboard
npm install
npm run dev
# Visit http://localhost:3000
```

**Features:**
- ✅ Create and manage singing objects with personalities
- ✅ Real-time audio preview with waveform visualization
- ✅ Harmony mode with distinct per-track waveforms
- ✅ localStorage persistence for user objects
- ✅ Complete REST API with CRUD operations
- ✅ Full TypeScript types with camelCase consistency
- ✅ Comprehensive test coverage

### 🚀 FastAPI Backend Service

Optional Python microservice that provides production-ready song composition.

**Tech Stack:**
- FastAPI 0.115+
- Pydantic 2 for validation
- Pytest for testing
- Uvicorn for serving

**[📖 View Python Service Documentation](pyservice/README.md)**

**Quick Start:**
```bash
cd pyservice
pip install -r requirements.txt
python main.py
# Visit http://localhost:8000/docs
```

**Features:**
- ✅ `/compose` endpoint for song generation
- ✅ Deterministic waveform generation
- ✅ Full Pydantic type validation
- ✅ CORS enabled for cross-origin requests
- ✅ Comprehensive test suite
- ✅ Interactive API documentation

### 🐍 Python Core Library

The original Python implementation for generating object-based songs.

**Quick Start:**
```bash
# Display example song
python3 choir_of_objects.py --example

# Display system prompt
python3 choir_of_objects.py --system-prompt

# Run tests
python3 test_choir_of_objects.py
```

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                  Next.js Dashboard                   │
│  (React 18, TypeScript, Tailwind, Zustand)          │
│                                                       │
│  - Preset Library                                    │
│  - Object Composer                                   │
│  - Song Mixer                                        │
│  - Preview Player                                    │
│  - Create Object Modal                               │
└───────────────┬─────────────────────────────────────┘
                │
                │ HTTP/JSON
                │
┌───────────────┴─────────────────┬───────────────────┐
│  Next.js API Routes             │   Python Service  │
│  (TypeScript)                   │   (FastAPI)       │
│                                  │                   │
│  - /api/generateSong            │   - /compose      │
│  - /api/generateLyrics          │   - /health       │
│  - /api/generateMelody          │                   │
│  - /api/generateVoice           │                   │
│  - /api/objects (CRUD)          │                   │
│  - /api/health                  │                   │
└─────────────────────────────────┴───────────────────┘
                │
                │
        ┌───────┴────────┐
        │   Persistence   │
        │                 │
        │  - localStorage │
        │  - .data/*.json │
        └─────────────────┘
```

## Installation

### Full Stack (Recommended)

```bash
# Clone repository
git clone https://github.com/aaronwins356/MusicAi.git
cd MusicAi

# Install dashboard
cd dashboard
npm install

# Install Python service (optional)
cd ../pyservice
pip install -r requirements.txt
```

### Dashboard Only

```bash
cd dashboard
npm install
npm run dev
```

### Python Service Only

```bash
cd pyservice
pip install -r requirements.txt
python main.py
```

## Environment Variables

Create `dashboard/.env.local`:

```env
# Optional: Delegate song generation to Python backend
PY_BACKEND_URL=http://localhost:8000

# Or use client-side:
NEXT_PUBLIC_PY_BACKEND_URL=http://localhost:8000
```

When `PY_BACKEND_URL` is set, the Next.js API will use the Python service. Otherwise, it uses the built-in mock generator.

## Quick Links

- [Dashboard README](dashboard/README.md) - Complete frontend documentation
- [Python Service README](pyservice/README.md) - Backend API documentation
- [Usage Guide](USAGE.md) - Original Python library guide
- [Test Suite](test_choir_of_objects.py) - Python library tests

## Data Model

All models use **camelCase** for consistency:

```typescript
interface SingingObject {
  id: string;
  type: string;          // e.g., "Lamp", "Kettle"
  name: string;
  personality: string;   // 1-2 sentences
  genre: string;
  vocalRange: 'bass' | 'tenor' | 'alto' | 'soprano';
  mood: {
    happy: number;       // 0-1
    calm: number;        // 0-1
    bright: number;      // 0-1
  };
  lyrics?: string;
  icon: string;
  color: string;
  volume: number;        // 0-1
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}
```

## API Endpoints

### Next.js API Routes

All endpoints return `{ ok: boolean, data?: T, error?: string }`

- `POST /api/generateLyrics` - Generate lyrics from personality/mood
- `POST /api/generateMelody` - Generate melody metadata
- `POST /api/generateVoice` - Generate voice characteristics
- `POST /api/generateSong` - Generate complete song with waveforms
- `GET /api/objects` - List all objects
- `POST /api/objects` - Create new object
- `PATCH /api/objects/[id]` - Update object
- `DELETE /api/objects/[id]` - Delete object
- `GET /api/health` - Health check

### Python Service Endpoints

- `GET /` - Service info
- `GET /health` - Health check
- `POST /compose` - Compose song (returns `SongResult`)

## Testing

### Dashboard Tests

```bash
cd dashboard

# Run all tests
npm test

# Watch mode
npm run test:watch

# With coverage
npm test -- --coverage
```

### Python Service Tests

```bash
cd pyservice

# Run tests
pytest

# With coverage
pytest --cov=. --cov-report=html

# Verbose
pytest -v
```

## Development

### Dashboard

```bash
cd dashboard
npm run dev
# Visit http://localhost:3000
```

### Python Service

```bash
cd pyservice
uvicorn main:app --reload
# Visit http://localhost:8000/docs
```

### Full Stack Development

Terminal 1:
```bash
cd pyservice
python main.py
```

Terminal 2:
```bash
cd dashboard
export PY_BACKEND_URL=http://localhost:8000
npm run dev
```

## Features

### ✅ Completed

- **Backend API**: Complete REST API with camelCase models
- **CRUD Operations**: Full object lifecycle management
- **Song Generation**: With harmony mode and distinct waveforms
- **Persistence**: localStorage + file-based storage
- **Python Service**: Optional FastAPI backend
- **Waveform Visualization**: SVG-based per-track display
- **Audio Playback**: HTML5 audio with mixedAudioUrl
- **Type Safety**: Full TypeScript coverage
- **Tests**: Comprehensive test suite (Vitest + pytest)
- **Documentation**: Complete API reference

### 🚧 Future Enhancements

- Real AI integration (LLM for lyrics, voice synthesis)
- Actual audio generation and synthesis
- User accounts and cloud storage
- Real-time collaboration
- Advanced mixing (EQ, effects, compression)
- MIDI export and stem downloads
- Mobile app version

## Deployment

### Vercel (Dashboard)

```bash
cd dashboard
npm run build
# Deploy to Vercel
```

### Docker (Full Stack)

```dockerfile
# Dashboard
FROM node:18-alpine
WORKDIR /app
COPY dashboard/package*.json ./
RUN npm ci --only=production
COPY dashboard/ .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]

# Python Service
FROM python:3.11-slim
WORKDIR /app
COPY pyservice/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY pyservice/ .
EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0"]
```

## LLM Integration

This system is designed to work with Large Language Models. Use the system prompt from the original library:

```bash
python3 choir_of_objects.py --system-prompt
```

The LLM generates:
1. Object personalities and characteristics
2. Lyrics and emotional arcs
3. Musical style and arrangement notes
4. Voice characterization

The frontend then:
1. Visualizes and manages these objects
2. Composes songs from multiple objects
3. Generates waveforms for visualization
4. Exports results as JSON or audio

## AI Music Chain

Complete pipeline:

1. **LLM** → Generate personalities and lyrics
2. **Dashboard** → Design and compose objects
3. **API** → Generate song metadata and waveforms
4. **Music Model** (future) → Generate actual audio
5. **Voice Model** (future) → Synthesize singing per object
6. **Mixer** (future) → Combine into full arrangement

## Contributing

Contributions are welcome! Please ensure:

- TypeScript code passes `npm run build`
- Tests pass with `npm test`
- Python code passes `pytest`
- Follow existing camelCase conventions
- Update documentation for new features

## License

See repository for license information.

## Credits

Created as part of the MusicAi project exploring AI-generated musical personalities for everyday objects.

---

🎼 **Singing Object Studio** - Making everyday objects sing with AI-powered personalities
