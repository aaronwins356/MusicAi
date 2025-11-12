/**
 * Tests for lyrics processing
 */

import { describe, it, expect } from 'vitest';
import { textToPhonemes, getTotalDuration, getLyricLines, getActiveWordIndex } from '../../app/lib/lyrics';

describe('Lyrics Processing', () => {
  describe('textToPhonemes', () => {
    it('should convert simple text to phonemes', () => {
      const phonemes = textToPhonemes('La la la', 120);
      
      expect(phonemes.length).toBeGreaterThan(0);
      
      // Check that vowels are mapped correctly
      const vowelPhonemes = phonemes.filter(p => p.phoneme === 'A');
      expect(vowelPhonemes.length).toBeGreaterThan(0);
    });
    
    it('should handle consonants', () => {
      const phonemes = textToPhonemes('Hello', 120);
      
      // Should have both vowels and consonants
      const vowels = phonemes.filter(p => /[AEIOU]/.test(p.phoneme));
      const consonants = phonemes.filter(p => p.phoneme === 'C');
      
      expect(vowels.length).toBeGreaterThan(0);
      expect(consonants.length).toBeGreaterThan(0);
    });
    
    it('should assign durations to phonemes', () => {
      const phonemes = textToPhonemes('Test', 120);
      
      phonemes.forEach(p => {
        expect(p.duration).toBeGreaterThan(0);
      });
    });
    
    it('should create pauses between words', () => {
      const phonemes = textToPhonemes('La la', 120);
      
      // Should have a pause (empty phoneme) between words
      const pauses = phonemes.filter(p => p.phoneme === '');
      expect(pauses.length).toBeGreaterThan(0);
    });
    
    it('should adjust timing based on BPM', () => {
      const slowPhonemes = textToPhonemes('Test', 60);
      const fastPhonemes = textToPhonemes('Test', 120);
      
      const slowDuration = getTotalDuration(slowPhonemes);
      const fastDuration = getTotalDuration(fastPhonemes);
      
      // Slower BPM should result in longer total duration
      expect(slowDuration).toBeGreaterThan(fastDuration);
    });
  });
  
  describe('getTotalDuration', () => {
    it('should calculate total duration', () => {
      const phonemes = textToPhonemes('Hello world', 120);
      const duration = getTotalDuration(phonemes);
      
      expect(duration).toBeGreaterThan(0);
      expect(typeof duration).toBe('number');
    });
    
    it('should return 0 for empty array', () => {
      const duration = getTotalDuration([]);
      expect(duration).toBe(0);
    });
  });
  
  describe('getLyricLines', () => {
    it('should split lyrics into lines', () => {
      const lyrics = 'Line one\nLine two\nLine three';
      const lines = getLyricLines(lyrics);
      
      expect(lines).toHaveLength(3);
      expect(lines[0]).toBe('Line one');
      expect(lines[1]).toBe('Line two');
      expect(lines[2]).toBe('Line three');
    });
    
    it('should filter out empty lines', () => {
      const lyrics = 'Line one\n\n\nLine two';
      const lines = getLyricLines(lyrics);
      
      expect(lines).toHaveLength(2);
    });
    
    it('should handle single line', () => {
      const lyrics = 'Single line';
      const lines = getLyricLines(lyrics);
      
      expect(lines).toHaveLength(1);
      expect(lines[0]).toBe('Single line');
    });
  });
  
  describe('getActiveWordIndex', () => {
    it('should return correct word index for current time', () => {
      const lyrics = 'One two three four';
      const totalDuration = 4000; // 4 seconds
      
      // At start
      expect(getActiveWordIndex(lyrics, 0, totalDuration)).toBe(0);
      
      // At middle
      expect(getActiveWordIndex(lyrics, 2000, totalDuration)).toBeGreaterThanOrEqual(1);
      
      // At end
      expect(getActiveWordIndex(lyrics, 3999, totalDuration)).toBe(3);
    });
    
    it('should handle empty lyrics', () => {
      const index = getActiveWordIndex('', 1000, 4000);
      expect(index).toBe(-1);
    });
    
    it('should not exceed word count', () => {
      const lyrics = 'One two';
      const totalDuration = 2000;
      
      // Even if time exceeds duration
      const index = getActiveWordIndex(lyrics, 5000, totalDuration);
      expect(index).toBeLessThanOrEqual(1);
    });
  });
});
