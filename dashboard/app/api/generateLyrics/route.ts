import { NextResponse } from 'next/server';
import { SingingObject, Mood } from '../../lib/types';

const SAMPLE_LYRICS = [
  "In shadows deep, I cast my glow...\nA quiet light for those who know...",
  "Spinning tales of metal dreams...\nNothing's ever what it seems...",
  "The rhythm flows through circuits bright...\nDancing pixels in the night...",
  "My heart beats slow, a steady drum...\nWaiting for the day to come...",
  "Through the chaos, I remain...\nEndless cycles, joy and pain...",
];

interface GenerateLyricsRequest {
  object?: SingingObject;
  personality?: string;
  genre?: string;
  mood?: Mood;
}

export async function POST(request: Request) {
  try {
    const body: GenerateLyricsRequest = await request.json();
    const { object, personality, genre, mood } = body;
    
    // Extract values from object if provided
    const finalPersonality = object?.personality || personality;
    const finalGenre = object?.genre || genre;
    const finalMood = object?.mood || mood;
    
    if (!finalPersonality || !finalGenre) {
      return NextResponse.json(
        { ok: false, error: 'Missing required fields: personality and genre' },
        { status: 400 }
      );
    }

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Generate context-aware lyrics (mock)
    const randomLyrics = SAMPLE_LYRICS[Math.floor(Math.random() * SAMPLE_LYRICS.length)];
    
    const contextualLyrics = `${finalPersonality.split(' ')[0]} whispers soft and ${finalGenre}...\n${randomLyrics.split('\n')[1]}`;

    return NextResponse.json({
      ok: true,
      data: {
        lyrics: contextualLyrics,
        metadata: {
          genre: finalGenre,
          mood: finalMood,
          generatedAt: new Date().toISOString(),
        },
      },
    });
  } catch (error) {
    console.error('Error generating lyrics:', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to generate lyrics' },
      { status: 500 }
    );
  }
}
