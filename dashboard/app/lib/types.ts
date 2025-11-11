export interface SingingObject {
  id: string;
  object_name: string;
  type: string;
  personality: string;
  genre: string;
  vocal_range: 'bass' | 'tenor' | 'alto' | 'soprano';
  mood: {
    happy: number;
    calm: number;
    bright: number;
  };
  lyrics?: string;
  icon: string;
  color: string;
  volume: number;
  enabled: boolean;
}
