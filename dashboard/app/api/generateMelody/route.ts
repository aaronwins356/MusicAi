import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { genre, mood, tempo } = body;

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Generate mock melody metadata
    const melodyData = {
      success: true,
      melody: {
        key: ['C', 'D', 'E', 'F', 'G', 'A', 'B'][Math.floor(Math.random() * 7)],
        scale: Math.random() > 0.5 ? 'major' : 'minor',
        tempo: tempo || 120,
        timeSignature: '4/4',
        progression: ['I', 'V', 'vi', 'IV'],
        genre,
        mood,
      },
      waveform: Array.from({ length: 100 }, () => Math.random() * 100),
      generatedAt: new Date().toISOString(),
    };

    return NextResponse.json(melodyData);
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to generate melody' },
      { status: 500 }
    );
  }
}
