import React,{useState} from 'react';
import {useStore} from '../store';
import type {Cue} from '../core/srt';
import Icon from './Icon';

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

export default function SrtImporter({value,onChange,onApplied}:{value?:string;onChange?:(text:string)=>void;onApplied?:(cues:Cue[])=>void}={}){
 const s=useStore();
 const [localText,setLocalText]=useState(''),[message,setMessage]=useState(''),[filename,setFilename]=useState(''),[reading,setReading]=useState(false);
 const text=value??localText,setText=onChange??setLocalText;
 const read=async(file:File)=>{
  if(file.size>2_000_000){setMessage('Este arquivo excede 2 MB. Divida o SRT antes de importar.');return;}
  if(!file.name.toLowerCase().endsWith('.srt')&&file.type!=='text/plain'){setMessage('Selecione um arquivo .srt.');return;}
  setReading(true);setMessage('');
  try{setText(await file.text());setFilename(file.name);setMessage('Arquivo carregado. Reveja e escolha como aplicar.');}
  catch{setMessage('Não foi possível ler o arquivo. Escolha novamente no dispositivo.');}
  finally{setReading(false);}
 };
 const apply=(replace:boolean)=>{
  const parsed=parseSrtText(text);
  if(!parsed.length){setMessage('Não foi possível ler legendas válidas. Confirme o formato SRT.');return;}
  if(replace){if(s.cues.length&&!window.confirm('Substituir as legendas atuais pelas deste SRT? Os tempos do arquivo serão preservados.'))return;s.setCues(parsed);s.select(null);setMessage(`${parsed.length} legendas aplicadas.`);onApplied?.(parsed);}
  else{const base=Math.max(0,...s.cues.map(c=>c.end));const shifted=parsed.map(c=>({...c,id:crypto.randomUUID(),start:c.start+base,end:c.end+base}));const next=[...s.cues,...shifted];s.setCues(next);setMessage(`${parsed.length} legendas adicionadas após a última.`);onApplied?.(next);}
 };
 return <section className="srt-importer"><p className="muted">Importe o arquivo ou cole o texto. Preservamos os horários originais para você revisar e sincronizar com a voz.</p>
 <label className="srt-file-drop" onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();const file=e.dataTransfer.files[0];if(file)void read(file);}}><Icon name="upload" size={27}/><strong>{reading?'A ler arquivo…':filename||'Escolher arquivo .srt'}</strong><small>Do armazenamento local · até 2 MB</small><input className="visually-hidden" disabled={reading} type="file" accept=".srt,text/plain" aria-label="Importar arquivo SRT" onChange={e=>{const f=e.target.files?.[0];e.currentTarget.value='';if(f)void read(f);}}/></label>
 <div className="divider-label"><span/>ou cole o texto<span/></div>
 <label>Conteúdo SRT<textarea rows={7} value={text} onChange={e=>setText(e.target.value)} placeholder={'1\n00:00:01,000 --> 00:00:03,000\nO seu texto aqui'}/></label>
 <div className="srt-apply-actions"><button disabled={reading||!text.trim()} onClick={()=>apply(true)}><Icon name="check" size={16}/> Substituir legendas</button><button className="secondary-button" disabled={reading||!text.trim()} onClick={()=>apply(false)}>Adicionar ao fim</button><button className="text-button" onClick={()=>{setText('');setFilename('');setMessage('');}}>Limpar caixa</button></div>
 {message&&<p role="status">{message}</p>}</section>;
}
