import { NextResponse } from 'next/server';
import { SingingObject } from '../../lib/types';
import fs from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), '.data', 'objects.json');

// Ensure data directory exists
function ensureDataDir() {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Load user objects from file
function loadUserObjects(): SingingObject[] {
  try {
    ensureDataDir();
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, 'utf-8');
      return JSON.parse(content);
    }
  } catch (error) {
    console.error('Error loading user objects:', error);
  }
  return [];
}

// Save user objects to file
function saveUserObjects(objects: SingingObject[]): void {
  try {
    ensureDataDir();
    fs.writeFileSync(DATA_FILE, JSON.stringify(objects, null, 2));
  } catch (error) {
    console.error('Error saving user objects:', error);
  }
}

// GET /api/objects - List all objects (presets + user)
export async function GET() {
  try {
    // Load preset objects
    const presets: SingingObject[] = [
      {
        id: 'lamp-1',
        name: 'Melancholic Lamp',
        type: 'Lamp',
        personality: 'A tired desk lamp who has seen too many late nights and now sings sad jazz ballads about forgotten dreams',
        genre: 'jazz',
        vocalRange: 'tenor',
        mood: { happy: 0.2, calm: 0.8, bright: 0.3 },
        lyrics: 'In the shadow of the night...\nI illuminate your sight...\nBut who lights up my world?',
        icon: '💡',
        color: '#FFD700',
        volume: 0.7,
        enabled: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'kettle-1',
        name: 'Jazz Kettle',
        type: 'Kettle',
        personality: 'An enthusiastic kettle who loves smooth jazz and whistles melodious tunes while boiling water',
        genre: 'jazz',
        vocalRange: 'soprano',
        mood: { happy: 0.8, calm: 0.5, bright: 0.9 },
        lyrics: 'Steaming hot and ready to go...\nWatch me whistle, hear me flow...',
        icon: '🫖',
        color: '#4A90E2',
        volume: 0.8,
        enabled: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'toaster-1',
        name: 'Rock Toaster',
        type: 'Toaster',
        personality: 'A rebellious toaster that burns bread on purpose and screams rock anthems',
        genre: 'rock',
        vocalRange: 'bass',
        mood: { happy: 0.6, calm: 0.2, bright: 0.7 },
        lyrics: 'Pop up, pop down!\nBurning it all to the ground!',
        icon: '🍞',
        color: '#E74C3C',
        volume: 0.75,
        enabled: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
    
    const userObjects = loadUserObjects();
    const allObjects = [...presets, ...userObjects];
    
    return NextResponse.json({
      ok: true,
      data: { objects: allObjects },
    });
  } catch (error) {
    console.error('Error fetching objects:', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to fetch objects' },
      { status: 500 }
    );
  }
}

// POST /api/objects - Create a new user object
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.name || !body.type || !body.personality || !body.genre || !body.vocalRange) {
      return NextResponse.json(
        { ok: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    const now = new Date().toISOString();
    const newObject: SingingObject = {
      id: body.id || `custom-${Date.now()}`,
      type: body.type,
      name: body.name,
      personality: body.personality,
      genre: body.genre,
      vocalRange: body.vocalRange,
      mood: body.mood || { happy: 0.5, calm: 0.5, bright: 0.5 },
      lyrics: body.lyrics || '',
      icon: body.icon || '🎵',
      color: body.color || `#${Math.floor(Math.random() * 16777215).toString(16)}`,
      volume: body.volume ?? 0.75,
      enabled: body.enabled ?? true,
      createdAt: now,
      updatedAt: now,
    };
    
    const userObjects = loadUserObjects();
    userObjects.push(newObject);
    saveUserObjects(userObjects);
    
    return NextResponse.json(
      { ok: true, data: { object: newObject } },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating object:', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to create object' },
      { status: 500 }
    );
  }
}
