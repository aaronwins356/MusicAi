import { describe, it, expect } from 'vitest';
import { SingingObject } from '../../app/lib/types';

describe('Generate Song API', () => {
  const testObject: SingingObject = {
    id: 'test-1',
    type: 'Lamp',
    name: 'Test Lamp',
    personality: 'A test lamp for unit testing',
    genre: 'jazz',
    vocalRange: 'tenor',
    mood: { happy: 0.5, calm: 0.5, bright: 0.5 },
    icon: '💡',
    color: '#FFD700',
    volume: 0.7,
    enabled: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  it('should generate a song with valid input', async () => {
    const response = await fetch('http://localhost:3000/api/generateSong', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Test Song',
        harmonyMode: false,
        objects: [testObject],
      }),
    });

    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(data.ok).toBe(true);
    expect(data.data).toBeDefined();
    expect(data.data.title).toBe('Test Song');
    expect(data.data.bpm).toBeGreaterThan(0);
    expect(data.data.key).toBeDefined();
    expect(data.data.mixedAudioUrl).toBeDefined();
    expect(data.data.tracks).toHaveLength(1);
    expect(data.data.tracks[0].objectId).toBe('test-1');
    expect(data.data.tracks[0].waveform).toBeDefined();
    expect(data.data.tracks[0].waveform.length).toBeGreaterThan(0);
  });

  it('should fail with no enabled objects', async () => {
    const disabledObject = { ...testObject, enabled: false };
    
    const response = await fetch('http://localhost:3000/api/generateSong', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        harmonyMode: false,
        objects: [disabledObject],
      }),
    });

    expect(response.status).toBe(400);
    
    const data = await response.json();
    expect(data.ok).toBe(false);
    expect(data.error).toBeDefined();
  });

  it('should generate distinct waveforms in harmony mode', async () => {
    const testObject2 = { ...testObject, id: 'test-2', name: 'Test Kettle' };
    
    const response = await fetch('http://localhost:3000/api/generateSong', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        harmonyMode: true,
        objects: [testObject, testObject2],
      }),
    });

    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(data.ok).toBe(true);
    expect(data.data.harmonyMode).toBe(true);
    expect(data.data.tracks).toHaveLength(2);
    
    // Waveforms should be different in harmony mode
    const waveform1 = data.data.tracks[0].waveform;
    const waveform2 = data.data.tracks[1].waveform;
    expect(waveform1).not.toEqual(waveform2);
  });
});
