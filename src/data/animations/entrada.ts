import type { SubtitleAnimation } from './types';

export const ENTRANCE_ANIMATIONS: SubtitleAnimation[] = [
  { id: 'entrada-fade-suave', name: 'Fade suave', type: 'Fade', mode: 'in', duration: 300, intensity: 0.5 },
  { id: 'entrada-fade-rapido', name: 'Fade rápido', type: 'Fade', mode: 'in', duration: 180, intensity: 0.7 },
  { id: 'entrada-zoom-aproximar', name: 'Zoom aproximar', type: 'Zoom', mode: 'in', duration: 350, intensity: 0.6 },
  { id: 'entrada-zoom-forte', name: 'Zoom forte', type: 'Zoom', mode: 'in', duration: 250, intensity: 0.9 },
  { id: 'entrada-pop', name: 'Pop', type: 'Pop', mode: 'in', duration: 280, intensity: 0.8 },
  { id: 'entrada-bounce', name: 'Bounce', type: 'Bounce', mode: 'in', duration: 450, intensity: 0.8 },
  { id: 'entrada-slide-esquerda', name: 'Slide da esquerda', type: 'Slide', mode: 'in', duration: 320, intensity: 0.6 },
  { id: 'entrada-slide-direita', name: 'Slide da direita', type: 'Slide', mode: 'in', duration: 320, intensity: 0.6 },
  { id: 'entrada-revelar', name: 'Revelar', type: 'Reveal', mode: 'in', duration: 400, intensity: 0.6 },
  { id: 'entrada-rotacao', name: 'Rotação de entrada', type: 'Rotate', mode: 'in', duration: 380, intensity: 0.7 },
  { id: 'entrada-elastica', name: 'Elástica', type: 'Elastic', mode: 'in', duration: 500, intensity: 0.9 },
  { id: 'entrada-impacto', name: 'Impacto', type: 'Impact', mode: 'in', duration: 300, intensity: 1 }
];
