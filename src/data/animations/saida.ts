import type { SubtitleAnimation } from './types';

export const EXIT_ANIMATIONS: SubtitleAnimation[] = [
  { id: 'saida-fade', name: 'Fade de saída', type: 'Fade', mode: 'out', duration: 250, intensity: 0.5 },
  { id: 'saida-zoom', name: 'Zoom de saída', type: 'Zoom', mode: 'out', duration: 280, intensity: 0.7 },
  { id: 'saida-slide', name: 'Slide de saída', type: 'Slide', mode: 'out', duration: 300, intensity: 0.6 },
  { id: 'saida-revelar', name: 'Revelar de saída', type: 'Reveal', mode: 'out', duration: 320, intensity: 0.6 },
  { id: 'saida-rotacao', name: 'Rotação de saída', type: 'Rotate', mode: 'out', duration: 350, intensity: 0.7 }
];
