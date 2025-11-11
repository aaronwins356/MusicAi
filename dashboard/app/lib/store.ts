import { create } from 'zustand';
import { SingingObject } from './types';

interface StudioStore {
  objects: SingingObject[];
  selectedObject: SingingObject | null;
  harmonyMode: boolean;
  isCreateModalOpen: boolean;
  
  // Actions
  addObject: (object: SingingObject) => void;
  updateObject: (id: string, updates: Partial<SingingObject>) => void;
  selectObject: (object: SingingObject | null) => void;
  toggleObjectEnabled: (id: string) => void;
  setObjectVolume: (id: string, volume: number) => void;
  toggleHarmonyMode: () => void;
  toggleCreateModal: () => void;
}

// Sample preset objects
const DEFAULT_OBJECTS: SingingObject[] = [
  {
    id: 'lamp-1',
    object_name: 'Melancholic Lamp',
    type: 'Lamp',
    personality: 'A tired desk lamp who has seen too many late nights and now sings sad jazz ballads about forgotten dreams',
    genre: 'jazz',
    vocal_range: 'tenor',
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
  },
  {
    id: 'kettle-1',
    object_name: 'Jazz Kettle',
    type: 'Kettle',
    personality: 'An enthusiastic kettle who loves smooth jazz and whistles melodious tunes while boiling water',
    genre: 'jazz',
    vocal_range: 'soprano',
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
  },
  {
    id: 'toaster-1',
    object_name: 'Rock Toaster',
    type: 'Toaster',
    personality: 'A rebellious toaster that burns bread on purpose and screams rock anthems',
    genre: 'rock',
    vocal_range: 'bass',
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
        obj.id === id ? { ...obj, ...updates } : obj
      ),
      selectedObject:
        state.selectedObject?.id === id
          ? { ...state.selectedObject, ...updates }
          : state.selectedObject,
    })),

  selectObject: (object) =>
    set({
      selectedObject: object,
    }),

  toggleObjectEnabled: (id) =>
    set((state) => ({
      objects: state.objects.map((obj) =>
        obj.id === id ? { ...obj, enabled: !obj.enabled } : obj
      ),
    })),

  setObjectVolume: (id, volume) =>
    set((state) => ({
      objects: state.objects.map((obj) =>
        obj.id === id ? { ...obj, volume } : obj
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
}));
