import type { SubtitleAnimation } from './types';

export const LOOP_ANIMATIONS: SubtitleAnimation[] = [
  { id: 'loop-pulsar', name: 'Pulsar', type: 'Pulse', mode: 'loop', duration: 600, intensity: 0.6 },
  { id: 'loop-brilho', name: 'Brilho contínuo', type: 'Glow', mode: 'loop', duration: 700, intensity: 0.7 },
  { id: 'loop-tremer', name: 'Tremer', type: 'Shake', mode: 'loop', duration: 400, intensity: 0.8 },
  { id: 'loop-glitch', name: 'Glitch', type: 'Glitch', mode: 'loop', duration: 500, intensity: 0.9 },
  { id: 'loop-flutuar', name: 'Flutuar', type: 'Slide', mode: 'loop', duration: 800, intensity: 0.5 }
];
