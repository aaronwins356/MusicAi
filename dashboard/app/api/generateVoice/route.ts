import { NextResponse } from 'next/server';
import { SingingObject, VocalRange } from '../../lib/types';

interface GenerateVoiceRequest {
  object: SingingObject;
  lyrics: string;
}

export async function POST(request: Request) {
  try {
    const body: GenerateVoiceRequest = await request.json();
    const { object, lyrics } = body;

    if (!object || !lyrics) {
      return NextResponse.json(
        { ok: false, error: 'Missing required fields: object and lyrics' },
        { status: 400 }
      );
    }

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    const vocalRangeMap: Record<VocalRange, string> = {
      bass: 'deep and resonant',
      tenor: 'bright and clear',
      alto: 'warm and rich',
      soprano: 'light and airy',
    };

    // Generate mock voice data
    const voiceData = {
      voiceStyle: vocalRangeMap[object.vocalRange] || 'balanced',
      notes: `${object.name} sings with ${object.mood.happy > 0.5 ? 'joy' : 'melancholy'} in a ${object.genre} style`,
      estimatedDuration: Math.ceil(lyrics.split('\n').length * 4.5),
    };

    return NextResponse.json({ 
      ok: true, 
      data: voiceData,
    });
  } catch (error) {
    console.error('Error generating voice:', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to generate voice' },
      { status: 500 }
    );
  }
}
