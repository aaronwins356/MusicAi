import { describe, it, expect, beforeEach } from 'vitest';
import { useStudioStore } from '../../app/lib/store';
import { SingingObject } from '../../app/lib/types';

describe('Studio Store', () => {
  beforeEach(() => {
    // Reset store state before each test
    const store = useStudioStore.getState();
    store.objects.forEach(obj => {
      if (obj.id.startsWith('custom-')) {
        store.removeObject(obj.id);
      }
    });
  });

  it('should have initial preset objects', () => {
    const { objects } = useStudioStore.getState();
    expect(objects.length).toBeGreaterThanOrEqual(3);
    expect(objects.find(obj => obj.id === 'lamp-1')).toBeDefined();
    expect(objects.find(obj => obj.id === 'kettle-1')).toBeDefined();
    expect(objects.find(obj => obj.id === 'toaster-1')).toBeDefined();
  });

  it('should add a new object', () => {
    const store = useStudioStore.getState();
    const initialCount = store.objects.length;
    
    const newObject: SingingObject = {
      id: 'custom-test',
      type: 'TestObject',
      name: 'Test Object',
      personality: 'A test object',
      genre: 'pop',
      vocalRange: 'alto',
      mood: { happy: 0.5, calm: 0.5, bright: 0.5 },
      icon: '🧪',
      color: '#00FF00',
      volume: 0.75,
      enabled: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    store.addObject(newObject);
    
    const { objects } = useStudioStore.getState();
    expect(objects.length).toBe(initialCount + 1);
    expect(objects.find(obj => obj.id === 'custom-test')).toBeDefined();
  });

  it('should update an object', () => {
    const store = useStudioStore.getState();
    const objectToUpdate = store.objects[0];
    const newName = 'Updated Name';
    
    store.updateObject(objectToUpdate.id, { name: newName });
    
    const { objects } = useStudioStore.getState();
    const updated = objects.find(obj => obj.id === objectToUpdate.id);
    expect(updated?.name).toBe(newName);
    expect(updated?.updatedAt).not.toBe(objectToUpdate.updatedAt);
  });

  it('should remove an object', () => {
    const store = useStudioStore.getState();
    
    const newObject: SingingObject = {
      id: 'custom-remove-test',
      type: 'TestObject',
      name: 'Test Object',
      personality: 'A test object',
      genre: 'pop',
      vocalRange: 'alto',
      mood: { happy: 0.5, calm: 0.5, bright: 0.5 },
      icon: '🧪',
      color: '#00FF00',
      volume: 0.75,
      enabled: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    store.addObject(newObject);
    const countAfterAdd = store.objects.length;
    
    store.removeObject('custom-remove-test');
    
    const { objects } = useStudioStore.getState();
    expect(objects.length).toBe(countAfterAdd - 1);
    expect(objects.find(obj => obj.id === 'custom-remove-test')).toBeUndefined();
  });

  it('should toggle object enabled state', () => {
    const store = useStudioStore.getState();
    const objectToToggle = store.objects[0];
    const initialState = objectToToggle.enabled;
    
    store.toggleObjectEnabled(objectToToggle.id);
    
    const { objects } = useStudioStore.getState();
    const toggled = objects.find(obj => obj.id === objectToToggle.id);
    expect(toggled?.enabled).toBe(!initialState);
  });

  it('should set object volume', () => {
    const store = useStudioStore.getState();
    const objectToUpdate = store.objects[0];
    const newVolume = 0.5;
    
    store.setObjectVolume(objectToUpdate.id, newVolume);
    
    const { objects } = useStudioStore.getState();
    const updated = objects.find(obj => obj.id === objectToUpdate.id);
    expect(updated?.volume).toBe(newVolume);
  });

  it('should toggle harmony mode', () => {
    const store = useStudioStore.getState();
    const initialMode = store.harmonyMode;
    
    store.toggleHarmonyMode();
    
    const { harmonyMode } = useStudioStore.getState();
    expect(harmonyMode).toBe(!initialMode);
  });

  it('should toggle create modal', () => {
    const store = useStudioStore.getState();
    const initialState = store.isCreateModalOpen;
    
    store.toggleCreateModal();
    
    const { isCreateModalOpen } = useStudioStore.getState();
    expect(isCreateModalOpen).toBe(!initialState);
  });

  it('should select and deselect objects', () => {
    const store = useStudioStore.getState();
    const objectToSelect = store.objects[0];
    
    store.selectObject(objectToSelect);
    expect(useStudioStore.getState().selectedObject?.id).toBe(objectToSelect.id);
    
    store.selectObject(null);
    expect(useStudioStore.getState().selectedObject).toBeNull();
  });
});
