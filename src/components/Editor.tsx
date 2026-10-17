import React,{useEffect,useMemo,useRef,useState} from 'react';
import {useStore} from '../store';
import {STYLES,STYLE_GROUPS,STYLE_CATEGORIES} from '../data/styles';
import {ANIMATIONS,ANIMATION_GROUPS,ANIMATION_CATEGORIES} from '../data/animations';
import {formatTime,type Cue} from '../core/srt';
import {wrapText} from '../core/wrap';
import CaptionDesigner,{lookPaint,MOTIONS,Look} from './CaptionDesigner';

const fixOverlaps=(cues:Cue[])=>{const sorted=[...cues].sort((a,b)=>a.start-b.start);let previous=0;return sorted.map(c=>{const start=Math.max(c.start,previous);const end=Math.max(c.end,start+0.2);previous=end;return {...c,start,end};});};
const easeOut=(t:number)=>1-Math.pow(1-Math.min(1,Math.max(0,t)),3);
const motionFromType=(t:string)=>{switch(t){case 'Zoom':return 'Aproximar';case 'Pop':return 'Pular';case 'Bounce':return 'Bounce';case 'Slide':return 'Deslizar';case 'Typewriter':case 'Reveal':case 'Mask':return 'Revelar';case 'Glow':return 'Neon';case 'Pulse':return 'Pulsar';case 'Shake':return 'Tremer';case 'Glitch':return 'Glitch';case 'Elastic':return 'Elasticidade';case 'Rotate':return 'Girar';case 'Impact':return 'Zoom viral';default:return 'Saltar';}};

export default function Editor(){
 const s=useStore();const st=s.style as Look;
 const video=useRef<HTMLVideoElement>(null);
 const [time,setTime]=useState(0),[duration,setDuration]=useState(0);
 const [tab,setTab]=useState('Texto'),[query,setQuery]=useState('');
 const [x,setX]=useState(50);
 const [group,setGroup]=useState(3);
 const [rate,setRate]=useState(1);
 const [playing,setPlaying]=useState(false),[tick,setTick]=useState(0),[category,setCategory]=useState('Todas'),[animCategory,setAnimCategory]=useState('Todas');
 const mode=s.presentation,effectMs=s.effectMs;
 useEffect(()=>{let frame=0;const step=()=>{if(video.current)setTime(video.current.currentTime);frame=requestAnimationFrame(step)};frame=requestAnimationFrame(step);return()=>cancelAnimationFrame(frame)},[]);
 useEffect(()=>{const id=setInterval(()=>setTick(t=>t+1),80);return()=>clearInterval(id)},[]);
 useEffect(()=>{if(video.current)video.current.playbackRate=rate},[rate,s.videoUrl]);
 const seek=(t:number)=>{if(video.current){video.current.currentTime=Math.max(0,Math.min(duration,t));setTime(video.current.currentTime)}};
 const selected=s.cues.find(c=>c.id===s.selectedCueId);
 const active=useMemo(()=>{const hits=s.cues.filter(c=>time>=c.start&&time<c.end&&c.end>c.start);if(!hits.length)return null;hits.sort((a,b)=>b.start-a.start);return hits[0];},[s.cues,time]);
 const overlapCount=useMemo(()=>s.cues.filter(c=>time>=c.start&&time<c.end&&c.end>c.start).length,[s.cues,time]);
 const animated=(p:number,motion:string):React.CSSProperties=>{const raw=Math.min(1,Math.max(0,p));const loop=['Pulsar','Flutuar','Piscar','Neon','Onda','Glitch'].includes(motion);const t=loop?raw:easeOut(raw);if(motion==='Sem animação')return{};switch(motion){
  case 'Saltar':return{transform:`translateY(${-Math.sin(t*Math.PI)*16}px)`};
  case 'Pular':return{transform:`scale(${.7+.3*t+Math.sin(t*Math.PI)*.18})`};
  case 'Cair':return{transform:`translateY(${-(1-t)*(1-t)*45}px)`,opacity:t};
  case 'Deslizar':return{transform:`translateX(${(1-t)*35}px)`,opacity:t};
  case 'Aproximar':return{transform:`scale(${.6+.4*t})`,opacity:t};
  case 'Pulsar':return{transform:`scale(${1+Math.sin(t*Math.PI)*.12})`};
  case 'Girar':return{transform:`rotate(${(1-t)*-30}deg)`,opacity:t};
  case 'Tremer':return{transform:`translateX(${Math.sin(t*30)*(1-t)*8}px)`};
  case 'Revelar':return{clipPath:`inset(0 ${(1-t)*100}% 0 0)`};
  case 'Elasticidade':return{transform:`scale(${1-Math.cos(t*12)*(1-t)*.35},${1+Math.cos(t*12)*(1-t)*.2})`};
  case 'Flutuar':return{transform:`translateY(${Math.sin(raw*3)*5}px)`};
  case 'Piscar':return{opacity:raw===1?1:.35+.65*Math.abs(Math.sin(raw*10))};
  case 'Neon':return{transform:`scale(${1+Math.sin(raw*Math.PI*2)*.06})`,filter:`brightness(${1+.4*Math.sin(raw*Math.PI*2)})`};
  case 'Glitch':return{transform:`translateX(${(Math.random()-.5)*6}px)`,opacity:raw<.1?.4:1};
  case 'Onda':return{transform:`translateY(${Math.sin(raw*Math.PI*2)*10}px)`};
  case 'Zoom viral':return{transform:`scale(${raw<.7?.6+.6*easeOut(raw):1.02+Math.sin((raw-.7)*10)*.04})`,opacity:Math.min(1,raw*2)};
  case 'Bounce':return{transform:`translateY(${-(1-easeOut(raw))*(1-easeOut(raw))*40+Math.abs(Math.sin(easeOut(raw)*Math.PI*3))*(1-easeOut(raw))*10}px)`,opacity:Math.min(1,raw*3)};
  default:return{};}};
 const entrance=(p:number):React.CSSProperties=>{const e=easeOut(p);return{opacity:e,transform:`translateY(${(1-e)*16}px)`};};
 const previewAnim=(v:Look):React.CSSProperties=>{const m=v.defaultMotion;if(!m||m==='Sem animação')return{};return animated((tick*80%1600)/1600,m);};
 const align=st.align||'center';
 const textAlign=align==='left'?'left':align==='right'?'right':'center';
 const anchorLeft=align==='right'?'92%':align==='left'?'8%':x+'%';
 const anchorTransform=align==='right'?'translateX(-100%)':align==='left'?'translateX(0)':'translateX(-50%)';
 const visibleStyles=(category==='Todas'?STYLES:STYLE_GROUPS[category]||[]).filter(v=>v.name.toLocaleLowerCase().includes(query.toLocaleLowerCase()));
 const visibleAnimations=(animCategory==='Todas'?ANIMATIONS:ANIMATION_GROUPS[animCategory]||[]).filter(v=>v.name.toLocaleLowerCase().includes(query.toLocaleLowerCase()));
 const caption=active&&(()=>{
  const words=active.text.trim().split(/\s+/);
  const span=active.end-active.start;
  const enter=entrance((time-active.start)/0.35);
  const container:React.CSSProperties={left:anchorLeft,top:st.posY+'%',transform:anchorTransform,textAlign};
  const paint:React.CSSProperties={...lookPaint(st),fontSize:`${st.fontSize/7.2}cqw`,...enter};
  if(mode==='Frase'){
   const lines=wrapText(active.text,st.maxLines??2,align==='misto'?26:24);
   return <div key={active.id} className="live-caption" style={container}><div style={paint}>{lines.map((line,i)=><div key={i}>{line}</div>)}</div></div>;
  }
  if(mode==='Realce ativo'){
   const lines=wrapText(active.text,st.maxLines??2,align==='misto'?26:24);
   let wordIndex=0;const index=Math.min(words.length-1,Math.floor((time-active.start)/span*words.length));
   return <div key={active.id} className="live-caption" style={container}><div style={paint}>{lines.map((line,li)=><div key={li}>{line.split(' ').map((word,wi)=>{const n=wordIndex++;const start=active.start+span*n/words.length;const on=n===index;return <span key={n} style={{display:'inline-block',marginRight:'.25em',color:on?st.highlightColor:undefined,...animated((time-start)/(effectMs/1000),st.defaultMotion||'Saltar')}}>{word}</span>;})}</div>)}</div></div>;
  }
  const index=Math.min(words.length-1,Math.floor((time-active.start)/span*words.length));
  const first=mode==='Blocos'?Math.floor(index/group)*group:0;
  const shown=mode==='Palavra'?words.slice(index,index+1):words.slice(first,first+group);
  const origin=mode==='Palavra'?index:first;
  return <div key={active.id} className="live-caption" style={container}><div style={paint}>{shown.map((word,i)=>{const n=origin+i;const start=active.start+span*n/words.length;return <span key={n} style={{display:'inline-block',marginRight:'.25em',...animated((time-start)/(effectMs/1000),st.defaultMotion||'Saltar')}}>{word}</span>;})}</div></div>;
 })();
 return <div className="editor"><div className="stage"><video ref={video} src={s.videoUrl||undefined} playsInline onLoadedMetadata={e=>{setDuration(e.currentTarget.duration);e.currentTarget.playbackRate=rate}} onPlay={()=>setPlaying(true)} onPause={()=>setPlaying(false)} onEnded={()=>setPlaying(false)}/><div className="caption-plane">{caption}</div></div>
 {overlapCount>1&&<div className="panel" role="alert"><p>{overlapCount} legendas sobrepostas neste momento. A pré-visualização mostra apenas a mais recente para evitar texto duplicado.</p><button onClick={()=>s.setCues(fixOverlaps(s.cues))}>Corrigir sobreposições</button></div>}
 <div className="transport"><button onClick={()=>seek(time-1)}>−1 s</button><button onClick={()=>{if(!video.current)return;if(video.current.paused)video.current.play().catch(()=>setPlaying(false));else video.current.pause()}}>{playing?'Pausar':'Reproduzir'}</button><button onClick={()=>seek(time+1)}>+1 s</button><small>{formatTime(time)} / {formatTime(duration)}</small></div>
 <input aria-label="Posição no vídeo" type="range" min={0} max={duration||1} step={.001} value={time} onChange={e=>seek(+e.target.value)}/><div className="timeline">{s.cues.map(c=><button key={c.id} className={'cue '+(selected?.id===c.id?'selected':'')} style={{left:c.start/(duration||1)*100+'%',width:(c.end-c.start)/(duration||1)*100+'%'}} onClick={()=>{s.select(c.id);seek(c.start)}}>{c.text}</button>)}</div>
 <nav className="tool-tabs">{['Texto','Estilos','Animações','Ritmo'].map(t=><button aria-pressed={tab===t} key={t} onClick={()=>setTab(t)}>{t}</button>)}</nav><section className="panel">
 {tab==='Texto'&&<><h3>Tamanho, posição, alinhamento e cores</h3><div className="row"><label>Alinhamento<select value={align} onChange={e=>s.setStyle({...st,align:e.target.value as Look['align']} as Look)}><option value="center">Centralizado</option><option value="left">À esquerda</option><option value="right">À direita</option><option value="misto">Misto</option></select></label><label>Linhas: {st.maxLines??2}<input type="range" min={1} max={3} value={st.maxLines??2} onChange={e=>s.setStyle({...st,maxLines:+e.target.value} as Look)}/></label></div><label>Tamanho: {st.fontSize}<input type="range" min={14} max={100} value={st.fontSize} onChange={e=>s.setStyle({...st,fontSize:+e.target.value} as Look)}/></label><label>Horizontal: {x}%<input type="range" min={10} max={90} value={x} onChange={e=>setX(+e.target.value)}/></label><label>Vertical: {st.posY}%<input type="range" min={10} max={90} value={st.posY} onChange={e=>s.setStyle({...st,posY:+e.target.value} as Look)}/></label><div className="row"><label>Cor das letras<input type="color" value={st.color} onChange={e=>s.setStyle({...st,color:e.target.value,gradient:undefined} as Look)}/></label><label>Cor do contorno<input type="color" value={st.outlineColor||'#000000'} onChange={e=>s.setStyle({...st,outlineColor:e.target.value} as Look)}/></label></div><label>Contorno: {st.outlineWidth||0}px<input type="range" min={0} max={8} value={st.outlineWidth||0} onChange={e=>s.setStyle({...st,outlineWidth:+e.target.value} as Look)}/></label>{selected?<><h3>Legenda selecionada</h3><textarea value={selected.text} onChange={e=>s.updateCue(selected.id,{text:e.target.value})}/><label>Início (segundos)<input type="number" step={.001} min={0} value={selected.start} onChange={e=>{const v=+e.target.value;if(v>=0&&v<selected.end)s.updateCue(selected.id,{start:v})}}/></label><label>Fim (segundos)<input type="number" step={.001} value={selected.end} onChange={e=>{const v=+e.target.value;if(v>selected.start)s.updateCue(selected.id,{end:v})}}/></label></>:<p>Toque num bloco da linha temporal para editar o texto e os tempos.</p>}</>}
 {tab==='Estilos'&&<><h3>Biblioteca de legendas</h3><input placeholder="Pesquisar estilos" value={query} onChange={e=>setQuery(e.target.value)}/><select value={category} onChange={e=>setCategory(e.target.value)}><option>Todas</option>{STYLE_CATEGORIES.map(c=><option key={c}>{c}</option>)}</select><p>{visibleStyles.length} estilos nesta seleção.</p><div className="style-grid">{visibleStyles.map(v=><button key={v.id} className="style-card" aria-pressed={st.id===v.id} onClick={()=>s.setStyle(v)}><span className="style-example" style={{...lookPaint(v),...previewAnim(v)}}>A SUA HISTÓRIA</span><strong>{v.name}</strong><small>{v.category} · {v.defaultMotion||'Sem animação'}</small></button>)}</div><CaptionDesigner/></>}
 {tab==='Animações'&&<><h3>Animações das legendas</h3><input placeholder="Pesquisar animações" value={query} onChange={e=>setQuery(e.target.value)}/><select value={animCategory} onChange={e=>setAnimCategory(e.target.value)}><option>Todas</option>{ANIMATION_CATEGORIES.map(c=><option key={c}>{c}</option>)}</select><div className="motion-grid">{MOTIONS.map(m=><button key={m} aria-pressed={m===(st.defaultMotion||'Sem animação')} onClick={()=>s.setStyle({...st,defaultMotion:m} as Look)}><span className="style-example" style={{...lookPaint(st),...animated((tick*80%1600)/1600,m)}}>VIRAL</span><small>{m}</small></button>)}</div><h4>Biblioteca organizada — {visibleAnimations.length} animações</h4><div className="motion-grid">{visibleAnimations.map(a=><button key={a.id} aria-pressed={s.animation?.id===a.id} onClick={()=>{s.setAnimation(a);s.setEffectMs(a.duration);s.setStyle({...st,defaultMotion:motionFromType(a.type)} as Look);}}><strong>{a.name}</strong><small>{a.type} · {a.mode}</small></button>)}</div><label>Duração do efeito: {effectMs} ms<input type="range" min={70} max={600} step={10} value={effectMs} onChange={e=>s.setEffectMs(+e.target.value)}/></label><p>Todas as legendas entram com fade suave e subida. A configuração escolhida aqui é a mesma usada na exportação.</p></>}
 {tab==='Ritmo'&&<><h3>Ritmo ligado ao tempo do vídeo</h3><label>Apresentação<select value={mode} onChange={e=>s.setPresentation(e.target.value as typeof mode)}>{['Frase','Realce ativo','Palavra','Blocos'].map(m=><option key={m}>{m}</option>)}</select></label><p><strong>Frase</strong> mostra o texto numa só cor, sem acompanhar palavra por palavra. “Realce ativo”, “Palavra” e “Blocos” acompanham a fala com animação suave.</p><label>Palavras por bloco: {group}<input type="range" min={1} max={6} value={group} onChange={e=>setGroup(+e.target.value)}/></label><label>Velocidade da prévia: {rate}×<input type="range" min={.5} max={2} step={.05} value={rate} onChange={e=>setRate(+e.target.value)}/></label><p>Os tempos por palavra são estimativas uniformes. Não há análise acústica nem alinhamento forçado instalado.</p></>}
 </section></div>;
}
