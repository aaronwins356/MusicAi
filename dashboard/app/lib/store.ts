import { create } from 'zustand';
import { SingingObject } from './types';

export interface StudioStore {
  objects: SingingObject[];
  selectedObject: SingingObject | null;
  harmonyMode: boolean;
  isCreateModalOpen: boolean;
  
  // Actions
  addObject: (object: SingingObject) => void;
  updateObject: (id: string, updates: Partial<SingingObject>) => void;
  removeObject: (id: string) => void;
  selectObject: (object: SingingObject | null) => void;
  toggleObjectEnabled: (id: string) => void;
  setObjectVolume: (id: string, volume: number) => void;
  toggleHarmonyMode: () => void;
  toggleCreateModal: () => void;
  hydrateFromStorage: () => Promise<void>;
}

// Sample preset objects
const DEFAULT_OBJECTS: SingingObject[] = [
  {
    id: 'lamp-1',
    name: 'Melancholic Lamp',
    type: 'Lamp',
    personality: 'A tired desk lamp who has seen too many late nights and now sings sad jazz ballads about forgotten dreams',
    genre: 'jazz',
    vocalRange: 'tenor',
    mood: {
      happy: 0.2,
      calm: 0.8,
      bright: 0.3,
    },
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
    mood: {
      happy: 0.8,
      calm: 0.5,
      bright: 0.9,
    },
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
    mood: {
      happy: 0.6,
      calm: 0.2,
      bright: 0.7,
    },
    lyrics: 'Pop up, pop down!\nBurning it all to the ground!',
    icon: '🍞',
    color: '#E74C3C',
    volume: 0.75,
    enabled: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const useStudioStore = create<StudioStore>((set) => ({
  objects: DEFAULT_OBJECTS,
  selectedObject: null,
  harmonyMode: false,
  isCreateModalOpen: false,

  addObject: (object) =>
    set((state) => ({
      objects: [...state.objects, object],
    })),

  updateObject: (id, updates) =>
    set((state) => ({
      objects: state.objects.map((obj) =>
        obj.id === id ? { ...obj, ...updates, updatedAt: new Date().toISOString() } : obj
      ),
      selectedObject:
        state.selectedObject?.id === id
          ? { ...state.selectedObject, ...updates, updatedAt: new Date().toISOString() }
          : state.selectedObject,
    })),

  removeObject: (id) =>
    set((state) => ({
      objects: state.objects.filter((obj) => obj.id !== id),
      selectedObject: state.selectedObject?.id === id ? null : state.selectedObject,
    })),

  selectObject: (object) =>
    set({
      selectedObject: object,
    }),

  toggleObjectEnabled: (id) =>
    set((state) => ({
      objects: state.objects.map((obj) =>
        obj.id === id ? { ...obj, enabled: !obj.enabled, updatedAt: new Date().toISOString() } : obj
      ),
    })),

  setObjectVolume: (id, volume) =>
    set((state) => ({
      objects: state.objects.map((obj) =>
        obj.id === id ? { ...obj, volume, updatedAt: new Date().toISOString() } : obj
      ),
    })),

  toggleHarmonyMode: () =>
    set((state) => ({
      harmonyMode: !state.harmonyMode,
    })),

  toggleCreateModal: () =>
    set((state) => ({
      isCreateModalOpen: !state.isCreateModalOpen,
    })),

  hydrateFromStorage: async () => {
    // Implementation will be in persistence.ts
    if (typeof window === 'undefined') return;
    
    const { loadObjects } = await import('./persistence');
    const userObjects = await loadObjects();
    
    set((state) => {
      // Merge presets with user objects, preferring user objects on ID collision
      const presetIds = new Set(DEFAULT_OBJECTS.map(obj => obj.id));
      const uniqueUserObjects = userObjects.filter(obj => !presetIds.has(obj.id));
      
      return {
        objects: [...DEFAULT_OBJECTS, ...uniqueUserObjects],
      };
    });
  },
}));
