export type AnimationMode = 'in' | 'out' | 'highlight' | 'loop' | 'word' | 'char' | 'line';

export interface SubtitleAnimation {
  id: string;
  name: string;
  type: string;
  mode: AnimationMode;
  duration: number;
  intensity: number;
}
