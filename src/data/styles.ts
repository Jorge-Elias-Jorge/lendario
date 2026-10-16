export interface SubtitleStyle {
  id: string; name: string; category: string;
  fontFamily: string; fontSize: number; weight: number;
  color: string; outlineColor: string; outlineWidth: number;
  shadow: number; background: string | null; align: 'left'|'center'|'right';
  posY: number; highlight: 'none'|'word'|'progressive'|'color';
  highlightColor: string;
}

const categories = [
  'Legendas virais para Shorts','Estilos de podcasts','Legendas cinematográficas','Estilos documentais',
  'Legendas de suspense e mistério','Estilos de gaming','Legendas educativas','Estilos de notícias',
  'Legendas minimalistas','Estilos de alto contraste','Legendas com palavras destacadas','Estilos multicoloridos',
  'Legendas com caixas e fundos','Estilos de impacto','Legendas para entrevistas','Narrativas de engenharia e ciência',
  'Vídeos motivacionais','Estilos elegantes e premium','Realce progressivo','Estilos experimentais e artísticos'
];

const fonts = ['Arial Black','Impact','Verdana','Georgia','Courier New','Trebuchet MS'];
const colors = ['#FFFFFF','#FFD700','#00E5FF','#FF3D00','#7CFF00','#FF4081','#FFFFFF','#E0E0E0'];
const outlines = ['#000000','#1A1A1A','#003366','#4A0000','#003300'];
const bgs = [null,'rgba(0,0,0,0.6)','rgba(255,255,255,0.85)','rgba(20,20,20,0.8)','rgba(0,0,0,0.35)'];
const highlights = ['none','word','progressive','color'] as const;
const weights = [400, 700, 900];

export const STYLES: SubtitleStyle[] = [];
let n = 0;
for (let c = 0; c < categories.length; c++) {
  for (let i = 0; i < 11; i++) {
    n++;
    STYLES.push({
      id: `style-${n}`,
      name: `${categories[c]} ${i + 1}`,
      category: categories[c],
      fontFamily: fonts[(c + i) % fonts.length],
      fontSize: 22 + ((c * 3 + i * 2) % 26),
      weight: weights[(c + i) % weights.length],
      color: colors[(c * 2 + i) % colors.length],
      outlineColor: outlines[(c + i) % outlines.length],
      outlineWidth: (i % 4),
      shadow: (c + i) % 3,
      background: bgs[(c + i) % bgs.length],
      align: (['center','left','right'] as const)[(c + i) % 3],
      posY: 60 + ((c + i) % 30),
      highlight: highlights[(c + i) % highlights.length],
      highlightColor: colors[(c * 3 + i + 2) % colors.length]
    });
  }
}
export const STYLE_CATEGORIES = categories;