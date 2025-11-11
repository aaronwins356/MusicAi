import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { vocalRange, personality, lyrics } = body;

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Generate mock voice data
    const voiceData = {
      success: true,
      voice: {
        range: vocalRange,
        timbre: personality.includes('soft') ? 'warm' : 'bright',
        sampleUrl: `/mock-audio/${vocalRange}-sample.mp3`,
        waveform: Array.from({ length: 150 }, () => Math.random() * 80),
        duration: 15.5,
      },
      preview: {
        text: lyrics?.substring(0, 50) || 'Sample preview...',
        phonemes: ['ɑː', 'eɪ', 'iː', 'oʊ', 'uː'],
      },
      generatedAt: new Date().toISOString(),
    };

    return NextResponse.json(voiceData);
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to generate voice' },
      { status: 500 }
    );
  }
}
