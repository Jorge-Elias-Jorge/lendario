import type { SubtitleAnimation } from './types';

export const WORD_ANIMATIONS: SubtitleAnimation[] = [
  { id: 'palavra-saltar', name: 'Palavra saltar', type: 'Pop', mode: 'word', duration: 300, intensity: 0.7 },
  { id: 'palavra-aproximar', name: 'Palavra aproximar', type: 'Zoom', mode: 'word', duration: 280, intensity: 0.7 },
  { id: 'palavra-pulsar', name: 'Palavra pulsar', type: 'Pulse', mode: 'word', duration: 350, intensity: 0.6 },
  { id: 'palavra-girar', name: 'Palavra girar', type: 'Rotate', mode: 'word', duration: 350, intensity: 0.7 },
  { id: 'palavra-elasticidade', name: 'Palavra elástica', type: 'Elastic', mode: 'word', duration: 450, intensity: 0.9 },
  { id: 'palavra-impacto', name: 'Palavra impacto', type: 'Impact', mode: 'word', duration: 260, intensity: 1 }
];
