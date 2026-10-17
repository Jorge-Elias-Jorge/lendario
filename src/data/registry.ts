import { SubtitleStyle, STYLES } from './styles';
import { SubtitleAnimation, ANIMATIONS } from './animations';

export interface CaptionCatalog {
  styles: SubtitleStyle[];
  animations: SubtitleAnimation[];
}

function uniqueById<T extends { id: string }>(items: T[], label: string): T[] {
  const seen = new Set<string>();
  const result: T[] = [];
  for (const item of items) {
    if (!item?.id) throw new Error(`${label} sem ID: ${JSON.stringify(item)}`);
    if (seen.has(item.id)) throw new Error(`ID duplicado em ${label}: ${item.id}`);
    seen.add(item.id);
    result.push(item);
  }
  return result;
}

export function buildCaptionCatalog(): CaptionCatalog {
  return {
    styles: uniqueById(STYLES, 'estilos de legenda'),
    animations: uniqueById(ANIMATIONS, 'animações de legenda')
  };
}

export const CAPTION_CATALOG = buildCaptionCatalog();
export const ALL_STYLES = CAPTION_CATALOG.styles;
export const ALL_ANIMATIONS = CAPTION_CATALOG.animations;
