import React,{useEffect,useRef} from 'react';
import type {SubtitleStyle} from '../data/styles';
import {drawCaption} from '../core/captionRender';
import {loadCaptionFonts} from '../data/fonts';
const cue={id:'demo',start:0,end:3.6,text:'Cada palavra conta uma história'};
export default function CaptionPreview({style,animate=false,label='Prévia do estilo'}:{style:SubtitleStyle;animate?:boolean;label?:string}){
 const ref=useRef<HTMLCanvasElement>(null);
 useEffect(()=>{
  let frame=0,closed=false,start=0;
  const draw=(timestamp:number)=>{
   if(closed)return;if(!start)start=timestamp;
   const canvas=ref.current,ctx=canvas?.getContext('2d');if(!canvas||!ctx)return;
   ctx.clearRect(0,0,canvas.width,canvas.height);
   drawCaption(ctx,cue,style,animate?((timestamp-start)/1000)%4:1.55,canvas.width,canvas.height);
   if(animate)frame=requestAnimationFrame(draw);
  };
  void loadCaptionFonts().then(()=>{if(!closed)draw(performance.now());});
  return()=>{closed=true;cancelAnimationFrame(frame);};
 },[style,animate]);
 return <canvas ref={ref} width={360} height={224} role="img" aria-label={label}/>;
}
