import type { SubtitleStyle } from '../styles';

const base: Partial<SubtitleStyle> = {
  fontSize: 44,
  posY: 78,
  fontWeight: 800,
  align: 'center',
  maxLines: 2
};

export const STYLE_GROUPS: Record<string, SubtitleStyle[]> = {
  Minimalistas: [
    { id: 'branco-simples', name: 'Branco simples', category: 'Minimalistas', color: '#FFFFFF', highlightColor: '#FFFFFF', ...base, defaultMotion: 'Sem animação' },
    { id: 'branco-sombra', name: 'Branco com sombra', category: 'Minimalistas', color: '#FFFFFF', highlightColor: '#FFFFFF', ...base, shadow: true, defaultMotion: 'Sem animação' },
    { id: 'preto-elegante', name: 'Preto elegante', category: 'Minimalistas', color: '#111111', highlightColor: '#111111', ...base, outlineColor: '#FFFFFF', outlineWidth: 2, defaultMotion: 'Sem animação' }
  ],
  Impacto: [
    { id: 'impacto', name: 'Impacto', category: 'Impacto', color: '#FFFFFF', highlightColor: '#FFE600', ...base, outlineColor: '#000000', outlineWidth: 5, glow: '#FF3B3B', uppercase: true, defaultMotion: 'Zoom viral' },
    { id: 'impacto-vermelho', name: 'Impacto vermelho', category: 'Impacto', color: '#FF3B3B', highlightColor: '#FFFFFF', ...base, outlineColor: '#000000', outlineWidth: 5, glow: '#FF3B3B', uppercase: true, defaultMotion: 'Pular' },
    { id: 'impacto-amarelo', name: 'Impacto amarelo', category: 'Impacto', color: '#FFE600', highlightColor: '#FFFFFF', ...base, outlineColor: '#000000', outlineWidth: 5, glow: '#FFE600', uppercase: true, defaultMotion: 'Bounce' }
  ],
  'Contorno forte': [
    { id: 'amarelo-contorno', name: 'Amarelo com contorno preto', category: 'Contorno forte', color: '#FFD400', highlightColor: '#FFD400', ...base, outlineColor: '#000000', outlineWidth: 4, defaultMotion: 'Pulsar' }
  ],
  Virais: [
    { id: 'amarelo-viral', name: 'Amarelo viral', category: 'Virais', color: '#FFE600', highlightColor: '#FFE600', ...base, outlineColor: '#000000', outlineWidth: 5, glow: '#FFD400', defaultMotion: 'Zoom viral', uppercase: true },
    { id: 'vermelho-pop', name: 'Vermelho pop', category: 'Virais', color: '#FF3B3B', highlightColor: '#FFD400', ...base, outlineColor: '#000000', outlineWidth: 4, defaultMotion: 'Bounce', uppercase: true },
    { id: 'verde-viral', name: 'Verde viral', category: 'Virais', color: '#7CFF6B', highlightColor: '#FFFFFF', ...base, outlineColor: '#003300', outlineWidth: 4, glow: '#7CFF6B', defaultMotion: 'Saltar', uppercase: true },
    { id: 'azul-viral', name: 'Azul viral', category: 'Virais', color: '#4FC3FF', highlightColor: '#FFFFFF', ...base, outlineColor: '#001B33', outlineWidth: 4, glow: '#4FC3FF', defaultMotion: 'Pular', uppercase: true },
    { id: 'laranja-viral', name: 'Laranja viral', category: 'Virais', color: '#FF7A00', highlightColor: '#FFE600', ...base, outlineColor: '#000000', outlineWidth: 4, glow: '#FF7A00', defaultMotion: 'Zoom viral', uppercase: true }
  ],
  'Neon e luzes': [
    { id: 'neon-rosa', name: 'Neon rosa', category: 'Neon e luzes', color: '#FF4FD8', highlightColor: '#FFFFFF', ...base, glow: '#FF4FD8', defaultMotion: 'Neon' },
    { id: 'neon-azul', name: 'Neon azul', category: 'Neon e luzes', color: '#4FC3FF', highlightColor: '#FFFFFF', ...base, glow: '#4FC3FF', defaultMotion: 'Neon' },
    { id: 'neon-verde', name: 'Neon verde', category: 'Neon e luzes', color: '#7CFF6B', highlightColor: '#FFFFFF', ...base, glow: '#7CFF6B', defaultMotion: 'Neon' },
    { id: 'neon-roxo', name: 'Neon roxo', category: 'Neon e luzes', color: '#B14CFF', highlightColor: '#FFFFFF', ...base, glow: '#B14CFF', defaultMotion: 'Neon' },
    { id: 'luz-dourada', name: 'Luz dourada', category: 'Neon e luzes', color: '#FFD86B', highlightColor: '#FFFFFF', ...base, glow: '#FFB300', defaultMotion: 'Pulsar' },
    { id: 'branco-glow', name: 'Branco com luz', category: 'Neon e luzes', color: '#FFFFFF', highlightColor: '#FFFFFF', ...base, glow: '#FFFFFF', defaultMotion: 'Pulsar' },
    { id: 'amarelo-neon', name: 'Amarelo neon', category: 'Neon e luzes', color: '#FFE600', highlightColor: '#FFFFFF', ...base, glow: '#FFE600', defaultMotion: 'Neon' },
    { id: 'verde-neon', name: 'Verde neon', category: 'Neon e luzes', color: '#7CFF6B', highlightColor: '#FFFFFF', ...base, glow: '#7CFF6B', defaultMotion: 'Neon' }
  ],
  Karaoke: [
    { id: 'karaoke-amarelo', name: 'Karaoke amarelo', category: 'Karaoke', color: '#FFFFFF', highlightColor: '#FFD400', ...base, outlineColor: '#000000', outlineWidth: 3, defaultMotion: 'Saltar' },
    { id: 'karaoke-verde', name: 'Karaoke verde', category: 'Karaoke', color: '#FFFFFF', highlightColor: '#7CFF6B', ...base, outlineColor: '#000000', outlineWidth: 3, defaultMotion: 'Saltar' },
    { id: 'karaoke-rosa', name: 'Karaoke rosa', category: 'Karaoke', color: '#FFFFFF', highlightColor: '#FF4FD8', ...base, outlineColor: '#000000', outlineWidth: 3, defaultMotion: 'Saltar' },
    { id: 'branco-karaoke', name: 'Branco karaoke', category: 'Karaoke', color: '#FFFFFF', highlightColor: '#4FC3FF', ...base, shadow: true, defaultMotion: 'Saltar' }
  ],
  Gradientes: [
    { id: 'gradiente-sol', name: 'Gradiente pôr do sol', category: 'Gradientes', color: '#FFFFFF', highlightColor: '#FFFFFF', gradient: 'linear-gradient(90deg,#FF9A3D,#FF3D77)', ...base, defaultMotion: 'Aproximar' },
    { id: 'gradiente-oceano', name: 'Gradiente oceano', category: 'Gradientes', color: '#FFFFFF', highlightColor: '#FFFFFF', gradient: 'linear-gradient(90deg,#3DDCFF,#3D6BFF)', ...base, defaultMotion: 'Aproximar' },
    { id: 'gradiente-roxo', name: 'Gradiente roxo', category: 'Gradientes', color: '#FFFFFF', highlightColor: '#FFFFFF', gradient: 'linear-gradient(90deg,#B14CFF,#FF4FD8)', ...base, defaultMotion: 'Aproximar' }
  ],
  Cinema: [
    { id: 'cinema-branco', name: 'Cinema branco', category: 'Cinema', color: '#F5F5F5', highlightColor: '#F5F5F5', ...base, shadow: true, defaultMotion: 'Deslizar' },
    { id: 'cinema-dourado', name: 'Cinema dourado', category: 'Cinema', color: '#E8C877', highlightColor: '#E8C877', ...base, shadow: true, defaultMotion: 'Revelar' }
  ],
  Glitch: [
    { id: 'glitch-roxo', name: 'Glitch roxo', category: 'Glitch', color: '#E6D5FF', highlightColor: '#B14CFF', ...base, glow: '#B14CFF', defaultMotion: 'Glitch', uppercase: true },
    { id: 'glitch-verde', name: 'Glitch verde', category: 'Glitch', color: '#D9FFE3', highlightColor: '#7CFF6B', ...base, glow: '#7CFF6B', defaultMotion: 'Glitch', uppercase: true }
  ],
  '3D': [
    { id: '3d-vermelho', name: '3D vermelho', category: '3D', color: '#FF5252', highlightColor: '#FFD400', ...base, outlineColor: '#7A0000', outlineWidth: 4, defaultMotion: 'Pular' },
    { id: '3d-azul', name: '3D azul', category: '3D', color: '#4FC3FF', highlightColor: '#FFFFFF', ...base, outlineColor: '#00284D', outlineWidth: 4, defaultMotion: 'Pular' }
  ]
};

export const STYLES: SubtitleStyle[] = Object.values(STYLE_GROUPS).flat();
export const STYLE_CATEGORIES = Object.keys(STYLE_GROUPS);
