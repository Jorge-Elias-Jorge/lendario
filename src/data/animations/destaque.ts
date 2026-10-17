import type { SubtitleAnimation } from './types';

export const HIGHLIGHT_ANIMATIONS: SubtitleAnimation[] = [
  { id: 'destaque-amarelo', name: 'Destaque amarelo', type: 'Glow', mode: 'highlight', duration: 300, intensity: 0.8 },
  { id: 'destaque-neon', name: 'Destaque neon', type: 'Glow', mode: 'highlight', duration: 350, intensity: 0.9 },
  { id: 'destaque-pop', name: 'Destaque pop', type: 'Pop', mode: 'highlight', duration: 250, intensity: 0.8 },
  { id: 'destaque-bounce', name: 'Destaque bounce', type: 'Bounce', mode: 'highlight', duration: 400, intensity: 0.8 },
  { id: 'destaque-impacto', name: 'Destaque impacto', type: 'Impact', mode: 'highlight', duration: 280, intensity: 1 }
];
