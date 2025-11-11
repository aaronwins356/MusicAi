import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), '.data', 'objects.json');

function loadUserObjects(): number {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, 'utf-8');
      const objects = JSON.parse(content);
      return Array.isArray(objects) ? objects.length : 0;
    }
  } catch (error) {
    console.error('Error loading user objects:', error);
  }
  return 0;
}

export async function GET() {
  try {
    const presetsCount = 3; // We have 3 preset objects
    const userCount = loadUserObjects();
    
    return NextResponse.json({
      ok: true,
      data: {
        status: 'ok',
        counts: {
          presets: presetsCount,
          userObjects: userCount,
        },
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error fetching health:', error);
    return NextResponse.json(
      { ok: false, error: 'Health check failed' },
      { status: 500 }
    );
  }
}
