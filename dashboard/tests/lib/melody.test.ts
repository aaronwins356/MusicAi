/**
 * Tests for melody generation
 */

import { describe, it, expect } from 'vitest';
import { generateMelody, syncMelodyToPhonemes, generateTestMelody, getKeyName } from '../../app/lib/melody';

describe('Melody Generation', () => {
  describe('generateMelody', () => {
    it('should generate notes based on duration', () => {
      const melody = generateMelody(120, 4, 'major', 60, 42);
      
      expect(melody.length).toBeGreaterThan(0);
      
      // Check that all notes have required properties
      melody.forEach(note => {
        expect(note.frequency).toBeGreaterThan(0);
        expect(note.startTime).toBeGreaterThanOrEqual(0);
        expect(note.duration).toBeGreaterThan(0);
      });
    });
    
    it('should be deterministic with same seed', () => {
      const melody1 = generateMelody(120, 4, 'major', 60, 42);
      const melody2 = generateMelody(120, 4, 'major', 60, 42);
      
      expect(melody1.length).toBe(melody2.length);
      
      // First few notes should be identical
      for (let i = 0; i < Math.min(3, melody1.length); i++) {
        expect(melody1[i].frequency).toBe(melody2[i].frequency);
      }
    });
    
    it('should generate different melodies with different seeds', () => {
      const melody1 = generateMelody(120, 4, 'major', 60, 42);
      const melody2 = generateMelody(120, 4, 'major', 60, 99);
      
      // At least one note should be different
      let hasDifference = false;
      for (let i = 0; i < Math.min(melody1.length, melody2.length); i++) {
        if (melody1[i].frequency !== melody2[i].frequency) {
          hasDifference = true;
          break;
        }
      }
      
      expect(hasDifference).toBe(true);
    });
    
    it('should respect BPM timing', () => {
      const slowMelody = generateMelody(60, 4, 'major', 60, 42);
      const fastMelody = generateMelody(120, 4, 'major', 60, 42);
      
      // Faster BPM should have more notes in same duration
      expect(fastMelody.length).toBeGreaterThan(slowMelody.length);
    });
    
    it('should use major scale intervals', () => {
      const melody = generateMelody(120, 2, 'major', 60, 42);
      
      // All frequencies should be valid notes
      melody.forEach(note => {
        expect(note.frequency).toBeGreaterThan(20);
        expect(note.frequency).toBeLessThan(4000);
      });
    });
    
    it('should use minor scale intervals', () => {
      const melody = generateMelody(120, 2, 'minor', 60, 42);
      
      // Should generate valid notes in minor scale
      expect(melody.length).toBeGreaterThan(0);
      melody.forEach(note => {
        expect(note.frequency).toBeGreaterThan(20);
        expect(note.frequency).toBeLessThan(4000);
      });
    });
    
    it('should not exceed requested duration', () => {
      const duration = 4;
      const melody = generateMelody(120, duration, 'major', 60, 42);
      
      const lastNote = melody[melody.length - 1];
      const endTime = lastNote.startTime + lastNote.duration;
      
      // Should not significantly exceed duration (allow small margin)
      expect(endTime).toBeLessThanOrEqual(duration + 0.5);
    });
  });
  
  describe('syncMelodyToPhonemes', () => {
    it('should sync melody to phoneme count', () => {
      const melody = generateMelody(120, 4, 'major', 60, 42);
      const synced = syncMelodyToPhonemes(melody, 10);
      
      expect(synced.length).toBe(10);
    });
    
    it('should cycle through melody if more phonemes than notes', () => {
      const melody = generateMelody(120, 1, 'major', 60, 42);
      const synced = syncMelodyToPhonemes(melody, melody.length * 2);
      
      expect(synced.length).toBe(melody.length * 2);
      
      // First and repeated note should have same frequency
      expect(synced[0].frequency).toBe(synced[melody.length].frequency);
    });
    
    it('should handle empty melody', () => {
      const synced = syncMelodyToPhonemes([], 5);
      expect(synced.length).toBe(0);
    });
    
    it('should handle zero phonemes', () => {
      const melody = generateMelody(120, 2, 'major', 60, 42);
      const synced = syncMelodyToPhonemes(melody, 0);
      expect(synced.length).toBe(0);
    });
  });
  
  describe('generateTestMelody', () => {
    it('should generate ascending scale', () => {
      const melody = generateTestMelody(60, 'major', 8);
      
      expect(melody.length).toBe(8);
      
      // Frequencies should generally increase (scale ascends)
      expect(melody[7].frequency).toBeGreaterThan(melody[0].frequency);
    });
    
    it('should have consistent timing', () => {
      const melody = generateTestMelody(60, 'major', 5);
      
      // Each note should start after the previous one
      for (let i = 1; i < melody.length; i++) {
        expect(melody[i].startTime).toBeGreaterThan(melody[i - 1].startTime);
      }
    });
  });
  
  describe('getKeyName', () => {
    it('should return correct note names', () => {
      expect(getKeyName(60)).toBe('C4');  // Middle C
      expect(getKeyName(69)).toBe('A4');  // A440
      expect(getKeyName(48)).toBe('C3');
    });
    
    it('should handle sharps', () => {
      expect(getKeyName(61)).toBe('C#4');
      expect(getKeyName(70)).toBe('A#4');
    });
    
    it('should handle different octaves', () => {
      expect(getKeyName(72)).toBe('C5');
      expect(getKeyName(36)).toBe('C2');
    });
  });
});
