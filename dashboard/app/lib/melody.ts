/**
 * Melody Generation Module
 * 
 * Generates deterministic melodic sequences based on musical scales
 * and a random seed. Uses quantized 8th-note rhythms and scale-based
 * pitch selection.
 * 
 * Musical Theory:
 * - Major scale: W-W-H-W-W-W-H (whole/half steps)
 * - Minor scale: W-H-W-W-H-W-W
 * - Semitones: 0=root, 1=minor 2nd, 2=major 2nd, etc.
 */

import { Note, ScaleType } from './types';

/**
 * Scale intervals in semitones from root note
 */
const SCALES = {
  major: [0, 2, 4, 5, 7, 9, 11, 12],      // C D E F G A B C
  minor: [0, 2, 3, 5, 7, 8, 10, 12],       // C D Eb F G Ab Bb C
};

/**
 * Pseudo-random number generator with seed for deterministic results
 */
class SeededRandom {
  private seed: number;
  
  constructor(seed: number) {
    this.seed = seed % 2147483647;
    if (this.seed <= 0) this.seed += 2147483646;
  }
  
  next(): number {
    this.seed = (this.seed * 16807) % 2147483647;
    return (this.seed - 1) / 2147483646;
  }
  
  /**
   * Get random integer in range [min, max)
   */
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min)) + min;
  }
}

/**
 * Convert MIDI note number to frequency in Hz
 */
function midiToFrequency(midiNote: number): number {
  return 440 * Math.pow(2, (midiNote - 69) / 12);
}

/**
 * Generate a melodic sequence based on scale and seed
 * 
 * @param bpm - Tempo in beats per minute
 * @param seconds - Total duration in seconds
 * @param scale - Musical scale (major or minor)
 * @param rootNote - MIDI note number for root (default 60 = middle C)
 * @param seed - Random seed for deterministic generation
 * @returns Array of Note objects with timing and frequency
 */
export function generateMelody(
  bpm: number,
  seconds: number,
  scale: ScaleType = 'major',
  rootNote: number = 60,
  seed: number = 42
): Note[] {
  const notes: Note[] = [];
  const rng = new SeededRandom(seed);
  
  // Calculate timing
  const beatDuration = 60 / bpm; // seconds per beat
  const eighthNoteDuration = beatDuration / 2; // 8th notes
  const totalNotes = Math.floor(seconds / eighthNoteDuration);
  
  // Get scale intervals
  const scaleIntervals = SCALES[scale];
  
  let currentTime = 0;
  
  for (let i = 0; i < totalNotes; i++) {
    // Choose a note from the scale
    const scaleIndex = rng.nextInt(0, scaleIntervals.length);
    const semitones = scaleIntervals[scaleIndex];
    
    // Add some octave variation (stay within ±1 octave)
    const octaveShift = rng.nextInt(-1, 2) * 12; // -12, 0, or +12 semitones
    const midiNote = rootNote + semitones + octaveShift;
    
    // Convert to frequency
    const frequency = midiToFrequency(midiNote);
    
    // Determine note duration (mostly 8th notes, occasional longer notes)
    const durationMultiplier = rng.next() < 0.7 ? 1 : 2; // 70% 8th notes, 30% quarter notes
    const duration = eighthNoteDuration * durationMultiplier;
    
    notes.push({
      frequency,
      startTime: currentTime,
      duration,
    });
    
    currentTime += duration;
    
    // Stop if we've exceeded the total duration
    if (currentTime >= seconds) {
      break;
    }
  }
  
  return notes;
}

/**
 * Generate melody synchronized with phonemes
 * Each phoneme gets a note from the melody
 */
export function syncMelodyToPhonemes(
  melody: Note[],
  phonemeCount: number
): Note[] {
  if (melody.length === 0 || phonemeCount === 0) return [];
  
  const syncedMelody: Note[] = [];
  
  // Distribute melody notes across phonemes
  // If we have more phonemes than notes, repeat notes
  // If we have more notes than phonemes, use a subset
  for (let i = 0; i < phonemeCount; i++) {
    const noteIndex = i % melody.length;
    const note = melody[noteIndex];
    
    syncedMelody.push({
      frequency: note.frequency,
      startTime: note.startTime,
      duration: note.duration,
    });
  }
  
  return syncedMelody;
}

/**
 * Create a simple ascending/descending pattern for testing
 */
export function generateTestMelody(
  rootNote: number = 60,
  scale: ScaleType = 'major',
  noteCount: number = 8
): Note[] {
  const notes: Note[] = [];
  const scaleIntervals = SCALES[scale];
  const duration = 0.5; // seconds per note
  
  for (let i = 0; i < noteCount; i++) {
    const scaleIndex = i % scaleIntervals.length;
    const semitones = scaleIntervals[scaleIndex];
    const midiNote = rootNote + semitones;
    const frequency = midiToFrequency(midiNote);
    
    notes.push({
      frequency,
      startTime: i * duration,
      duration,
    });
  }
  
  return notes;
}

/**
 * Get the key signature from root note
 */
export function getKeyName(rootNote: number): string {
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const octave = Math.floor(rootNote / 12) - 1;
  const noteName = noteNames[rootNote % 12];
  return `${noteName}${octave}`;
}
