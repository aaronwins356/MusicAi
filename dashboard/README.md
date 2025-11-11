# 🎵 Singing Object Studio - Dashboard

An interactive Next.js dashboard for designing, customizing, and performing with AI-generated singing personalities for inanimate objects.

![Singing Object Studio Screenshot](https://github.com/user-attachments/assets/c82e750b-67ff-4521-862f-1bac16733b62)

## Overview

Singing Object Studio is a modern React-based web application that lets users create unique musical personalities for everyday objects. Each object has its own voice characteristics, emotional mood spectrum, and genre preferences, allowing for creative composition and harmonious arrangements.

## Features

### 🎨 Preset Library
- **Pre-loaded Objects**: Including Melancholic Lamp, Jazz Kettle, Rock Toaster, and more
- **Visual Cards**: Each object displayed with animated icons, personality summaries, genre tags, and vocal ranges
- **Quick Actions**: Preview and Edit buttons for instant interaction
- **Mood Indicators**: Visual representation of each object's emotional spectrum
- **Persistent Storage**: User-created objects saved to localStorage

### 🎛️ Object Composer Panel
- **Edit Object Attributes**: Modify name, personality, genre, and vocal range
- **Interactive Mood Sliders**: Adjust emotional spectrum across three dimensions:
  - Happy ↔ Sad
  - Calm ↔ Excited
  - Bright ↔ Dark
- **Lyrics Generation**: AI-powered lyrics generation via API
- **Live Preview**: Instant preview of changes
- **Auto-save**: Changes automatically persisted

### 🪄 Create an Object Feature
- **Full-Screen Modal**: Intuitive interface for creating new objects
- **Object Type Selection**: Choose from 14+ object types with emoji icons
- **Personality Customization**: Define core personality traits and musical preferences
- **Emotion Mapping**: Multi-slider interface for precise mood control
- **Generate & Preview**: Create lyrics and preview songs before saving

### ��️ Song Mixer
- **Multi-Track Interface**: Visual mixer showing all objects as individual tracks
- **Volume Control**: Adjustable volume sliders for each object
- **Toggle Tracks**: Enable/disable objects in the mix
- **Animated Waveforms**: Real-time visual feedback with pulsing animations
- **Harmony Mode**: Toggle between solo and harmony composition modes with distinct waveforms

### 🎧 Preview & Export
- **Song Generation**: Combine all active objects into a complete composition
- **Audio Preview Player**: HTML5 audio player with mixedAudioUrl support
- **Waveform Visualization**: Per-track SVG waveform display
- **Export Options**:
  - Download JSON (object definitions + lyrics)
  - Download MP3 (placeholder for backend integration)
- **Real-time Stats**: Track active objects, genres, and composition mode

## Tech Stack

- **Framework**: Next.js 14.2.18 (App Router)
- **Runtime**: React 18.2.0
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4 with PostCSS
- **State Management**: Zustand 5
- **Testing**: Vitest 2
- **API**: Next.js API Routes with optional Python backend

## Installation

```bash
# Navigate to the dashboard directory
cd dashboard

# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run tests
npm test

# Run tests in watch mode
npm run test:watch
```

The application will be available at `http://localhost:3000`

## Environment Variables

Create a `.env.local` file in the dashboard directory:

```env
# Optional: Python backend URL for real song generation
PY_BACKEND_URL=http://localhost:8000

# Or use NEXT_PUBLIC_ prefix for client-side access
NEXT_PUBLIC_PY_BACKEND_URL=http://localhost:8000
```

When `PY_BACKEND_URL` is set, the `/api/generateSong` endpoint will delegate to the Python FastAPI service. Otherwise, it uses the built-in mock generator.

## Project Structure

```
dashboard/
├── app/
│   ├── api/                     # API Routes
│   │   ├── generateLyrics/
│   │   ├── generateMelody/
│   │   ├── generateVoice/
│   │   ├── generateSong/
│   │   ├── objects/            # CRUD endpoints
│   │   │   ├── route.ts        # GET/POST
│   │   │   └── [id]/
│   │   │       └── route.ts    # PATCH/DELETE
│   │   └── health/
│   ├── components/              # React components
│   │   ├── PresetLibrary.tsx
│   │   ├── ComposerPanel.tsx
│   │   ├── CreateObjectModal.tsx
│   │   ├── SongMixer.tsx
│   │   └── PreviewPlayer.tsx
│   ├── lib/                     # Utilities and data
│   │   ├── types.ts            # TypeScript types
│   │   ├── presets.ts          # Genre & vocal range options
│   │   ├── store.ts            # Zustand state management
│   │   ├── persistence.ts      # localStorage utilities
│   │   ├── waveform.ts         # Waveform generation
│   │   └── config.ts           # App configuration
│   ├── globals.css             # Global styles
│   ├── layout.tsx              # Root layout
│   └── page.tsx                # Main page
├── tests/                       # Test files
│   ├── api/
│   │   ├── health.test.ts
│   │   └── generateSong.test.ts
│   └── store.test.ts
├── public/                      # Static assets
├── .data/                       # Server-side storage (gitignored)
├── package.json
├── vitest.config.ts
├── tsconfig.json
└── README.md
```

## Data Model

All models use camelCase for consistency:

### SingingObject

```typescript
interface SingingObject {
  id: string;
  type: string;          // e.g., "Lamp", "Kettle"
  name: string;          // Display name
  personality: string;   // 1-2 sentences
  genre: string;         // Musical genre
  vocalRange: 'bass' | 'tenor' | 'alto' | 'soprano';
  mood: {
    happy: number;       // 0-1
    calm: number;        // 0-1
    bright: number;      // 0-1
  };
  lyrics?: string;
  icon: string;          // Emoji
  color: string;         // Hex color
  volume: number;        // 0-1
  enabled: boolean;
  createdAt: string;     // ISO timestamp
  updatedAt: string;     // ISO timestamp
}
```

### SongResult

```typescript
interface SongResult {
  id: string;
  title: string;
  bpm: number;
  key: string;
  harmonyMode: boolean;
  mixedAudioUrl: string;
  tracks: SongTrack[];
}

interface SongTrack {
  objectId: string;
  displayName: string;
  genre: string;
  vocalRange: VocalRange;
  enabled: boolean;
  volume: number;
  waveform: TrackWaveformPoint[];
}

interface TrackWaveformPoint {
  t: number;  // Time position 0-1
  v: number;  // Value -1 to 1
}
```

## API Endpoints

All endpoints return `{ ok: boolean, data?: T, error?: string }`

### POST /api/generateLyrics

Generate lyrics based on personality and mood.

**Request:**
```json
{
  "object": SingingObject | {
    "personality": "string",
    "genre": "string",
    "mood": { "happy": 0.5, "calm": 0.5, "bright": 0.5 }
  }
}
```

**Response:**
```json
{
  "ok": true,
  "data": {
    "lyrics": "Generated lyrics...",
    "metadata": {
      "genre": "jazz",
      "mood": {...},
      "generatedAt": "2025-01-01T00:00:00Z"
    }
  }
}
```

### POST /api/generateMelody

Generate melody metadata.

**Request:**
```json
{
  "title": "Optional",
  "bpm": 120,
  "key": "C",
  "objects": [SingingObject]
}
```

**Response:**
```json
{
  "ok": true,
  "data": {
    "bpm": 120,
    "key": "C",
    "scale": "major",
    "timeSignature": "4/4",
    "structure": ["intro", "verse", "chorus", ...],
    "dominantGenre": "jazz"
  }
}
```

### POST /api/generateVoice

Generate voice characteristics.

**Request:**
```json
{
  "object": SingingObject,
  "lyrics": "string"
}
```

**Response:**
```json
{
  "ok": true,
  "data": {
    "voiceStyle": "bright and clear",
    "notes": "Description...",
    "estimatedDuration": 30
  }
}
```

### POST /api/generateSong

Generate a complete song composition. Delegates to Python backend if `PY_BACKEND_URL` is configured.

**Request:**
```json
{
  "title": "Optional",
  "harmonyMode": false,
  "objects": [SingingObject]
}
```

**Response:**
```json
{
  "ok": true,
  "data": {
    "id": "song-1234567890",
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
        "waveform": [{"t": 0, "v": 0.1}, ...]
      }
    ]
  }
}
```

### GET /api/objects

List all objects (presets + user-created).

**Response:**
```json
{
  "ok": true,
  "data": {
    "objects": [SingingObject]
  }
}
```

### POST /api/objects

Create a new user object.

**Request:**
```json
{
  "name": "string",
  "type": "string",
  "personality": "string",
  "genre": "string",
  "vocalRange": "alto",
  "mood": { "happy": 0.5, "calm": 0.5, "bright": 0.5 },
  "lyrics": "optional",
  "icon": "🎵",
  "color": "#000000",
  "volume": 0.75,
  "enabled": true
}
```

**Response:**
```json
{
  "ok": true,
  "data": {
    "object": SingingObject
  }
}
```

### PATCH /api/objects/[id]

Update a user object (preset objects cannot be modified).

**Request:**
```json
{
  "name": "New Name",
  "volume": 0.8
}
```

**Response:**
```json
{
  "ok": true,
  "data": {
    "object": SingingObject
  }
}
```

### DELETE /api/objects/[id]

Delete a user object (preset objects cannot be deleted).

**Response:**
```json
{
  "ok": true,
  "data": {
    "deleted": true
  }
}
```

### GET /api/health

Health check endpoint.

**Response:**
```json
{
  "ok": true,
  "data": {
    "status": "ok",
    "counts": {
      "presets": 3,
      "userObjects": 5
    },
    "timestamp": "2025-01-01T00:00:00Z"
  }
}
```

## Persistence

### Client-Side (Browser)

User-created objects are automatically saved to `localStorage` under the key `singing-objects-user-data`. The store hydrates on app mount, merging presets with user objects.

### Server-Side (API Routes)

For server-side operations (e.g., API routes), user objects are stored in `.data/objects.json` (gitignored). This file is created automatically on first write.

## Testing

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# With coverage
npm test -- --coverage
```

### Test Structure

- **API Tests**: Integration tests for API endpoints (require dev server running)
- **Store Tests**: Unit tests for Zustand store actions
- **Component Tests**: (Add as needed)

## Harmony Mode

When harmony mode is enabled:
- Each track gets a distinct waveform using different random seeds
- Waveforms are deterministic (same seed = same waveform)
- Visual differentiation helps users see individual contributions

## Customization

### Adding New Presets

Edit `app/lib/store.ts` and add to `DEFAULT_OBJECTS`:

```typescript
{
  id: 'unique-id',
  name: 'Your Object',
  type: 'ObjectType',
  personality: 'Description...',
  genre: 'genre',
  vocalRange: 'alto',
  mood: { happy: 0.5, calm: 0.5, bright: 0.5 },
  lyrics: 'Optional lyrics...',
  icon: '🎵',
  color: '#HEXCODE',
  volume: 0.7,
  enabled: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}
```

### Styling

The application uses Tailwind CSS v4 with custom animations in `globals.css`. All gradient colors, animations, and fonts can be customized.

## Deployment

### Vercel (Recommended)

```bash
npm run build
# Deploy to Vercel
```

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### Environment Variables

Set `PY_BACKEND_URL` in your deployment environment if using the Python backend.

## Future Enhancements

- Real AI integration for lyrics and voice generation
- Actual audio synthesis and playback
- User accounts and cloud storage
- Collaboration features
- Advanced mixing tools (EQ, effects)
- MIDI export
- Stem downloads

## Contributing

This project is part of the MusicAi repository. Contributions are welcome!

## Related

- [Python Service](../pyservice/) - FastAPI backend for song composition
- [Main Repository](../)

---

🎼 **Singing Object Studio** - Making everyday objects sing with AI-powered personalities
