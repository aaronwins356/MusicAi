/**
 * Lyrics Processing Module
 * 
 * Converts text lyrics into syllables and phonemes for vocal synthesis.
 * Uses a simple rule-based grapheme-to-phoneme mapping suitable for
 * synthesized singing voices.
 * 
 * Phoneme categories:
 * - Vowels: A, E, I, O, U (sustained sounds with formants)
 * - Consonants: C (short noise bursts)
 */

import { Phoneme } from './types';

/**
 * Simple vowel detection
 */
function isVowel(char: string): boolean {
  return /[aeiouAEIOU]/.test(char);
}

/**
 * Map grapheme to phoneme representation
 * Simplified for synthesis: vowels map to themselves, consonants to 'C'
 */
function graphemeToPhoneme(grapheme: string): string {
  const upper = grapheme.toUpperCase();
  
  // Check if it's a vowel
  if (isVowel(upper)) {
    return upper;
  }
  
  // All consonants represented as 'C'
  if (/[BCDFGHJKLMNPQRSTVWXYZ]/.test(upper)) {
    return 'C';
  }
  
  // Non-letter characters (punctuation, spaces) are silent
  return '';
}

/**
 * Split word into syllables using simple rules
 * This is a heuristic approach - not perfect but good enough for synthesis
 */
function syllabify(word: string): string[] {
  if (!word || word.length === 0) return [];
  
  const syllables: string[] = [];
  let currentSyllable = '';
  
  for (let i = 0; i < word.length; i++) {
    const char = word[i];
    const nextChar = i < word.length - 1 ? word[i + 1] : '';
    
    currentSyllable += char;
    
    // Break on vowel followed by consonant
    if (isVowel(char) && nextChar && !isVowel(nextChar)) {
      // Include the next consonant if it's followed by a vowel
      const nextNextChar = i < word.length - 2 ? word[i + 2] : '';
      if (nextNextChar && isVowel(nextNextChar)) {
        syllables.push(currentSyllable);
        currentSyllable = '';
      }
    }
  }
  
  // Add remaining syllable
  if (currentSyllable) {
    syllables.push(currentSyllable);
  }
  
  // Fallback: if no syllables created, return the whole word
  return syllables.length > 0 ? syllables : [word];
}

/**
 * Convert text lyrics to phoneme sequence
 * Each phoneme includes timing information for synthesis
 */
export function textToPhonemes(lyrics: string, bpm: number): Phoneme[] {
  const phonemes: Phoneme[] = [];
  
  // Remove extra whitespace and split into words
  const words = lyrics.trim().split(/\s+/);
  
  // Calculate base duration per syllable (in milliseconds)
  // Assume 2 syllables per beat on average
  const beatDuration = (60 / bpm) * 1000; // ms per beat
  const baseSyllableDuration = beatDuration / 2;
  
  for (const word of words) {
    const syllables = syllabify(word);
    
    for (const syllable of syllables) {
      // Convert each character in syllable to phoneme
      for (let i = 0; i < syllable.length; i++) {
        const char = syllable[i];
        const phoneme = graphemeToPhoneme(char);
        
        if (phoneme) {
          // Vowels get more duration, consonants are short
          const duration = isVowel(char) 
            ? baseSyllableDuration * 0.7  // Vowels: 70% of syllable
            : baseSyllableDuration * 0.15; // Consonants: 15% of syllable
          
          phonemes.push({
            grapheme: char,
            phoneme,
            duration,
          });
        }
      }
    }
    
    // Add a small pause between words (using silence)
    phonemes.push({
      grapheme: ' ',
      phoneme: '',
      duration: baseSyllableDuration * 0.2,
    });
  }
  
  return phonemes;
}

/**
 * Calculate total duration of phoneme sequence
 */
export function getTotalDuration(phonemes: Phoneme[]): number {
  return phonemes.reduce((sum, p) => sum + p.duration, 0);
}

/**
 * Split lyrics into lines for display
 */
export function getLyricLines(lyrics: string): string[] {
  return lyrics.split(/\n+/).filter(line => line.trim().length > 0);
}

/**
 * Find which word/syllable should be highlighted at a given time
 */
export function getActiveWordIndex(
  lyrics: string,
  currentTime: number,
  totalDuration: number
): number {
  const words = lyrics.trim().split(/\s+/).filter(w => w.length > 0);
  if (words.length === 0) return -1;
  
  // Simple linear interpolation
  const progress = currentTime / totalDuration;
  const index = Math.floor(progress * words.length);
  
  return Math.min(index, words.length - 1);
}
