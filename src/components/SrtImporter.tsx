import React,{useState} from 'react';
import {useStore} from '../store';
import type {Cue} from '../core/srt';

const toSeconds=(v:string)=>{const m=v.trim().match(/(\d+):(\d+):(\d+)[,.](\d+)/);if(!m)return null;return +m[1]*3600+ +m[2]*60+ +m[3]+ +m[4].padEnd(3,'0').slice(0,3)/1000;};

export function parseSrtText(raw:string):Cue[]{
 const cues:Cue[]=[];
 for(const block of raw.replace(/\r/g,'').split(/\n\s*\n/)){
  const lines=block.split('\n').filter(l=>l.trim()!=='');
  if(!lines.length)continue;
  let i=0;
  if(/^\d+$/.test(lines[0].trim()))i=1;
  const times=lines[i]?.match(/(\d+:\d+:\d+[,.]\d+)\s*-->\s*(\d+:\d+:\d+[,.]\d+)/);
  if(!times)continue;
  const start=toSeconds(times[1]),end=toSeconds(times[2]);
  const text=lines.slice(i+1).join(' ').trim();
  if(start!==null&&end!==null&&text&&end>start)cues.push({id:crypto.randomUUID(),start,end,text});
 }
 // Preserve SRT sequence and times, including overlaps, for acoustic comparison.
 return cues;
}

export default function SrtImporter(){
 const s=useStore();
 const [text,setText]=useState(''),[message,setMessage]=useState('');
 const apply=(replace:boolean)=>{
  const parsed=parseSrtText(text);
  if(!parsed.length){setMessage('Não foi possível ler legendas válidas. Confirme o formato SRT.');return;}
  if(replace){s.setCues(parsed);s.select(null);setMessage(`${parsed.length} legendas aplicadas. Tempos originais preservados para sincronização e revisão.`);}
  else{const base=Math.max(0,...s.cues.map(c=>c.end));const shifted=parsed.map(c=>({...c,id:crypto.randomUUID(),start:c.start+base,end:c.end+base}));s.setCues([...s.cues,...shifted]);setMessage(`${parsed.length} legendas adicionadas após a última.`);}
 };
 return <section className="panel"><h3>Texto SRT</h3><p>“Substituir legendas” preserva os tempos do arquivo. Use Sincronizar para analisar a fala e propor correções.</p>
 <textarea rows={8} value={text} onChange={e=>setText(e.target.value)} placeholder={'1\n00:00:01,000 --> 00:00:03,000\nO seu texto aqui'}/>
 <div className="row"><button onClick={()=>apply(true)}>Substituir legendas</button><button onClick={()=>apply(false)}>Adicionar ao fim</button><button onClick={()=>{setText('');setMessage('')}}>Limpar caixa</button></div>
 <label className="filebtn">Importar ficheiro .srt<input hidden type="file" accept=".srt,text/plain" onChange={e=>{const f=e.target.files?.[0];if(!f)return;f.text().then(t=>{setText(t);setMessage('Ficheiro carregado. Toque em “Substituir legendas”.');});}}/></label>
 {message&&<p role="status">{message}</p>}</section>;
}
