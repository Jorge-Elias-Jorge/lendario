import type { SubtitleAnimation } from './types';
import { ENTRANCE_ANIMATIONS } from './entrada';
import { EXIT_ANIMATIONS } from './saida';
import { HIGHLIGHT_ANIMATIONS } from './destaque';
import { WORD_ANIMATIONS } from './palavra';
import { LOOP_ANIMATIONS } from './loop';
import {STUDIO_ANIMATION_GROUPS} from './studio';

export type { SubtitleAnimation, AnimationMode } from './types';

export const ANIMATION_GROUPS: Record<string, SubtitleAnimation[]> = {
  Entrada: ENTRANCE_ANIMATIONS,
  Saída: EXIT_ANIMATIONS,
  Destaque: HIGHLIGHT_ANIMATIONS,
  Palavra: WORD_ANIMATIONS,
  Contínuas: LOOP_ANIMATIONS,
  ...STUDIO_ANIMATION_GROUPS
};

function uniqueById(items: SubtitleAnimation[]): SubtitleAnimation[] {
  const seen = new Set<string>();
  return items.filter(item => {
    if (seen.has(item.id)) throw new Error(`ID duplicado em animações: ${item.id}`);
    seen.add(item.id);
    return true;
  });
}

export const ANIMATIONS: SubtitleAnimation[] = uniqueById(Object.values(ANIMATION_GROUPS).flat());
export const ANIMATION_CATEGORIES = Object.keys(ANIMATION_GROUPS);
export const ANIMATION_TYPES = Array.from(new Set(ANIMATIONS.map(item => item.type)));
