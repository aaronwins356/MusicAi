import { NextResponse } from 'next/server';
import { SingingObject } from '../../../lib/types';
import fs from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), '.data', 'objects.json');

function ensureDataDir() {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

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

function saveUserObjects(objects: SingingObject[]): void {
  try {
    ensureDataDir();
    fs.writeFileSync(DATA_FILE, JSON.stringify(objects, null, 2));
  } catch (error) {
    console.error('Error saving user objects:', error);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    if (!id.startsWith('custom-')) {
      return NextResponse.json(
        { ok: false, error: 'Cannot modify preset objects' },
        { status: 403 }
      );
    }
    
    const userObjects = loadUserObjects();
    const objectIndex = userObjects.findIndex(obj => obj.id === id);
    
    if (objectIndex === -1) {
      return NextResponse.json(
        { ok: false, error: 'Object not found' },
        { status: 404 }
      );
    }
    
    const updatedObject: SingingObject = {
      ...userObjects[objectIndex],
      ...body,
      id,
      updatedAt: new Date().toISOString(),
    };
    
    userObjects[objectIndex] = updatedObject;
    saveUserObjects(userObjects);
    
    return NextResponse.json({
      ok: true,
      data: { object: updatedObject },
    });
  } catch (error) {
    console.error('Error updating object:', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to update object' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (!id.startsWith('custom-')) {
      return NextResponse.json(
        { ok: false, error: 'Cannot delete preset objects' },
        { status: 403 }
      );
    }
    
    const userObjects = loadUserObjects();
    const filteredObjects = userObjects.filter(obj => obj.id !== id);
    
    if (filteredObjects.length === userObjects.length) {
      return NextResponse.json(
        { ok: false, error: 'Object not found' },
        { status: 404 }
      );
    }
    
    saveUserObjects(filteredObjects);
    
    return NextResponse.json({
      ok: true,
      data: { deleted: true },
    });
  } catch (error) {
    console.error('Error deleting object:', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to delete object' },
      { status: 500 }
    );
  }
}
