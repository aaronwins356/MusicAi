/**
 * Voice Synthesis Module
 * 
 * Core Web Audio voice synthesis using formant filtering for vocal sounds.
 * Implements a source-filter model:
 * - Source: Glottal oscillator (sawtooth/pulse) + breath noise
 * - Filter: Formant filters (3 bandpass filters per vowel)
 * - Modulation: Vibrato, ADSR envelope
 * 
 * Formant frequencies (approximate values for singing):
 * - A: F1=700Hz, F2=1220Hz, F3=2600Hz
 * - E: F1=400Hz, F2=2000Hz, F3=2800Hz
 * - I: F1=290Hz, F2=2200Hz, F3=3000Hz
 * - O: F1=400Hz, F2=800Hz, F3=2600Hz
 * - U: F1=300Hz, F2=870Hz, F3=2250Hz
 */

import { VoicePreset, Phoneme, Note } from './types';

/**
 * Formant filter parameters for vowels
 * Each vowel has 3 formants (resonant frequencies)
 */
interface FormantConfig {
  f1: number; // First formant frequency
  f2: number; // Second formant frequency
  f3: number; // Third formant frequency
  q1: number; // Q factor for f1
  q2: number; // Q factor for f2
  q3: number; // Q factor for f3
}

const VOWEL_FORMANTS: Record<string, FormantConfig> = {
  'A': { f1: 700, f2: 1220, f3: 2600, q1: 10, q2: 10, q3: 10 },
  'E': { f1: 400, f2: 2000, f3: 2800, q1: 10, q2: 12, q3: 10 },
  'I': { f1: 290, f2: 2200, f3: 3000, q1: 8, q2: 12, q3: 10 },
  'O': { f1: 400, f2: 800, f3: 2600, q1: 10, q2: 10, q3: 10 },
  'U': { f1: 300, f2: 870, f3: 2250, q1: 10, q2: 10, q3: 10 },
};

/**
 * Voice preset configurations
 * Defines base frequency and character for each preset
 */
interface VoiceConfig {
  baseFrequency: number;
  breathAmount: number;
  vibratoRate: number;
  vibratoDepth: number;
}

const VOICE_PRESETS: Record<VoicePreset, VoiceConfig> = {
  'alto-soft': {
    baseFrequency: 262, // C4
    breathAmount: 0.05,
    vibratoRate: 5.0,
    vibratoDepth: 15, // cents
  },
  'tenor-bright': {
    baseFrequency: 196, // G3
    breathAmount: 0.02,
    vibratoRate: 5.5,
    vibratoDepth: 20,
  },
  'soprano-airy': {
    baseFrequency: 392, // G4
    breathAmount: 0.08,
    vibratoRate: 6.0,
    vibratoDepth: 25,
  },
  'baritone-warm': {
    baseFrequency: 147, // D3
    breathAmount: 0.03,
    vibratoRate: 4.5,
    vibratoDepth: 12,
  },
};

/**
 * ADSR envelope parameters
 */
interface EnvelopeParams {
  attack: number;   // seconds
  decay: number;    // seconds
  sustain: number;  // level 0-1
  release: number;  // seconds
}

const DEFAULT_ENVELOPE: EnvelopeParams = {
  attack: 0.015,  // 15ms
  decay: 0.06,    // 60ms
  sustain: 0.85,  // 85%
  release: 0.08,  // 80ms
};

/**
 * Create formant filters for a vowel sound
 */
function createFormantFilters(
  context: BaseAudioContext,
  vowel: string
): BiquadFilterNode[] {
  const formant = VOWEL_FORMANTS[vowel] || VOWEL_FORMANTS['A'];
  
  const filters: BiquadFilterNode[] = [];
  
  // Create 3 bandpass filters for the formants
  const f1 = context.createBiquadFilter();
  f1.type = 'bandpass';
  f1.frequency.value = formant.f1;
  f1.Q.value = formant.q1;
  filters.push(f1);
  
  const f2 = context.createBiquadFilter();
  f2.type = 'bandpass';
  f2.frequency.value = formant.f2;
  f2.Q.value = formant.q2;
  filters.push(f2);
  
  const f3 = context.createBiquadFilter();
  f3.type = 'bandpass';
  f3.frequency.value = formant.f3;
  f3.Q.value = formant.q3;
  filters.push(f3);
  
  return filters;
}

/**
 * Create breath noise source (filtered white noise)
 */
function createBreathNoise(
  context: BaseAudioContext,
  duration: number
): AudioBufferSourceNode {
  const bufferSize = context.sampleRate * duration;
  const buffer = context.createBuffer(1, bufferSize, context.sampleRate);
  const data = buffer.getChannelData(0);
  
  // Generate white noise
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  
  const source = context.createBufferSource();
  source.buffer = buffer;
  
  return source;
}

/**
 * Create consonant sound (short noise burst)
 */
function createConsonant(
  context: BaseAudioContext,
  startTime: number,
  duration: number,
  destination: AudioNode
): void {
  const noiseDuration = Math.min(duration, 0.05); // Max 50ms
  const noise = createBreathNoise(context, noiseDuration);
  
  // High-pass filter for consonants (removes low frequencies)
  const filter = context.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.value = 1500;
  filter.Q.value = 1.0;
  
  const gain = context.createGain();
  gain.gain.value = 0.3;
  
  // Quick envelope
  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(0.3, startTime + 0.005);
  gain.gain.linearRampToValueAtTime(0, startTime + noiseDuration);
  
  noise.connect(filter);
  filter.connect(gain);
  gain.connect(destination);
  
  noise.start(startTime);
  noise.stop(startTime + noiseDuration);
}

/**
 * Synthesize a single vowel sound with formant filtering
 */
function synthesizeVowel(
  context: BaseAudioContext,
  note: Note,
  phoneme: Phoneme,
  preset: VoicePreset,
  startTime: number,
  destination: AudioNode
): void {
  const config = VOICE_PRESETS[preset];
  const duration = note.duration;
  
  // Create glottal source (sawtooth for rich harmonics)
  const oscillator = context.createOscillator();
  oscillator.type = 'sawtooth';
  oscillator.frequency.value = note.frequency;
  
  // Create vibrato LFO
  const vibrato = context.createOscillator();
  vibrato.type = 'sine';
  vibrato.frequency.value = config.vibratoRate;
  
  const vibratoGain = context.createGain();
  const vibratoAmount = note.frequency * (config.vibratoDepth / 1200); // cents to ratio
  vibratoGain.gain.value = vibratoAmount;
  
  vibrato.connect(vibratoGain);
  vibratoGain.connect(oscillator.frequency);
  
  // Create formant filters
  const filters = createFormantFilters(context, phoneme.phoneme);
  
  // Create breath noise
  const breath = createBreathNoise(context, duration);
  const breathGain = context.createGain();
  breathGain.gain.value = config.breathAmount;
  
  // Mix oscillator and breath
  const mixer = context.createGain();
  mixer.gain.value = 0.3;
  
  // Connect source to formants
  oscillator.connect(mixer);
  breath.connect(breathGain);
  breathGain.connect(mixer);
  
  // Chain formant filters
  let currentNode: AudioNode = mixer;
  for (const filter of filters) {
    currentNode.connect(filter);
    currentNode = filter;
  }
  
  // ADSR envelope
  const envelope = context.createGain();
  const env = DEFAULT_ENVELOPE;
  
  envelope.gain.setValueAtTime(0, startTime);
  envelope.gain.linearRampToValueAtTime(1, startTime + env.attack);
  envelope.gain.linearRampToValueAtTime(env.sustain, startTime + env.attack + env.decay);
  envelope.gain.setValueAtTime(env.sustain, startTime + duration - env.release);
  envelope.gain.linearRampToValueAtTime(0, startTime + duration);
  
  currentNode.connect(envelope);
  envelope.connect(destination);
  
  // Start sources
  oscillator.start(startTime);
  oscillator.stop(startTime + duration);
  vibrato.start(startTime);
  vibrato.stop(startTime + duration);
  breath.start(startTime);
  breath.stop(startTime + duration);
}

/**
 * Synthesize a complete singing voice track
 */
export function synthesizeVoiceTrack(
  context: BaseAudioContext,
  phonemes: Phoneme[],
  melody: Note[],
  preset: VoicePreset,
  pan: number = 0
): AudioNode {
  // Create output gain node
  const output = context.createGain();
  output.gain.value = 0.5;
  
  // Create stereo panner
  const panner = context.createStereoPanner ? context.createStereoPanner() : null;
  if (panner) {
    panner.pan.value = pan;
  }
  
  let currentTime = 0;
  
  // Synthesize each phoneme
  for (let i = 0; i < phonemes.length; i++) {
    const phoneme = phonemes[i];
    const note = melody[i % melody.length]; // Cycle through melody if needed
    
    // Create note with current timing
    const timedNote: Note = {
      frequency: note.frequency,
      startTime: currentTime,
      duration: phoneme.duration / 1000, // Convert ms to seconds
    };
    
    if (phoneme.phoneme === 'C') {
      // Consonant: short noise burst
      createConsonant(context, currentTime, timedNote.duration, output);
    } else if (phoneme.phoneme && phoneme.phoneme !== '') {
      // Vowel: formant synthesis
      synthesizeVowel(context, timedNote, phoneme, preset, currentTime, output);
    }
    // Else: silence (for pauses)
    
    currentTime += timedNote.duration;
  }
  
  // Connect panner if available
  if (panner) {
    output.connect(panner);
    return panner;
  }
  
  return output;
}

/**
 * Apply humanization effects (micro-timing jitter)
 */
export function applyHumanization(
  phonemes: Phoneme[],
  jitterAmount: number = 0.01 // 10ms jitter
): Phoneme[] {
  return phonemes.map(p => ({
    ...p,
    duration: p.duration + (Math.random() - 0.5) * jitterAmount * 1000,
  }));
}
