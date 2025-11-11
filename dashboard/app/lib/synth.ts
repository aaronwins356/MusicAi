/**
 * Web Audio API Synthesis Engine
 * Generates real audio from track parameters using OfflineAudioContext
 */

import { SingingObject } from './types';

/**
 * Sample rate for audio generation
 */
const SAMPLE_RATE = 44100;

/**
 * Convert AudioBuffer to WAV format
 */
export function audioBufferToWav(buffer: AudioBuffer): ArrayBuffer {
  const numberOfChannels = buffer.numberOfChannels;
  const length = buffer.length * numberOfChannels * 2;
  const arrayBuffer = new ArrayBuffer(44 + length);
  const view = new DataView(arrayBuffer);
  
  // WAV header
  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };
  
  const sampleRate = buffer.sampleRate;
  const numChannels = buffer.numberOfChannels;
  const bitsPerSample = 16;
  const bytesPerSample = bitsPerSample / 8;
  const blockAlign = numChannels * bytesPerSample;
  
  // RIFF identifier
  writeString(0, 'RIFF');
  // file length minus RIFF identifier and file description length
  view.setUint32(4, 36 + length, true);
  // RIFF type
  writeString(8, 'WAVE');
  // format chunk identifier
  writeString(12, 'fmt ');
  // format chunk length
  view.setUint32(16, 16, true);
  // sample format (raw)
  view.setUint16(20, 1, true);
  // channel count
  view.setUint16(22, numChannels, true);
  // sample rate
  view.setUint32(24, sampleRate, true);
  // byte rate (sample rate * block align)
  view.setUint32(28, sampleRate * blockAlign, true);
  // block align (channel count * bytes per sample)
  view.setUint16(32, blockAlign, true);
  // bits per sample
  view.setUint16(34, bitsPerSample, true);
  // data chunk identifier
  writeString(36, 'data');
  // data chunk length
  view.setUint32(40, length, true);
  
  // Write interleaved PCM samples
  const channels = [];
  for (let i = 0; i < numberOfChannels; i++) {
    channels.push(buffer.getChannelData(i));
  }
  
  let offset = 44;
  for (let i = 0; i < buffer.length; i++) {
    for (let channel = 0; channel < numberOfChannels; channel++) {
      const sample = Math.max(-1, Math.min(1, channels[channel][i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
      offset += 2;
    }
  }
  
  return arrayBuffer;
}

/**
 * Generate a single track using oscillators
 */
function generateTrack(
  context: OfflineAudioContext,
  obj: SingingObject,
  duration: number
): AudioBufferSourceNode {
  const source = context.createBufferSource();
  const buffer = context.createBuffer(1, duration * context.sampleRate, context.sampleRate);
  const data = buffer.getChannelData(0);
  
  // Determine base frequency from vocal range
  const baseFreqs: Record<string, number> = {
    bass: 110,    // A2
    tenor: 196,   // G3
    alto: 262,    // C4
    soprano: 392  // G4
  };
  
  const baseFreq = baseFreqs[obj.vocalRange] || 262;
  
  // Create a melodic pattern based on object personality
  const seed = obj.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const random = (function(s) {
    return function() {
      s = (s * 9301 + 49297) % 233280;
      return s / 233280;
    };
  })(seed);
  
  // Generate notes in a musical scale
  const scaleIntervals = [0, 2, 4, 5, 7, 9, 11, 12]; // Major scale
  const noteDuration = 0.5; // seconds per note
  const notesCount = Math.floor(duration / noteDuration);
  
  for (let i = 0; i < data.length; i++) {
    const time = i / context.sampleRate;
    const noteIndex = Math.floor(time / noteDuration) % notesCount;
    const scaleIndex = Math.floor(random() * scaleIntervals.length);
    const semitones = scaleIntervals[scaleIndex];
    const freq = baseFreq * Math.pow(2, semitones / 12);
    
    // Mix of sine and triangle waves for richer sound
    const sine = Math.sin(2 * Math.PI * freq * time);
    const triangle = (2 / Math.PI) * Math.asin(Math.sin(2 * Math.PI * freq * time));
    
    // Envelope: fade in/out for each note
    const noteTime = (time % noteDuration) / noteDuration;
    let envelope = 1;
    if (noteTime < 0.1) {
      envelope = noteTime / 0.1; // Attack
    } else if (noteTime > 0.8) {
      envelope = (1 - noteTime) / 0.2; // Release
    }
    
    // Mix waveforms based on mood
    const mix = 0.6 * sine + 0.4 * triangle;
    
    // Apply mood-based amplitude modulation
    const brightness = obj.mood.bright;
    const happiness = obj.mood.happy;
    const calmness = obj.mood.calm;
    
    // Brightness affects tremolo
    const tremolo = 1 + brightness * 0.2 * Math.sin(2 * Math.PI * 5 * time);
    
    // Happiness affects overall energy
    const energy = 0.3 + happiness * 0.5;
    
    // Calmness affects sustain
    const sustain = calmness * 0.8 + 0.2;
    
    data[i] = mix * envelope * tremolo * energy * sustain * obj.volume;
  }
  
  source.buffer = buffer;
  return source;
}

/**
 * Synthesize audio from multiple objects
 */
export async function synthesizeSong(
  objects: SingingObject[],
  duration: number = 8
): Promise<Blob> {
  // Create offline context for rendering
  const context = new OfflineAudioContext(
    2, // stereo
    duration * SAMPLE_RATE,
    SAMPLE_RATE
  );
  
  const enabledObjects = objects.filter(obj => obj.enabled);
  
  // Create tracks and mix them
  const gainNodes: GainNode[] = [];
  
  enabledObjects.forEach((obj, index) => {
    const track = generateTrack(context, obj, duration);
    const gainNode = context.createGain();
    
    gainNode.gain.value = obj.volume;
    
    track.connect(gainNode);
    gainNode.connect(context.destination);
    
    track.start(0);
    gainNodes.push(gainNode);
  });
  
  // Render audio
  const renderedBuffer = await context.startRendering();
  
  // Convert to WAV
  const wavBuffer = audioBufferToWav(renderedBuffer);
  
  // Create blob
  return new Blob([wavBuffer], { type: 'audio/wav' });
}

/**
 * Create a Blob URL from audio blob
 */
export function createAudioUrl(blob: Blob): string {
  return URL.createObjectURL(blob);
}
