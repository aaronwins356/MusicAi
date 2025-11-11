/**
 * Tests for audio synthesis engine
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { audioBufferToWav, synthesizeSong, createAudioUrl } from '../../app/lib/synth';
import type { SingingObject } from '../../app/lib/types';

// Mock Web Audio API
const mockAudioContext = {
  sampleRate: 44100,
  createBufferSource: vi.fn(() => ({
    buffer: null,
    connect: vi.fn(),
    start: vi.fn(),
  })),
  createGain: vi.fn(() => ({
    gain: { value: 1 },
    connect: vi.fn(),
  })),
  destination: {},
};

const mockOfflineAudioContext = {
  sampleRate: 44100,
  createBufferSource: vi.fn(() => ({
    buffer: null,
    connect: vi.fn(),
    start: vi.fn(),
  })),
  createGain: vi.fn(() => ({
    gain: { value: 1 },
    connect: vi.fn(),
  })),
  createBuffer: vi.fn((channels: number, length: number, sampleRate: number) => ({
    numberOfChannels: channels,
    length,
    sampleRate,
    duration: length / sampleRate,
    getChannelData: vi.fn(() => new Float32Array(length)),
  })),
  destination: {},
  startRendering: vi.fn(() => Promise.resolve({
    numberOfChannels: 2,
    length: 44100 * 8,
    sampleRate: 44100,
    duration: 8,
    getChannelData: vi.fn(() => new Float32Array(44100 * 8)),
  })),
};

// @ts-ignore - Mock globals
global.AudioContext = vi.fn(() => mockAudioContext);
// @ts-ignore - Mock globals
global.OfflineAudioContext = vi.fn(() => mockOfflineAudioContext);
// @ts-ignore - Mock globals
global.URL = {
  createObjectURL: vi.fn(() => 'blob:mock-url'),
  revokeObjectURL: vi.fn(),
};

describe('Audio Synthesis', () => {
  const mockObject: SingingObject = {
    id: 'test-1',
    name: 'Test Object',
    type: 'Test',
    personality: 'A test object',
    genre: 'test',
    vocalRange: 'alto',
    mood: {
      happy: 0.5,
      calm: 0.5,
      bright: 0.5,
    },
    icon: '🧪',
    color: '#000000',
    volume: 0.7,
    enabled: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('audioBufferToWav', () => {
    it('should convert AudioBuffer to WAV format', () => {
      const mockBuffer = {
        numberOfChannels: 2,
        length: 100,
        sampleRate: 44100,
        getChannelData: (channel: number) => new Float32Array(100),
      } as AudioBuffer;

      const wavBuffer = audioBufferToWav(mockBuffer);

      expect(wavBuffer).toBeInstanceOf(ArrayBuffer);
      expect(wavBuffer.byteLength).toBeGreaterThan(44); // At least WAV header size
    });

    it('should create valid WAV header', () => {
      const mockBuffer = {
        numberOfChannels: 1,
        length: 44100,
        sampleRate: 44100,
        getChannelData: () => new Float32Array(44100),
      } as AudioBuffer;

      const wavBuffer = audioBufferToWav(mockBuffer);
      const view = new DataView(wavBuffer);

      // Check RIFF header
      const riff = String.fromCharCode(
        view.getUint8(0),
        view.getUint8(1),
        view.getUint8(2),
        view.getUint8(3)
      );
      expect(riff).toBe('RIFF');

      // Check WAVE format
      const wave = String.fromCharCode(
        view.getUint8(8),
        view.getUint8(9),
        view.getUint8(10),
        view.getUint8(11)
      );
      expect(wave).toBe('WAVE');
    });
  });

  describe('synthesizeSong', () => {
    it('should synthesize audio from objects', async () => {
      const blob = await synthesizeSong([mockObject], 8);

      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('audio/wav');
      expect(mockOfflineAudioContext.startRendering).toHaveBeenCalled();
    });

    it('should handle multiple objects', async () => {
      const objects = [
        mockObject,
        { ...mockObject, id: 'test-2', name: 'Test Object 2' },
      ];

      const blob = await synthesizeSong(objects, 8);

      expect(blob).toBeInstanceOf(Blob);
      expect(mockOfflineAudioContext.createGain).toHaveBeenCalledTimes(2);
    });

    it('should filter out disabled objects', async () => {
      const objects = [
        mockObject,
        { ...mockObject, id: 'test-2', enabled: false },
      ];

      const blob = await synthesizeSong(objects, 8);

      expect(blob).toBeInstanceOf(Blob);
      // Only one gain node for enabled object
      expect(mockOfflineAudioContext.createGain).toHaveBeenCalledTimes(1);
    });
  });

  describe('createAudioUrl', () => {
    it('should create blob URL from blob', () => {
      const mockBlob = new Blob(['test'], { type: 'audio/wav' });
      const url = createAudioUrl(mockBlob);

      expect(url).toBe('blob:mock-url');
      expect(global.URL.createObjectURL).toHaveBeenCalledWith(mockBlob);
    });
  });
});
