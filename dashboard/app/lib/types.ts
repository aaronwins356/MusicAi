export type VocalRange = 'bass' | 'tenor' | 'alto' | 'soprano';
export type VoiceMode = 'instrument' | 'singing';
export type VoicePreset = 'alto-soft' | 'tenor-bright' | 'soprano-airy' | 'baritone-warm';
export type ScaleType = 'major' | 'minor';

export interface Mood {
  happy: number;   // 0..1
  calm: number;    // 0..1
  bright: number;  // 0..1
}

// New types for singing voice mode
export interface SingingInput {
  lyrics: string;
  bpm: number;
  seconds: number;
  scale: ScaleType;
  preset: VoicePreset;
  pan: number;
}

export interface Phoneme {
  grapheme: string;
  phoneme: string;
  duration: number; // milliseconds
}

export interface Note {
  frequency: number;
  startTime: number; // seconds
  duration: number;  // seconds
  phoneme?: Phoneme;
}

export interface SingingObject {
  id: string;
  type: string;          // e.g., "Lamp"
  name: string;          // e.g., "Melancholic Lamp"
  personality: string;   // 1–2 sentences
  genre: string;         // e.g., "Lo-fi ambient"
  vocalRange: VocalRange;
  mood: Mood;
  lyrics?: string;
  icon: string;          // UI icon name or path
  color: string;         // hex or tailwind token
  volume: number;        // 0..1
  enabled: boolean;
  createdAt: string;     // ISO
  updatedAt: string;     // ISO
}

export interface TrackWaveformPoint { 
  t: number; 
  v: number; 
} // time, value -1..1

export interface SongTrack {
  objectId: string;
  displayName: string;
  genre: string;
  vocalRange: VocalRange;
  enabled: boolean;
  volume: number;
  waveform: TrackWaveformPoint[];  // for visualization
}

export interface SongResult {
  id: string;
  title: string;
  bpm: number;
  key: string;
  harmonyMode: boolean;
  mixedAudioUrl: string; // mock: static mp3 or data URL
  tracks: SongTrack[];
}
