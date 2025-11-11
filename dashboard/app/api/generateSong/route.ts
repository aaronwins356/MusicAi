import { NextResponse } from 'next/server';

interface TrackData {
  objectId: string;
  objectName: string;
  volume: number;
  audioUrl: string;
  waveform: number[];
}

interface SingingObjectInput {
  id: string;
  object_name: string;
  enabled: boolean;
  volume?: number;
  genre: string;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { objects, harmonyMode } = body;

    // Simulate API delay for full song generation
    await new Promise(resolve => setTimeout(resolve, 3000));

    const enabledObjects = (objects as SingingObjectInput[]).filter((obj) => obj.enabled);

    // Generate mock song data
    const songData = {
      success: true,
      song: {
        title: harmonyMode 
          ? `Harmony of ${enabledObjects.length} Objects`
          : `Solo by ${enabledObjects[0]?.object_name || 'Unknown'}`,
        duration: 180 + Math.random() * 60, // 3-4 minutes
        tracks: enabledObjects.map((obj): TrackData => ({
          objectId: obj.id,
          objectName: obj.object_name,
          volume: obj.volume || 0.7,
          audioUrl: `/mock-audio/${obj.id}-track.mp3`,
          waveform: Array.from({ length: 200 }, () => Math.random() * 100),
        })),
        harmonyMode,
        mixedAudioUrl: `/mock-audio/mixed-${Date.now()}.mp3`,
        waveform: Array.from({ length: 200 }, () => Math.random() * 100),
        downloadUrl: `/mock-audio/download-${Date.now()}.mp3`,
      },
      metadata: {
        objectCount: enabledObjects.length,
        genres: [...new Set(enabledObjects.map((obj) => obj.genre))],
        generatedAt: new Date().toISOString(),
      },
    };

    return NextResponse.json(songData);
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to generate song' },
      { status: 500 }
    );
  }
}
