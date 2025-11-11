import { NextResponse } from 'next/server';

const SAMPLE_LYRICS = [
  "In shadows deep, I cast my glow...\nA quiet light for those who know...",
  "Spinning tales of metal dreams...\nNothing's ever what it seems...",
  "The rhythm flows through circuits bright...\nDancing pixels in the night...",
  "My heart beats slow, a steady drum...\nWaiting for the day to come...",
  "Through the chaos, I remain...\nEndless cycles, joy and pain...",
];

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { personality, genre, mood } = body;

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Generate context-aware lyrics (mock)
    const randomLyrics = SAMPLE_LYRICS[Math.floor(Math.random() * SAMPLE_LYRICS.length)];
    
    const contextualLyrics = `${personality.split(' ')[0]} whispers soft and ${genre}...\n${randomLyrics.split('\n')[1]}`;

    return NextResponse.json({
      success: true,
      lyrics: contextualLyrics,
      metadata: {
        genre,
        mood,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to generate lyrics' },
      { status: 500 }
    );
  }
}
