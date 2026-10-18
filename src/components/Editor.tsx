import React,{useEffect,useMemo,useRef,useState} from 'react';
import {useStore} from '../store';
import {formatTime,type Cue} from '../core/srt';
import {drawCaption} from '../core/captionRender';
import {loadCaptionFonts} from '../data/fonts';
import CaptionDesigner from './CaptionDesigner';
import CaptionLibrary from './CaptionLibrary';
const fixOverlaps=(cues:Cue[])=>{let previous=0;return [...cues].sort((a,b)=>a.start-b.start).map(c=>{const start=Math.max(c.start,previous),end=Math.max(c.end,start+.2);previous=end;return{...c,start,end};});};
export default function Editor({libraryOnly=false}:{libraryOnly?:boolean}){
 const s=useStore(),video=useRef<HTMLVideoElement>(null),canvas=useRef<HTMLCanvasElement>(null);
 const [time,setTime]=useState(1.2),[duration,setDuration]=useState(0),[playing,setPlaying]=useState(false);
 const [tab,setTab]=useState(libraryOnly?'Estilos':'Texto'),[rate,setRate]=useState(1);
 const [dimensions,setDimensions]=useState({width:720,height:1280}),[viewport,setViewport]=useState(window.innerHeight);
 const [demoPlaying,setDemoPlaying]=useState(true),[demoText,setDemoText]=useState('Cada palavra conta uma história');
 const demo=libraryOnly||!s.videoUrl,selected=libraryOnly?undefined:s.cues.find(c=>c.id===s.selectedCueId);
 const demoTime=useRef(1.2);
 useEffect(()=>{
  let frame=0,last=performance.now();
  const tick=(now:number)=>{
   if(demo){if(demoPlaying){demoTime.current=(demoTime.current+(now-last)/1000)%5;setTime(demoTime.current);}}
   else if(video.current)setTime(video.current.currentTime);
   last=now;frame=requestAnimationFrame(tick);
  };
  frame=requestAnimationFrame(tick);return()=>cancelAnimationFrame(frame);
 },[demo,demoPlaying]);
 useEffect(()=>{const resize=()=>setViewport(window.innerHeight);window.addEventListener('resize',resize);return()=>window.removeEventListener('resize',resize);},[]);
 useEffect(()=>{if(video.current)video.current.playbackRate=rate;},[rate,s.videoUrl]);
 const hits=useMemo(()=>s.cues.filter(c=>time>=c.start&&time<c.end).sort((a,b)=>b.start-a.start),[s.cues,time]);
 const active=demo?{id:'demo',start:0,end:4.5,text:demoText}:hits[0];
 useEffect(()=>{
  let cancelled=false;
  const render=()=>{if(cancelled)return;const c=canvas.current,ctx=c?.getContext('2d');if(!c||!ctx)return;ctx.clearRect(0,0,c.width,c.height);if(active)drawCaption(ctx,active,s.style,time,c.width,c.height,{presentation:s.presentation,effectMs:s.effectMs});};
  render();void loadCaptionFonts().then(render);return()=>{cancelled=true;};
 },[active?.id,active?.text,s.style,s.presentation,s.effectMs,time,dimensions]);
 const seek=(t:number)=>{const value=Math.max(0,Math.min(demo?4.5:duration,t));if(demo){demoTime.current=value;setTime(value);}else if(video.current){video.current.currentTime=value;setTime(value);}};
 const ratio=dimensions.width/dimensions.height;
 return <div className={'editor '+(libraryOnly?'library-editor':'')}>
  <div className="studio-preview-head"><div><small className="eyebrow">{demo?'DEMONSTRAÇÃO AO VIVO':'PRÉVIA DO VÍDEO'}</small><p>{s.style.name}<span>{s.presentation}</span></p></div><button className="quiet-button" onClick={()=>{if(demo)setDemoPlaying(v=>!v);else if(video.current?.paused)void video.current.play().catch(()=>{});else video.current?.pause();}}>{(demo?demoPlaying:playing)?'Pausar':'Reproduzir'}</button></div>
  <div className="stage" style={{maxWidth:Math.min(720,viewport*.5*ratio)}}>
   <div className="stage-content" style={{paddingBottom:100/ratio+'%'}}>
    {demo?<div className="demo-backdrop"><span className="demo-kicker">LEGENDÁRIO</span><div className="demo-rule"/><span className="demo-chapter">01 / CADA PALAVRA CONTA</span><div className="demo-frame"/><span className="demo-footer">Texto editável · renderização local</span></div>:<video ref={video} src={s.videoUrl??undefined} playsInline onLoadedMetadata={e=>{setDuration(e.currentTarget.duration);setDimensions({width:e.currentTarget.videoWidth||720,height:e.currentTarget.videoHeight||1280});}} onPlay={()=>setPlaying(true)} onPause={()=>setPlaying(false)} onEnded={()=>setPlaying(false)}/>}
    <canvas ref={canvas} className="live-caption-canvas" width={dimensions.width} height={dimensions.height} aria-label="Prévia renderizada das legendas"/>
   </div>
  </div>
  <div className="transport"><button aria-label="Recuar um segundo" onClick={()=>seek(time-1)}>−1 s</button><small>{formatTime(time)} / {formatTime(demo?4.5:duration)}</small><button aria-label="Avançar um segundo" onClick={()=>seek(time+1)}>+1 s</button></div>
  <input aria-label="Posição no vídeo" type="range" min={0} max={demo?4.5:duration||1} step={.01} value={Math.min(time,demo?4.5:duration||1)} onChange={e=>seek(+e.target.value)}/>
  {!demo&&hits.length>1&&<div className="notice" role="alert"><p>{hits.length} legendas sobrepostas. A prévia mostra a mais recente.</p><button onClick={()=>s.setCues(fixOverlaps(s.cues))}>Corrigir sobreposições</button></div>}
  {!libraryOnly&&<div className="timeline">{s.cues.map(c=><button key={c.id} className={'cue '+(selected?.id===c.id?'selected':'')} style={{left:c.start/(duration||1)*100+'%',width:(c.end-c.start)/(duration||1)*100+'%'}} onClick={()=>{s.select(c.id);seek(c.start);}}>{c.text}</button>)}</div>}
  <nav className="tool-tabs" aria-label="Ferramentas de legendas">{['Texto','Estilos','Animações','Ritmo'].map(t=><button aria-pressed={tab===t} key={t} onClick={()=>setTab(t)}>{t}</button>)}</nav>
  <section className="panel studio-panel">
   {tab==='Texto'&&<><CaptionDesigner/>{demo&&<label>Texto de demonstração<textarea value={demoText} maxLength={280} onChange={e=>setDemoText(e.target.value)}/></label>}{selected&&<div className="cue-editor"><h3>Legenda selecionada</h3><textarea value={selected.text} onChange={e=>s.updateCue(selected.id,{text:e.target.value})}/><div className="row"><label>Início (s)<input type="number" step={.001} min={0} value={selected.start} onChange={e=>{const v=+e.target.value;if(v>=0&&v<selected.end)s.updateCue(selected.id,{start:v});}}/></label><label>Fim (s)<input type="number" step={.001} value={selected.end} onChange={e=>{const v=+e.target.value;if(v>selected.start)s.updateCue(selected.id,{end:v});}}/></label></div></div>}</>}
   {tab==='Estilos'&&<CaptionLibrary kind="styles"/>}
   {tab==='Animações'&&<CaptionLibrary kind="animations"/>}
   {tab==='Ritmo'&&<><h3>Ritmo e apresentação</h3><label>Apresentação<select value={s.presentation} onChange={e=>s.setPresentation(e.target.value as typeof s.presentation)}>{['Frase','Realce ativo','Palavra','Blocos'].map(m=><option key={m}>{m}</option>)}</select></label><label>Palavras por bloco: {s.style.blockSize??3}<input type="range" min={1} max={8} value={s.style.blockSize??3} onChange={e=>s.setStyle({...s.style,blockSize:+e.target.value})}/></label><label>Velocidade da prévia: {rate.toFixed(2)}×<input type="range" min={.5} max={2} step={.05} value={rate} onChange={e=>setRate(+e.target.value)}/></label><p>Os tempos por palavra e letra são estimados uniformemente dentro de cada legenda. Não há alinhamento acústico automático nem transcrição de áudio nesta alteração.</p>{demo&&<label>Texto de demonstração<textarea value={demoText} onChange={e=>setDemoText(e.target.value)} maxLength={280}/></label>}</>}
  </section>
 </div>;
}
