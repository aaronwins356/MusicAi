import { SingingObject } from './types';

const STORAGE_KEY = 'singing-objects-user-data';

/**
 * Save user-created objects to localStorage
 * Guarded for SSR - only runs in browser
 */
export function saveObjects(objects: SingingObject[]): void {
  if (typeof window === 'undefined') return;
  
  try {
    const userObjects = objects.filter(obj => obj.id.startsWith('custom-'));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(userObjects));
  } catch (error) {
    console.error('Failed to save objects to localStorage:', error);
  }
}

/**
 * Load user-created objects from localStorage
 * Returns empty array if localStorage is not available or contains no data
 */
export async function loadObjects(): Promise<SingingObject[]> {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Failed to load objects from localStorage:', error);
    return [];
  }
}

/**
 * Clear all user-created objects from localStorage
 */
export function clearObjects(): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear objects from localStorage:', error);
  }
}
