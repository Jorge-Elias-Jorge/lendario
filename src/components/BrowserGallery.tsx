import React,{useEffect,useRef,useState} from 'react';
import Icon from './Icon';
import {compactTime} from '../core/editorTimeline';
export default function BrowserGallery({onChoose}:{onChoose:(file:File,thumbnail?:string)=>Promise<void>}){
 const [selected,setSelected]=useState<File|null>(null),[url,setUrl]=useState(''),[duration,setDuration]=useState(0),[poster,setPoster]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 const input=useRef<HTMLInputElement>(null),video=useRef<HTMLVideoElement>(null),locked=useRef(false);
 useEffect(()=>{if(!selected)return;const src=URL.createObjectURL(selected);setUrl(src);return()=>URL.revokeObjectURL(src);},[selected]);
 const choose=(file:File)=>{
  if(!file.type.startsWith('video/')){setError('Selecione um arquivo de vídeo.');return;}
  setError('');setPoster('');setDuration(0);setSelected(file);
 };
 const confirm=async()=>{if(!selected||locked.current)return;locked.current=true;setBusy(true);try{await onChoose(selected,poster||undefined);}catch(e){setError(String(e));}finally{locked.current=false;setBusy(false);}};
 return <section className="browser-gallery">
  <input ref={input} className="visually-hidden" type="file" accept="video/*" aria-label="Escolher vídeo do dispositivo" onChange={e=>{const file=e.target.files?.[0];e.currentTarget.value='';if(file)choose(file);}}/>
  {!selected?<div className="permission-card" onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();const file=e.dataTransfer.files[0];if(file)choose(file);}}><span className="large-icon"><Icon name="folder" size={30}/></span><h2>Escolha o próximo vídeo.</h2><p>Abra um vídeo do armazenamento local. Vamos reproduzi-lo antes de entrar no editor.</p><button onClick={()=>input.current?.click()}><Icon name="plus" size={18}/> Escolher vídeo</button><small>No navegador, só conseguimos abrir os arquivos que você selecionar.</small></div>:
   <div className="media-confirm"><div className="confirm-video"><video ref={video} src={url||undefined} controls playsInline preload="auto" onLoadedMetadata={e=>setDuration(e.currentTarget.duration)} onLoadedData={e=>{
    try{const v=e.currentTarget,c=document.createElement('canvas'),ratio=256/Math.max(v.videoWidth,v.videoHeight);c.width=Math.max(1,Math.round(v.videoWidth*ratio));c.height=Math.max(1,Math.round(v.videoHeight*ratio));c.getContext('2d')?.drawImage(v,0,0,c.width,c.height);setPoster(c.toDataURL('image/jpeg',.75));}catch{/* A poster failure must not prevent local video import. */}
   }} onError={()=>setError('Não foi possível reproduzir este vídeo. Escolha um formato compatível.')}/></div><div className="confirm-details"><span className="section-kicker">CONFIRME A SUA MÍDIA</span><h2>{selected.name}</h2><p>{compactTime(duration)} · {(selected.size/1048576).toFixed(1)} MB</p><p className="muted">Reproduza para confirmar. Só importamos quando escolher “Usar este vídeo”.</p><div className="confirm-actions"><button disabled={busy||!duration||!!error} onClick={()=>void confirm()}><Icon name="check" size={18}/>{busy?'A importar…':'Usar este vídeo'}</button><button className="secondary-button" disabled={busy} onClick={()=>{setSelected(null);setError('');}}>Escolher outro vídeo</button></div></div></div>}
  {error&&<p className="inline-notice error" role="alert">{error}</p>}
 </section>;
}
