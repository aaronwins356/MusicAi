import { NextResponse } from 'next/server';
import { SingingObject, SongResult, SongTrack } from '../../lib/types';
import { makeTrackWaveforms } from '../../lib/waveform';
import { MOCK_AUDIO_URL, PY_BACKEND_URL } from '../../lib/config';

interface GenerateSongRequest {
  title?: string;
  harmonyMode: boolean;
  objects: SingingObject[];
}

async function callPythonBackend(request: GenerateSongRequest): Promise<SongResult | null> {
  if (!PY_BACKEND_URL) return null;
  
  try {
    const response = await fetch(`${PY_BACKEND_URL}/compose`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    
    if (!response.ok) return null;
    
    return await response.json();
  } catch (error) {
    console.error('Failed to call Python backend:', error);
    return null;
  }
}

function generateMockSong(request: GenerateSongRequest): SongResult {
  const { title, harmonyMode, objects } = request;
  const enabledObjects = objects.filter((obj) => obj.enabled);
  
  // Generate waveforms with distinct patterns for harmony mode
  const waveforms = makeTrackWaveforms(enabledObjects.length, harmonyMode, 256);
  
  const tracks: SongTrack[] = enabledObjects.map((obj, index) => ({
    objectId: obj.id,
    displayName: obj.name,
    genre: obj.genre,
    vocalRange: obj.vocalRange,
    enabled: obj.enabled,
    volume: obj.volume,
    waveform: waveforms[index],
  }));
  
  const keys = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
  const randomKey = keys[Math.floor(Math.random() * keys.length)];
  const randomBpm = 100 + Math.floor(Math.random() * 60);
  
  const defaultTitle = harmonyMode 
    ? `Harmony of ${enabledObjects.length} Objects`
    : enabledObjects[0]?.name || 'Untitled Song';
  
  return {
    id: `song-${Date.now()}`,
    title: title || defaultTitle,
    bpm: randomBpm,
    key: randomKey,
    harmonyMode,
    mixedAudioUrl: MOCK_AUDIO_URL,
    tracks,
  };
}

export async function POST(request: Request) {
  try {
    const body: GenerateSongRequest = await request.json();
    
    // Validate input
    if (!body.objects || !Array.isArray(body.objects)) {
      return NextResponse.json(
        { ok: false, error: 'Missing or invalid objects array' },
        { status: 400 }
      );
    }
    
    const enabledObjects = body.objects.filter((obj) => obj.enabled);
    
    if (enabledObjects.length === 0) {
      return NextResponse.json(
        { ok: false, error: 'At least one object must be enabled' },
        { status: 400 }
      );
    }
    
    // Try Python backend first if configured
    const pythonResult = await callPythonBackend(body);
    if (pythonResult) {
      return NextResponse.json({ ok: true, data: pythonResult });
    }
    
    // Simulate API delay for full song generation
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Generate mock song
    const songResult = generateMockSong(body);
    
    return NextResponse.json({ ok: true, data: songResult });
  } catch (error) {
    console.error('Error generating song:', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to generate song' },
      { status: 500 }
    );
  }
}
