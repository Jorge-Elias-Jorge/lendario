import React,{useEffect,useMemo,useRef,useState} from 'react';
import {useStore} from '../store';
import {formatTime} from '../core/srt';
import {compactTime,fixCueOverlaps,seekTime} from '../core/editorTimeline';
import {drawCaption} from '../core/captionRender';
import {loadCaptionFonts} from '../data/fonts';
import CaptionDesigner from './CaptionDesigner';
import CaptionLibrary from './CaptionLibrary';
import CaptionTimeline from './CaptionTimeline';
import SmartSync from './SmartSync';
import SrtImporter from './SrtImporter';
import ToolSheet from './ToolSheet';
import Icon,{type IconName} from './Icon';
type Tool='Texto'|'Estilos'|'Animações'|'Ritmo'|'Sincronizar'|'Importar SRT';
const tools:{name:Tool;icon:IconName}[]=[{name:'Texto',icon:'text'},{name:'Estilos',icon:'styles'},{name:'Animações',icon:'motion'},{name:'Ritmo',icon:'rhythm'},{name:'Sincronizar',icon:'sync'}];
export default function Editor({libraryOnly=false,source,thumbnail}:{libraryOnly?:boolean;source?:string;thumbnail?:string}){
 const s=useStore(),video=useRef<HTMLVideoElement>(null),canvas=useRef<HTMLCanvasElement>(null);
 const [time,setTime]=useState(libraryOnly?1.2:0),[duration,setDuration]=useState(0),[playing,setPlaying]=useState(false);
 const [tool,setTool]=useState<Tool|null>(null),[rate,setRate]=useState(1),[srtText,setSrtText]=useState('');
 const [dimensions,setDimensions]=useState({width:720,height:1280}),[mediaError,setMediaError]=useState('');
 const well=useRef<HTMLDivElement>(null),[available,setAvailable]=useState({width:600,height:320});
 const [demoPlaying,setDemoPlaying]=useState(true),[demoText,setDemoText]=useState('Cada palavra conta uma história');
 const demo=libraryOnly,selected=s.cues.find(c=>c.id===s.selectedCueId),demoTime=useRef(1.2);
 const activeCue=useMemo(()=>s.cues.filter(c=>time>=c.start&&time<c.end).sort((a,b)=>b.start-a.start),[s.cues,time]);
 const active=useMemo(()=>demo?{id:'demo',start:0,end:4.5,text:demoText}:activeCue[0],[demo,demoText,activeCue]);
 useEffect(()=>{
  let frame=0,last=performance.now();
  const tick=(now:number)=>{
   if(demo){if(demoPlaying){demoTime.current=(demoTime.current+(now-last)/1000)%4.5;setTime(demoTime.current);}}
   else if(video.current&&!video.current.paused)setTime(video.current.currentTime);
   last=now;frame=requestAnimationFrame(tick);
  };frame=requestAnimationFrame(tick);return()=>cancelAnimationFrame(frame);
 },[demo,demoPlaying]);
 useEffect(()=>{if(video.current)video.current.playbackRate=rate;},[rate,s.videoUrl]);
 useEffect(()=>{
  const el=well.current;if(!el)return;const resize=()=>setAvailable({width:Math.max(1,el.clientWidth),height:Math.max(1,el.clientHeight)});resize();
  if(typeof ResizeObserver==='undefined'){window.addEventListener('resize',resize);return()=>window.removeEventListener('resize',resize);}
  const observer=new ResizeObserver(resize);observer.observe(el);return()=>observer.disconnect();
 },[]);
 useEffect(()=>{
  let cancelled=false;
  const render=()=>{if(cancelled)return;const el=canvas.current,ctx=el?.getContext('2d');if(!el||!ctx)return;ctx.clearRect(0,0,el.width,el.height);if(active)drawCaption(ctx,active,s.style,time,el.width,el.height,{presentation:s.presentation,effectMs:s.effectMs});};
  render();void loadCaptionFonts().then(render);return()=>{cancelled=true;};
 },[active,s.style,s.presentation,s.effectMs,time,dimensions]);
 const seek=(value:number)=>{const t=seekTime(value,demo?4.5:duration);if(demo)demoTime.current=t;else if(video.current)video.current.currentTime=t;setTime(t);};
 const pause=()=>{if(demo)setDemoPlaying(false);else video.current?.pause();};
 const toggle=()=>{if(demo)setDemoPlaying(v=>!v);else if(video.current?.paused)void video.current.play().catch(()=>setMediaError('Não foi possível reproduzir este vídeo. Verifique o formato.'));else video.current?.pause();};
 const open=(next:Tool)=>{if(next==='Texto'&&!selected&&s.cues.length)s.select(s.cues[0].id);setTool(next);};
 const addCue=()=>{
  if(duration<=0)return;
  const start=Math.min(time,Math.max(0,duration-.5)),id=crypto.randomUUID();
  s.setCues([...s.cues,{id,start,end:Math.min(duration,start+3),text:'Nova legenda'}]);s.select(id);setTool('Texto');
 };
 const goCue=(delta:number)=>{const index=s.cues.findIndex(c=>c.id===s.selectedCueId),cue=s.cues[Math.max(0,Math.min(s.cues.length-1,index+delta))];if(cue){s.select(cue.id);seek(cue.start);}};
 return <main className={'editor workspace-editor '+(demo?'library-editor ':'')+(tool?'tool-open':'')}>
  <section className="preview-workspace" aria-label="Prévia do projeto">
   <div className="preview-meta"><span><span className="live-dot"/>{demo?'BIBLIOTECA AO VIVO':'PRÉVIA DO PROJETO'}</span><span>{dimensions.width} × {dimensions.height}</span></div>
   <div className="preview-well" ref={well}>
    <div className="stage" style={{width:Math.max(1,Math.min(available.width,available.height*dimensions.width/dimensions.height)),aspectRatio:dimensions.width+'/'+dimensions.height}}>
     {demo?<div className="demo-backdrop"><span className="demo-kicker">LEGENDÁRIO</span><div className="demo-rule"/><span className="demo-chapter">CADA PALAVRA CONTA</span><div className="demo-frame"/><span className="demo-footer">A sua história, em movimento.</span></div>:
      <video ref={video} src={s.videoUrl??undefined} poster={thumbnail} playsInline preload="auto"
       onLoadedMetadata={e=>{setDuration(Number.isFinite(e.currentTarget.duration)?e.currentTarget.duration:0);setDimensions({width:e.currentTarget.videoWidth||720,height:e.currentTarget.videoHeight||1280});setTime(e.currentTarget.currentTime);setMediaError('');}}
       onTimeUpdate={e=>setTime(e.currentTarget.currentTime)} onSeeked={e=>setTime(e.currentTarget.currentTime)}
       onPlay={()=>setPlaying(true)} onPause={()=>setPlaying(false)} onEnded={()=>setPlaying(false)}
       onError={()=>setMediaError('Este vídeo não pôde ser aberto. Volte e selecione novamente a mídia.')}/>}
     <canvas ref={canvas} className="live-caption-canvas" width={dimensions.width} height={dimensions.height} aria-label="Prévia renderizada das legendas"/>
    </div>
   </div>
   <div className="preview-caption"><span>{s.style.name}</span><span>{s.presentation}</span></div>
   {mediaError&&<p className="inline-notice error" role="alert">{mediaError}</p>}
   <div className="editor-transport"><span className="transport-time">{compactTime(time)}<small> / {compactTime(demo?4.5:duration)}</small></span>
    <div className="transport-actions"><button className="icon-button" aria-label="Recuar um segundo" onClick={()=>seek(time-1)}><Icon name="left" size={18}/></button><button className="play-control" aria-label={(demo?demoPlaying:playing)?'Pausar':'Reproduzir'} onClick={toggle}><Icon name={(demo?demoPlaying:playing)?'pause':'play'} size={19}/></button><button className="icon-button" aria-label="Avançar um segundo" onClick={()=>seek(time+1)}><Icon name="right" size={18}/></button></div>
    <button className="speed-button" onClick={()=>setTool('Ritmo')} aria-label="Ajustar ritmo e velocidade">{rate.toFixed(rate%1?2:0)}×</button>
   </div>
   <input className="preview-scrubber" aria-label="Posição no vídeo" type="range" min={0} max={demo?4.5:duration||1} step={.01} value={Math.min(time,demo?4.5:duration||1)} onChange={e=>seek(+e.target.value)}/>
  </section>
  <nav className="workspace-tools" aria-label="Ferramentas de legendas">{tools.filter(t=>!demo||t.name!=='Sincronizar').map(t=><button key={t.name} aria-pressed={tool===t.name} onClick={()=>open(t.name)}><Icon name={t.icon}/><span>{t.name}</span></button>)}</nav>
  {!demo&&<>
   {activeCue.length>1&&<div className="overlap-warning"><span>{activeCue.length} legendas sobrepostas neste ponto.</span><button onClick={()=>s.setCues(fixCueOverlaps(s.cues))}>Reorganizar tempos</button></div>}
   <CaptionTimeline time={time} duration={duration} playing={playing} onSeek={seek} onEdit={()=>{pause();setTool('Texto');}} thumbnail={thumbnail}/>
   <button className="srt-dock" onClick={()=>setTool('Importar SRT')}><span className="dock-icon"><Icon name="file"/></span><span><strong>{s.cues.length?'Gerir legendas SRT':'Importar legendas SRT'}</strong><small>{s.cues.length?`${s.cues.length} legendas no projeto · substituir ou adicionar`:'Escolha um arquivo ou cole o texto das legendas'}</small></span><Icon name={s.cues.length?'chevron':'plus'}/></button>
  </>}
  {demo&&<p className="workspace-hint">Experimente os botões acima. Esta biblioteca não altera os rascunhos.</p>}
  {tool&&<ToolSheet title={tool==='Texto'?'Editar legenda':tool} subtitle={tool==='Importar SRT'?'ARQUIVOS LOCAIS / LEGENDAS':'AJUSTES DO PROJETO'} onClose={()=>setTool(null)} wide={tool==='Estilos'||tool==='Animações'}>
   {tool==='Estilos'&&<><CaptionLibrary kind="styles"/><details className="advanced-look"><summary><Icon name="settings" size={17}/> Personalizar o estilo selecionado</summary><CaptionDesigner/></details></>}
   {tool==='Animações'&&<CaptionLibrary kind="animations"/>}
   {tool==='Importar SRT'&&<SrtImporter value={srtText} onChange={setSrtText} onApplied={cues=>{setTool(null);if(cues[0])seek(cues[0].start);}}/>}
   {tool==='Sincronizar'&&<SmartSync source={source} onSeek={t=>{seek(t);void video.current?.play().catch(()=>{});}}/>}
   {tool==='Texto'&&(demo?<><label>Texto de demonstração<textarea value={demoText} maxLength={280} onChange={e=>setDemoText(e.target.value)}/></label><CaptionDesigner/></>:selected?<div className="cue-editor"><div className="cue-nav"><span>Legenda {s.cues.findIndex(c=>c.id===selected.id)+1} de {s.cues.length}</span><button className="icon-button" aria-label="Legenda anterior" disabled={s.cues[0]?.id===selected.id} onClick={()=>goCue(-1)}><Icon name="left"/></button><button className="icon-button" aria-label="Legenda seguinte" disabled={s.cues[s.cues.length-1]?.id===selected.id} onClick={()=>goCue(1)}><Icon name="right"/></button></div><label>Texto da legenda<textarea rows={4} value={selected.text} onChange={e=>s.updateCue(selected.id,{text:e.target.value})}/></label><div className="field-row"><label>Início (s)<input type="number" step={.001} min={0} value={selected.start} onChange={e=>{const n=+e.target.value;if(Number.isFinite(n)&&n>=0&&n<selected.end)s.updateCue(selected.id,{start:n});}}/></label><label>Fim (s)<input type="number" step={.001} value={selected.end} onChange={e=>{const n=+e.target.value;if(Number.isFinite(n)&&n>selected.start)s.updateCue(selected.id,{end:n});}}/></label></div><p className="muted">Alterações são guardadas no rascunho. Editar texto ou tempos invalida o alinhamento por palavra desta legenda.</p><button className="secondary-button" onClick={addCue}><Icon name="plus" size={17}/> Nova legenda neste ponto</button></div>:<div className="sheet-empty"><Icon name="text" size={32}/><h3>A sua primeira legenda.</h3><p>Importe um SRT ou crie uma legenda no ponto atual do vídeo.</p><button onClick={addCue} disabled={!duration}><Icon name="plus" size={17}/> Adicionar legenda</button><button className="secondary-button" onClick={()=>setTool('Importar SRT')}>Importar SRT</button></div>)}
   {tool==='Ritmo'&&<div className="rhythm-controls"><p className="muted">Como cada frase aparece e acompanha o vídeo.</p><label>Apresentação<select value={s.presentation} onChange={e=>s.setPresentation(e.target.value as typeof s.presentation)}>{['Frase','Realce ativo','Palavra','Blocos'].map(m=><option key={m}>{m}</option>)}</select></label><label>Palavras por bloco <span>{s.style.blockSize??3}</span><input type="range" min={1} max={8} value={s.style.blockSize??3} onChange={e=>s.setStyle({...s.style,blockSize:+e.target.value})}/></label><label>Velocidade da prévia <span>{rate.toFixed(2)}×</span><input type="range" min={.5} max={2} step={.05} value={rate} onChange={e=>setRate(+e.target.value)}/></label><p className="inline-notice">A velocidade altera apenas a reprodução de prévia, não a exportação. Legendas sincronizadas usam os tempos por palavra; as restantes dividem a duração uniformemente.</p><small className="muted">Posição atual: {formatTime(time)}</small></div>}
  </ToolSheet>}
 </main>;
}
