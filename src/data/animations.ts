export interface SubtitleAnimation {
  id: string; name: string; type: string;
  mode: 'in'|'out'|'highlight'|'loop'|'word'|'char'|'line';
  duration: number; intensity: number;
}

const types = ['Fade','Zoom','Pop','Bounce','Slide','Typewriter','Reveal','Glow','Pulse','Shake','Glitch','Elastic','Mask','Rotate','Impact'];
const modes = ['in','out','highlight','loop','word','char','line'] as const;
const durations = [200, 300, 400, 500, 600];

export const ANIMATIONS: SubtitleAnimation[] = [];
let n = 0;
for (const t of types) {
  for (let i = 0; i < 8; i++) {
    n++;
    ANIMATIONS.push({
      id: `anim-${n}`,
      name: `${t} ${['Rápido','Suave','Forte','Lento','Neon','Cinematográfico','Viral','Premium'][i]}`,
      type: t,
      mode: modes[(n - 1) % modes.length],
      duration: durations[(n - 1) % durations.length],
      intensity: 0.5 + ((n - 1) % 5) * 0.1
    });
  }
}
export const ANIMATION_TYPES = types;