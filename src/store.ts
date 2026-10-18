import { create } from 'zustand';
import { Cue } from './core/srt';
import { SubtitleStyle, STYLES } from './data/styles';
import { SubtitleAnimation, ANIMATIONS } from './data/animations';
import type {AnimationMode} from './data/animations';
import {tracksFor} from './core/motion';

type Presentation='Frase'|'Realce ativo'|'Palavra'|'Blocos';

interface State {
  videoUrl: string | null;
  videoName: string;
  cues: Cue[];
  selectedCueId: string | null;
  style: SubtitleStyle;
  animation: SubtitleAnimation;
  theme: 'dark'|'light';
  presentation: Presentation;
  effectMs: number;
  setVideo: (url: string, name: string) => void;
  setCues: (cues: Cue[]) => void;
  updateCue: (id: string, patch: Partial<Cue>) => void;
  select: (id: string | null) => void;
  setStyle: (s: SubtitleStyle) => void;
  setAnimation: (a: SubtitleAnimation) => void;
  patchAnimation:(mode:AnimationMode,patch:Partial<SubtitleAnimation>|null)=>void;
  setPresentation: (p: Presentation) => void;
  setEffectMs: (ms: number) => void;
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
  presentation: STYLES[0].presentation ?? 'Frase',
  effectMs: 300,
  setVideo: (url, name) => set({ videoUrl: url, videoName: name }),
  setCues: (cues) => set({ cues }),
  updateCue: (id, patch) => set(s => ({ cues: s.cues.map(c => c.id === id ? { ...c, ...patch } : c) })),
  select: (id) => set({ selectedCueId: id }),
  setStyle: (style) => set(s=>({ style,presentation:style.presentation??s.presentation })),
  setAnimation: (animation) => set(s=>({
    animation,effectMs:animation.duration||s.effectMs,
    style:{...s.style,defaultMotion:'Sem animação',animationTracks:animation.type==='None'?{}:{
      ...Object.fromEntries(tracksFor(s.style,s.effectMs).map(a=>[a.mode,a])),[animation.mode]:animation
    }}
  })),
  patchAnimation:(mode,patch)=>set(s=>{
    const tracks={...Object.fromEntries(tracksFor(s.style,s.effectMs).map(a=>[a.mode,a]))};
    if(patch&&tracks[mode])tracks[mode]={...tracks[mode],...patch};else if(patch===null)delete tracks[mode];
    return {style:{...s.style,defaultMotion:'Sem animação',animationTracks:tracks}};
  }),
  setPresentation: (presentation) => set(s=>({ presentation,style:{...s.style,presentation} })),
  setEffectMs: (effectMs) => set({ effectMs }),
  toggleTheme: () => set(s => ({ theme: s.theme === 'dark' ? 'light' : 'dark' }))
}));
