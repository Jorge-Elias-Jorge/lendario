export interface WordTiming {text:string;start:number;end:number;confidence:number}
export interface Cue {
 id:string;start:number;end:number;text:string;
 words?:WordTiming[];
 alignment?:{engine:string;score:number};
 originalTiming?:{start:number;end:number;text:string;words?:WordTiming[]};
}

export function parseTime(ts: string): number {
  const m = ts.trim().match(/^(\d{1,2}):(\d{2}):(\d{2})[,.](\d{1,3})$/);
  if (!m) throw new Error(`Timestamp inválido: ${ts}`);
  return (+m[1]) * 3600 + (+m[2]) * 60 + (+m[3]) + (+m[4].padEnd(3, '0')) / 1000;
}

export function formatTime(s: number): string {
  const total=Math.max(0,Math.round(s*1000));
  const h = Math.floor(total/3600000), m = Math.floor(total/60000)%60, sec = Math.floor(total/1000)%60, ms = total%1000;
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')},${String(ms).padStart(3,'0')}`;
}

export function serializeSRT(cues:Cue[],original=false):string{
 return cues.map((cue,i)=>{
  const c=original&&cue.originalTiming?cue.originalTiming:cue;
  return `${i+1}\n${formatTime(c.start)} --> ${formatTime(c.end)}\n${c.text}`;
 }).join('\n\n')+'\n';
}

export interface ParseResult { cues: Cue[]; errors: string[]; }

export function parseSRT(input: string): ParseResult {
  const errors: string[] = [];
  const cues: Cue[] = [];
  const blocks = input.replace(/\r\n/g, '\n').trim().split(/\n\s*\n/);
  blocks.forEach((block, i) => {
    const lines = block.split('\n').filter(l => l.trim() !== '');
    if (lines.length < 2) { errors.push(`Bloco ${i + 1}: incompleto.`); return; }
    let idx = 0;
    if (/^\d+$/.test(lines[0].trim())) idx = 1;
    const timeLine = lines[idx];
    const tm = timeLine.match(/(.+?)\s*-->\s*(.+)/);
    if (!tm) { errors.push(`Bloco ${i + 1}: linha de tempo inválida.`); return; }
    try {
      const start = parseTime(tm[1]);
      const end = parseTime(tm[2]);
      const text = lines.slice(idx + 1).join('\n');
      if (!text) errors.push(`Bloco ${i + 1}: sem texto.`);
      if (end <= start) errors.push(`Bloco ${i + 1}: fim anterior ao início.`);
      cues.push({ id: `cue-${i}-${Date.now()}`, start, end, text });
    } catch (e) { errors.push(`Bloco ${i + 1}: ${(e as Error).message}`); }
  });
  return { cues, errors };
}
