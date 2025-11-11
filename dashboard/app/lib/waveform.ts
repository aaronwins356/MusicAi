import { TrackWaveformPoint } from './types';

/**
 * Pseudo-random number generator with seed for deterministic results
 */
function pseudoRandom(seed: number) {
  return () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
}

/**
 * Generate a waveform array for visualization
 * @param length Number of points in the waveform
 * @param seed Seed for deterministic random generation
 * @returns Array of waveform points with time (t) and value (v)
 */
export function makeWaveform(length = 256, seed = 42): TrackWaveformPoint[] {
  const rnd = pseudoRandom(seed);
  const out: TrackWaveformPoint[] = [];
  
  for (let i = 0; i < length; i++) {
    const t = i / (length - 1);
    // smooth-ish noise
    const v = (rnd() - 0.5) * 2 * (0.6 + 0.4 * Math.sin(i / 12));
    out.push({ t, v: Math.max(-1, Math.min(1, v)) });
  }
  
  return out;
}

/**
 * Generate waveforms for multiple tracks with different seeds for harmony mode
 * @param trackCount Number of tracks
 * @param harmonyMode Whether to use different seeds for each track
 * @param baseLength Number of points per waveform
 * @returns Array of waveforms
 */
export function makeTrackWaveforms(
  trackCount: number,
  harmonyMode: boolean,
  baseLength = 256
): TrackWaveformPoint[][] {
  const waveforms: TrackWaveformPoint[][] = [];
  
  for (let i = 0; i < trackCount; i++) {
    // In harmony mode, use different seeds to create distinct waveforms
    const seed = harmonyMode ? 42 + (i * 137) : 42;
    waveforms.push(makeWaveform(baseLength, seed));
  }
  
  return waveforms;
}
