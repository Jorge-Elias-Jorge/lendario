import { create } from 'zustand';
import { Cue } from './core/srt';
import { SubtitleStyle, STYLES } from './data/styles';
import { SubtitleAnimation, ANIMATIONS } from './data/animations';

interface State {
  videoUrl: string | null;
  videoName: string;
  cues: Cue[];
  selectedCueId: string | null;
  style: SubtitleStyle;
  animation: SubtitleAnimation;
  theme: 'dark'|'light';
  setVideo: (url: string, name: string) => void;
  setCues: (cues: Cue[]) => void;
  updateCue: (id: string, patch: Partial<Cue>) => void;
  select: (id: string | null) => void;
  setStyle: (s: SubtitleStyle) => void;
  setAnimation: (a: SubtitleAnimation) => void;
  toggleTheme: () => void;
}

export const useStore = create<State>((set) => ({
  videoUrl: null,
  videoName: '',
  cues: [],
  selectedCueId: null,
  style: STYLES[0],
  animation: ANIMATIONS[0],
  theme: 'dark',
  setVideo: (url, name) => set({ videoUrl: url, videoName: name }),
  setCues: (cues) => set({ cues }),
  updateCue: (id, patch) => set(s => ({ cues: s.cues.map(c => c.id === id ? { ...c, ...patch } : c) })),
  select: (id) => set({ selectedCueId: id }),
  setStyle: (style) => set({ style }),
  setAnimation: (animation) => set({ animation }),
  toggleTheme: () => set(s => ({ theme: s.theme === 'dark' ? 'light' : 'dark' }))
}));