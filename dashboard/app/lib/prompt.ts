/**
 * Prompt Parsing Module
 * 
 * Parses natural language prompts to extract musical parameters
 * for singing voice synthesis.
 * 
 * Example: "soft soprano singing a dreamy melody about the moon"
 * Extracts: tempo, mood, voice preset, key/scale
 */

import { SingingInput, VoicePreset, ScaleType } from './types';

/**
 * Extract BPM from prompt or use defaults based on mood keywords
 */
function extractBPM(prompt: string): number {
  // Check for explicit BPM
  const bpmMatch = prompt.match(/(\d+)\s*bpm/i);
  if (bpmMatch) {
    return Math.max(40, Math.min(200, parseInt(bpmMatch[1])));
  }
  
  const lower = prompt.toLowerCase();
  
  // Mood-based BPM
  if (lower.includes('slow') || lower.includes('calm') || lower.includes('peaceful')) {
    return 60;
  }
  if (lower.includes('fast') || lower.includes('energetic') || lower.includes('upbeat')) {
    return 140;
  }
  if (lower.includes('moderate') || lower.includes('medium')) {
    return 100;
  }
  
  // Default tempo
  return 120;
}

/**
 * Extract scale/key from prompt
 */
function extractScale(prompt: string): ScaleType {
  const lower = prompt.toLowerCase();
  
  // Explicit scale mentions
  if (lower.includes('minor') || lower.includes('sad') || lower.includes('melancholic')) {
    return 'minor';
  }
  
  if (lower.includes('major') || lower.includes('happy') || lower.includes('bright')) {
    return 'major';
  }
  
  // Mood-based defaults
  if (lower.includes('dark') || lower.includes('somber') || lower.includes('gloomy')) {
    return 'minor';
  }
  
  // Default to major
  return 'major';
}

/**
 * Extract voice preset from prompt
 */
function extractVoicePreset(prompt: string): VoicePreset {
  const lower = prompt.toLowerCase();
  
  // Check for explicit preset matches
  if (lower.includes('alto') && lower.includes('soft')) {
    return 'alto-soft';
  }
  if (lower.includes('tenor') && lower.includes('bright')) {
    return 'tenor-bright';
  }
  if (lower.includes('soprano') && (lower.includes('airy') || lower.includes('light'))) {
    return 'soprano-airy';
  }
  if (lower.includes('baritone') && (lower.includes('warm') || lower.includes('deep'))) {
    return 'baritone-warm';
  }
  
  // Check for individual characteristics
  if (lower.includes('soprano')) {
    return 'soprano-airy';
  }
  if (lower.includes('alto')) {
    return 'alto-soft';
  }
  if (lower.includes('tenor')) {
    return 'tenor-bright';
  }
  if (lower.includes('baritone') || lower.includes('bass')) {
    return 'baritone-warm';
  }
  
  // Mood-based defaults
  if (lower.includes('soft') || lower.includes('gentle') || lower.includes('smooth')) {
    return 'alto-soft';
  }
  if (lower.includes('bright') || lower.includes('clear')) {
    return 'tenor-bright';
  }
  if (lower.includes('high') || lower.includes('light') || lower.includes('airy')) {
    return 'soprano-airy';
  }
  if (lower.includes('deep') || lower.includes('rich') || lower.includes('warm')) {
    return 'baritone-warm';
  }
  
  // Default
  return 'alto-soft';
}

/**
 * Extract panning position from prompt (-1 = left, 0 = center, 1 = right)
 */
function extractPan(prompt: string): number {
  const lower = prompt.toLowerCase();
  
  if (lower.includes('left')) {
    return -0.5;
  }
  if (lower.includes('right')) {
    return 0.5;
  }
  
  // Default to center
  return 0;
}

/**
 * Extract or generate lyrics from prompt
 * If no lyrics specified, generate simple placeholder
 */
function extractLyrics(prompt: string): string {
  // Check if prompt contains "singing about X" or "about X"
  const aboutMatch = prompt.match(/(?:singing\s+)?about\s+(.+?)(?:\s+in\s+|\s+with\s+|$)/i);
  if (aboutMatch) {
    const topic = aboutMatch[1].trim();
    // Generate simple lyrics based on topic
    return `La la ${topic} oh oh\n${topic} is here today\nLa la la`;
  }
  
  // Check for explicit lyrics in quotes
  const quotedMatch = prompt.match(/"([^"]+)"/);
  if (quotedMatch) {
    return quotedMatch[1];
  }
  
  // Default placeholder lyrics
  return 'La la la oh oh\nSinging here today\nLa la la';
}

/**
 * Extract duration from prompt or use default
 */
function extractDuration(prompt: string): number {
  const durationMatch = prompt.match(/(\d+)\s*(?:second|sec)s?/i);
  if (durationMatch) {
    return Math.max(1, Math.min(60, parseInt(durationMatch[1])));
  }
  
  // Default duration
  return 8;
}

/**
 * Parse a natural language prompt into SingingInput parameters
 * 
 * Example prompts:
 * - "soft soprano singing a dreamy melody about the moon"
 * - "energetic tenor with bright tone at 140 bpm"
 * - "gentle alto singing about love in minor key"
 * 
 * @param prompt - Natural language description
 * @returns Structured singing input parameters
 */
export function parsePrompt(prompt: string): SingingInput {
  return {
    lyrics: extractLyrics(prompt),
    bpm: extractBPM(prompt),
    seconds: extractDuration(prompt),
    scale: extractScale(prompt),
    preset: extractVoicePreset(prompt),
    pan: extractPan(prompt),
  };
}

/**
 * Create a default SingingInput for testing/fallback
 */
export function getDefaultSingingInput(): SingingInput {
  return {
    lyrics: 'La la la oh oh\nSinging here today\nLa la la',
    bpm: 120,
    seconds: 8,
    scale: 'major',
    preset: 'alto-soft',
    pan: 0,
  };
}

/**
 * Validate and sanitize SingingInput
 */
export function validateSingingInput(input: SingingInput): SingingInput {
  return {
    lyrics: input.lyrics || 'La la la',
    bpm: Math.max(40, Math.min(200, input.bpm)),
    seconds: Math.max(1, Math.min(60, input.seconds)),
    scale: input.scale === 'major' || input.scale === 'minor' ? input.scale : 'major',
    preset: input.preset || 'alto-soft',
    pan: Math.max(-1, Math.min(1, input.pan)),
  };
}
