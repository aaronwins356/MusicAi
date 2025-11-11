import { NextResponse } from 'next/server';
import { SingingObject } from '../../lib/types';

interface GenerateMelodyRequest {
  title?: string;
  bpm?: number;
  key?: string;
  objects: SingingObject[];
}

export async function POST(request: Request) {
  try {
    const body: GenerateMelodyRequest = await request.json();
    const { bpm, key, objects } = body;

    if (!objects || !Array.isArray(objects)) {
      return NextResponse.json(
        { ok: false, error: 'Missing or invalid objects array' },
        { status: 400 }
      );
    }

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    const genres = [...new Set(objects.map(obj => obj.genre))];
    const dominantGenre = genres[0] || 'pop';

    // Generate mock melody metadata
    const melodyData = {
      bpm: bpm || 120,
      key: key || ['C', 'D', 'E', 'F', 'G', 'A', 'B'][Math.floor(Math.random() * 7)],
      scale: Math.random() > 0.5 ? 'major' : 'minor',
      timeSignature: '4/4',
      structure: ['intro', 'verse', 'chorus', 'verse', 'chorus', 'bridge', 'chorus', 'outro'],
      dominantGenre,
    };

    return NextResponse.json({ 
      ok: true, 
      data: melodyData,
    });
  } catch (error) {
    console.error('Error generating melody:', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to generate melody' },
      { status: 500 }
    );
  }
}
