# 🎵 Singing Object Studio

An interactive dashboard for designing, customizing, and performing with AI-generated singing personalities for inanimate objects.

![Singing Object Studio Screenshot](https://github.com/user-attachments/assets/c82e750b-67ff-4521-862f-1bac16733b62)

## Overview

Singing Object Studio is a modern React-based web application that lets users create unique musical personalities for everyday objects. Each object has its own voice characteristics, emotional mood spectrum, and genre preferences, allowing for creative composition and harmonious arrangements.

## Features

### 🎨 Preset Library
- **8 Pre-loaded Objects**: Including Melancholic Lamp, Jazz Kettle, Goth Blender, Wise Refrigerator, Dreamy Clock, Energetic Toaster, Blues Vacuum, and Reflective Mirror
- **Visual Cards**: Each object displayed with animated icons, personality summaries, genre tags, and vocal ranges
- **Quick Actions**: Preview and Edit buttons for instant interaction
- **Mood Indicators**: Visual representation of each object's emotional spectrum

### 🎛️ Object Composer Panel
- **Edit Object Attributes**: Modify name, personality, genre, and vocal range
- **Interactive Mood Sliders**: Adjust emotional spectrum across three dimensions:
  - Happy ↔ Sad
  - Calm ↔ Excited
  - Bright ↔ Dark
- **Lyrics Generation**: AI-powered lyrics generation via mock API
- **Live Preview**: Instant preview of changes

### 🪄 Create an Object Feature
- **Full-Screen Modal**: Intuitive interface for creating new objects
- **Object Type Selection**: Choose from 14+ object types with emoji icons
- **Personality Customization**: Define core personality traits and musical preferences
- **Emotion Mapping**: Multi-slider interface for precise mood control
- **Generate & Preview**: Create lyrics and preview songs before saving

### 🎚️ Song Mixer
- **Multi-Track Interface**: Visual mixer showing all objects as individual tracks
- **Volume Control**: Adjustable volume sliders for each object
- **Toggle Tracks**: Enable/disable objects in the mix
- **Animated Waveforms**: Real-time visual feedback with pulsing animations
- **Harmony Mode**: Toggle between solo and harmony composition modes

### 🎧 Preview & Export
- **Song Generation**: Combine all active objects into a complete composition
- **Audio Preview Player**: Mock player with waveform visualization
- **Export Options**:
  - Download JSON (object definitions + lyrics)
  - Download MP3 (placeholder for backend integration)
- **Real-time Stats**: Track active objects, genres, and composition mode

## Tech Stack

- **Framework**: Next.js 16 (React 19)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **State Management**: Zustand
- **API**: Next.js API Routes (mock endpoints)

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
```

The application will be available at `http://localhost:3000`

## Project Structure

```
dashboard/
├── app/
│   ├── api/                    # Mock API endpoints
│   │   ├── generateLyrics/
│   │   ├── generateMelody/
│   │   ├── generateVoice/
│   │   └── generateSong/
│   ├── components/             # React components
│   │   ├── PresetLibrary.tsx
│   │   ├── ComposerPanel.tsx
│   │   ├── CreateObjectModal.tsx
│   │   ├── SongMixer.tsx
│   │   └── PreviewPlayer.tsx
│   ├── lib/                    # Utilities and data
│   │   ├── types.ts           # TypeScript types
│   │   ├── presets.ts         # Preset objects data
│   │   └── store.ts           # Zustand state management
│   ├── globals.css            # Global styles
│   ├── layout.tsx             # Root layout
│   └── page.tsx               # Main page
├── public/                     # Static assets
├── package.json
└── README.md
```

## Mock API Endpoints

### POST /api/generateLyrics
Generates contextual lyrics based on personality, genre, and mood.

**Request:**
```json
{
  "personality": "string",
  "genre": "string",
  "mood": {
    "happy": 0.7,
    "calm": 0.5,
    "bright": 0.8
  }
}
```

**Response:**
```json
{
  "success": true,
  "lyrics": "Generated lyrics...",
  "metadata": {
    "genre": "string",
    "mood": {},
    "generatedAt": "ISO timestamp"
  }
}
```

### POST /api/generateMelody
Creates melody metadata including key, scale, tempo, and waveform data.

### POST /api/generateVoice
Generates voice characteristics and sample URLs based on vocal range and personality.

### POST /api/generateSong
Combines multiple objects into a full song with tracks, harmonies, and mixed audio.

## Object Schema

```typescript
interface SingingObject {
  id: string;
  object_name: string;
  type: string;
  personality: string;
  genre: string;
  vocal_range: 'bass' | 'tenor' | 'alto' | 'soprano';
  mood: {
    happy: number;    // 0-1
    calm: number;     // 0-1
    bright: number;   // 0-1
  };
  lyrics?: string;
  icon?: string;
  color?: string;
  volume?: number;
  enabled?: boolean;
}
```

## Design Philosophy

The interface is designed to be:
- **Playful & Musical**: Bright colors, smooth animations, and musical metaphors
- **Intuitive**: Clear visual hierarchy and familiar UI patterns
- **Interactive**: Immediate feedback and live previews
- **Surreal**: A "living sound lab" aesthetic with animated object personalities

## Customization

### Adding New Presets

Edit `app/lib/presets.ts` to add new preset objects:

```typescript
{
  id: 'unique-id',
  object_name: 'Your Object',
  type: 'ObjectType',
  personality: 'Description...',
  genre: 'genre',
  vocal_range: 'alto',
  mood: { happy: 0.5, calm: 0.5, bright: 0.5 },
  lyrics: 'Optional lyrics...',
  icon: '🎵',
  color: '#HEXCODE',
  volume: 0.7,
  enabled: true
}
```

### Styling

The application uses Tailwind CSS with custom animations defined in `globals.css`. Modify the gradient colors, animations, or fonts to match your brand.

## Future Enhancements

- **Real AI Integration**: Connect to actual LLM APIs for lyrics and voice generation
- **Audio Synthesis**: Implement real audio generation and playback
- **User Accounts**: Save and share custom objects
- **Collaboration**: Real-time multi-user composition
- **Advanced Mixing**: EQ, effects, and professional mixing tools
- **Export Formats**: MIDI, stems, and project files

## Contributing

This project is part of the MusicAi repository. Contributions are welcome!

## License

See the main repository for license information.

## Related

- [Main Repository](../)
- [Python Choir of Objects](../choir_of_objects.py)
- [Usage Guide](../USAGE.md)

---

🎼 **Singing Object Studio** - Making everyday objects sing with AI-powered personalities
