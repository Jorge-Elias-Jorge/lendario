import React,{useEffect,useRef,useState} from 'react';
import type {PluginListenerHandle} from '@capacitor/core';
import {useStore} from '../store';
import {formatTime,serializeSRT,type Cue} from '../core/srt';
import {applyProposals,restoreTimings,type SyncProposal} from '../core/alignment';
import {nativeAndroid} from '../native/media';
import {Speech,saveSrtFile} from '../native/speech';
import './smartSync.css';

export default function SmartSync({source,onSeek}:{source?:string;onSeek:(time:number)=>void}){
 const cues=useStore(s=>s.cues),setCues=useStore(s=>s.setCues);
 const [phase,setPhase]=useState<'idle'|'audio'|'matching'|'done'>('idle'),[progress,setProgress]=useState(0);
 const [message,setMessage]=useState(''),[proposals,setProposals]=useState<SyncProposal[]>([]);
 const [selected,setSelected]=useState<Set<string>>(new Set()),[filter,setFilter]=useState('all');
 const worker=useRef<Worker|null>(null),listener=useRef<PluginListenerHandle|null>(null),request=useRef('');
 const rejectWorker=useRef<((error:Error)=>void)|null>(null);
 const base=useRef<Cue[]|null>(null),alive=useRef(true),cancelled=useRef(false);
 const busy=phase==='audio'||phase==='matching',stale=!!base.current&&JSON.stringify(base.current)!==JSON.stringify(cues);
 useEffect(()=>{alive.current=true;return()=>{
  alive.current=false;cancelled.current=true;worker.current?.terminate();void listener.current?.remove();
  rejectWorker.current?.(new Error('Comparação cancelada.'));rejectWorker.current=null;
  if(request.current)void Speech.cancel().catch(()=>{});
 };},[]);
 const cancel=async()=>{
  cancelled.current=true;worker.current?.terminate();worker.current=null;
  if(phase==='audio'){setMessage('A cancelar e libertar o modelo…');await Speech.cancel().catch(()=>{});}
  else{rejectWorker.current?.(new Error('Comparação cancelada. Nenhuma legenda foi alterada.'));rejectWorker.current=null;}
 };
 const analyze=async()=>{
  if(!nativeAndroid||!source||!cues.length)return;
  cancelled.current=false;base.current=structuredClone(cues);request.current=crypto.randomUUID();
  setProposals([]);setSelected(new Set());setProgress(0);setPhase('audio');setMessage('A preparar a análise local…');
  try{
   const id=request.current;
   listener.current=await Speech.addListener('speechProgress',e=>{if(alive.current&&e.requestId===id){setProgress(e.fraction);setMessage(e.stage);}});
   if(!alive.current)return;
   const result=await Speech.analyze({source,requestId:id});
   if(!alive.current)return;
   if(cancelled.current)throw new Error('Análise cancelada. Nenhuma legenda foi alterada.');
   if(!result.words.length)throw new Error('Nenhuma palavra foi reconhecida. Verifique se há narração clara em português.');
   setPhase('matching');setMessage('A localizar o texto do SRT nas palavras reconhecidas…');
   await new Promise<void>((resolve,reject)=>{
    rejectWorker.current=reject;
    const w=new Worker(new URL('../core/alignment.worker.ts',import.meta.url),{type:'module'});worker.current=w;
    w.onmessage=e=>{
     w.terminate();worker.current=null;
     if(!alive.current||cancelled.current){resolve();return;}
     if(e.data.error){reject(new Error(e.data.error));return;}
     const found=e.data.proposals as SyncProposal[];setProposals(found);
     setSelected(new Set(found.filter(p=>p.status==='ready').map(p=>p.id)));
     setPhase('done');setMessage('Análise concluída. Ouça as propostas antes de aplicar. O índice é uma heurística, não uma garantia de precisão.');resolve();
    };
    w.onerror=()=>{w.terminate();worker.current=null;reject(new Error('Não foi possível concluir a comparação. Tente um vídeo menor.'));};
    w.postMessage({cues:base.current,words:result.words,duration:result.duration});
   });
  }catch(e){if(alive.current){setPhase('idle');setMessage(e instanceof Error?e.message:String(e));}}
  finally{rejectWorker.current=null;await listener.current?.remove().catch(()=>{});listener.current=null;request.current='';}
 };
 const apply=()=>{
  try{setCues(applyProposals(cues,proposals,selected));setMessage('Tempos aplicados. O original está preservado no rascunho; ouça a prévia e exporte quando estiver satisfeito.');setProposals([]);base.current=null;setSelected(new Set());}
  catch(e){setMessage(e instanceof Error?e.message:String(e));}
 };
 const save=async(original=false)=>{try{await saveSrtFile(serializeSRT(cues,original),original);setMessage('SRT preparado para guardar no dispositivo.');}catch(e){setMessage(String(e));}};
 const ready=proposals.filter(p=>p.status==='ready').length,review=proposals.filter(p=>p.status==='review').length;
 const visible=proposals.filter(p=>filter==='all'||p.status===filter);
 return <div className="smart-sync">
  <div className="sync-heading"><div><small className="eyebrow">SINCRONIZAÇÃO INTELIGENTE / BETA</small><h2>O texto acompanha a voz.</h2><p>Compare a narração com o SRT e reveja os tempos sugeridos. O texto das legendas não é reescrito.</p></div><span className="sync-local">Local · Português</span></div>
  <div className="sync-method"><strong>Reconhecimento de fala + comparação de palavras</strong><p>Primeira versão com modelo Vosk leve incluído no APK. Não é alinhamento fonético forçado nem precisão certificada. Música, sotaques e frases diferentes podem exigir ajuste manual.</p></div>
  {!nativeAndroid&&<p className="sync-notice">A análise do áudio está disponível no APK Android, sem internet. O navegador permite revisar tempos já guardados e exportar SRT; não simula reconhecimento.</p>}
  {!cues.length&&<p className="sync-notice">Importe e aplique um SRT para começar.</p>}
  <div className="sync-actions">
   <button disabled={busy||!nativeAndroid||!source||!cues.length} onClick={()=>void analyze()}>{busy?'Análise em andamento…':'Analisar áudio e SRT'}</button>
   {busy&&<button className="quiet-button" onClick={()=>void cancel()}>Cancelar análise</button>}
   <button className="quiet-button" disabled={busy||!cues.length} onClick={()=>void save()}>Guardar SRT atual</button>
   {cues.some(c=>c.originalTiming)&&<><button className="quiet-button" disabled={busy} onClick={()=>void save(true)}>Guardar SRT original</button><button className="quiet-button" disabled={busy} onClick={()=>{setCues(restoreTimings(cues));setProposals([]);base.current=null;setMessage('Tempos anteriores restaurados. O texto atual foi mantido.');}}>Restaurar tempos anteriores</button></>}
  </div>
  {busy&&<progress max={1} value={phase==='matching'?1:progress} aria-label="Progresso da análise de áudio"/>}
  {message&&<p role="status" className="sync-message">{message}</p>}
  {proposals.length>0&&<>
   <div className="sync-summary"><span><b>{ready}</b> prontas para ouvir</span><span><b>{review}</b> precisam de revisão</span><span><b>{proposals.length-ready-review}</b> não localizadas</span></div>
   {stale&&<p className="sync-notice" role="alert">As legendas mudaram desde a análise. Analise novamente antes de aplicar.</p>}
   <div className="sync-actions"><label>Mostrar propostas<select value={filter} onChange={e=>setFilter(e.target.value)}><option value="all">Todas</option><option value="ready">Prontas para ouvir</option><option value="review">Revisão necessária</option><option value="unmatched">Não localizadas</option></select></label><button disabled={!selected.size||stale||busy} onClick={apply}>Aplicar {selected.size} selecionadas</button></div>
   <div className="sync-results">{visible.map(p=><article key={p.id} className={'sync-result '+p.status}>
    <label className="sync-select"><input type="checkbox" aria-label={'Selecionar '+p.original.text} checked={selected.has(p.id)} disabled={p.status!=='ready'||stale} onChange={e=>setSelected(old=>{const next=new Set(old);if(e.target.checked)next.add(p.id);else next.delete(p.id);return next;})}/><strong>{p.original.text}</strong></label>
    <span className="sync-badge">{p.status==='ready'?'Pronta para ouvir':p.status==='review'?'Revisar':'Não localizada'}</span>
    <div className="sync-times"><div><small>SRT ORIGINAL</small><span>{formatTime(p.original.start)} → {formatTime(p.original.end)}</span></div><div><small>PROPOSTA</small><span>{p.start===undefined?'Sem alteração segura':`${formatTime(p.start)} → ${formatTime(p.end!)}`}</span></div></div>
    <p>{p.reason}</p>
    {p.start!==undefined&&<div className="sync-actions"><button className="quiet-button" onClick={()=>onSeek(Math.max(0,p.start!-.35))}>Ouvir posição sugerida</button><span>{p.start<p.original.start?'Antecipar':'Adiar'} {Math.abs(p.start-p.original.start).toFixed(2)} s · correspondência {Math.round(p.coverage*100)}%</span></div>}
   </article>)}</div>
  </>}
 </div>;
}
