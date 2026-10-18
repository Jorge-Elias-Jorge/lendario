import React,{useEffect,useMemo,useRef,useState} from 'react';
import {useStore} from '../store';
import {compactTime,timelineDuration} from '../core/editorTimeline';
import Icon from './Icon';
export default function CaptionTimeline({time,duration,playing,onSeek,onEdit,thumbnail}:{time:number;duration:number;playing:boolean;onSeek:(time:number)=>void;onEdit:()=>void;thumbnail?:string}){
 const cues=useStore(s=>s.cues),selected=useStore(s=>s.selectedCueId),select=useStore(s=>s.select);
 const [zoom,setZoom]=useState(28),[scroll,setScroll]=useState(0),[width,setWidth]=useState(900);
 const rail=useRef<HTMLDivElement>(null),end=timelineDuration(cues,duration),pps=Math.min(Math.min(2000,Math.max(16,(width-8)/end))*zoom/28,100000/end);
 useEffect(()=>{
  const el=rail.current;if(!el)return;
  const resize=()=>setWidth(el.clientWidth);resize();
  if(typeof ResizeObserver==='undefined'){window.addEventListener('resize',resize);return()=>window.removeEventListener('resize',resize);}
  const observer=new ResizeObserver(resize);observer.observe(el);return()=>observer.disconnect();
 },[]);
 useEffect(()=>{
  const c=cues.find(c=>c.id===selected),el=rail.current;if(!c||!el)return;
  const x=c.start*pps;if(x<el.scrollLeft||x>el.scrollLeft+el.clientWidth-50)el.scrollLeft=Math.max(0,x-el.clientWidth/3);
 },[selected,pps]);
 useEffect(()=>{
  const el=rail.current;if(!playing||!el)return;
  const x=time*pps;if(x>el.scrollLeft+el.clientWidth-36||x<el.scrollLeft)el.scrollLeft=Math.max(0,x-el.clientWidth*.35);
 },[time,playing,pps]);
 const step=pps>=60?1:pps>=20?5:pps>=8?10:30;
 const ticks=useMemo(()=>{
  const result:number[]=[];for(let t=Math.max(0,Math.floor(scroll/pps/step)*step);t<=Math.min(end,(scroll+width)/pps+step);t+=step)result.push(t);return result;
 },[scroll,pps,step,end,width]);
 const visible=cues.filter(c=>c.end>=(scroll-100)/pps&&c.start<=(scroll+width+100)/pps);
 return <section className="caption-timeline" aria-label="Timeline de legendas">
  <div className="timeline-heading"><div><Icon name="film" size={16}/><strong>Timeline</strong><span>{cues.length} legendas</span></div><div className="timeline-zoom"><button className="icon-button" aria-label="Reduzir zoom da timeline" disabled={zoom<=10} onClick={()=>setZoom(v=>Math.max(10,v/1.5))}><Icon name="minus" size={15}/></button><small>{(zoom/28).toFixed(1)}×</small><button className="icon-button" aria-label="Aumentar zoom da timeline" disabled={zoom>=140} onClick={()=>setZoom(v=>Math.min(140,v*1.5))}><Icon name="plus" size={15}/></button></div></div>
  <div className="timeline-body"><div className="lane-labels"><span>TC</span><span><Icon name="film" size={15}/></span><span>CC</span></div>
   <div className="timeline-scroll" ref={rail} onScroll={e=>setScroll(e.currentTarget.scrollLeft)} tabIndex={0} aria-label="Faixas de vídeo e legendas, deslize horizontalmente">
    <div className="timeline-content" style={{width:Math.max(width,end*pps)}} onPointerDown={e=>{if((e.target as HTMLElement).closest('button'))return;onSeek(Math.max(0,(e.clientX-e.currentTarget.getBoundingClientRect().left)/pps));}}>
     <div className="timeline-ruler">{ticks.map(t=><span key={t} style={{left:t*pps}}>{compactTime(t)}</span>)}</div>
     <div className="video-lane" style={{width:Math.max(2,(duration||end)*pps)}}>{thumbnail?<img src={thumbnail} alt=""/>:<Icon name="film" size={15}/>}<span>{useStore.getState().videoName||'Vídeo local'}</span></div>
     <div className="caption-lane">{visible.map(c=><button key={c.id} aria-pressed={selected===c.id} aria-label={`Editar legenda: ${c.text}`} title={c.text} className={'timeline-cue '+(selected===c.id?'selected':'')+(time>=c.start&&time<c.end?' current':'')} style={{left:c.start*pps,width:Math.max(4,(c.end-c.start)*pps)}} onClick={()=>{select(c.id);onSeek(c.start);onEdit();}}>{c.text}</button>)}</div>
     <div className="timeline-playhead" style={{left:time*pps}}><span/></div>
     {!cues.length&&<div className="timeline-empty">As suas legendas aparecem aqui. Importe um SRT abaixo.</div>}
    </div>
   </div>
  </div>
 </section>;
}
