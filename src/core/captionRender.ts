import { Cue } from './srt';
import { SubtitleStyle } from '../data/styles';
import { wrapText } from './wrap';

const easeOut=(t:number)=>1-Math.pow(1-Math.min(1,Math.max(0,t)),3);

interface Transform{dx:number;dy:number;scale:number;rotate:number;alpha:number}

function motion(m:string,p:number):Transform{
 const raw=Math.min(1,Math.max(0,p));const t=easeOut(raw);
 const base:Transform={dx:0,dy:0,scale:1,rotate:0,alpha:1};
 switch(m){
  case 'Saltar':return{...base,dy:-Math.sin(t*Math.PI)*16};
  case 'Pular':return{...base,scale:.7+.3*t+Math.sin(t*Math.PI)*.18};
  case 'Cair':return{...base,dy:-(1-t)*(1-t)*45,alpha:t};
  case 'Deslizar':return{...base,dx:(1-t)*35,alpha:t};
  case 'Aproximar':return{...base,scale:.6+.4*t,alpha:t};
  case 'Pulsar':return{...base,scale:1+Math.sin(raw*Math.PI)*.12};
  case 'Girar':return{...base,rotate:(1-t)*-30,alpha:t};
  case 'Tremer':return{...base,dx:Math.sin(raw*30)*(1-raw)*8};
  case 'Revelar':return{...base,alpha:t};
  case 'Elasticidade':return{...base,scale:1-Math.cos(t*12)*(1-t)*.35};
  case 'Flutuar':return{...base,dy:Math.sin(raw*3)*5};
  case 'Piscar':return{...base,alpha:raw===1?1:.35+.65*Math.abs(Math.sin(raw*10))};
  case 'Neon':return{...base,scale:1+Math.sin(raw*Math.PI*2)*.06};
  case 'Glitch':return{...base,dx:(Math.random()-.5)*6,alpha:raw<.1?.4:1};
  case 'Onda':return{...base,dy:Math.sin(raw*Math.PI*2)*10};
  case 'Zoom viral':return{...base,scale:raw<.7?.6+.6*t:1.02+Math.sin((raw-.7)*10)*.04,alpha:Math.min(1,raw*2)};
  case 'Bounce':return{...base,dy:-(1-t)*(1-t)*40+Math.abs(Math.sin(t*Math.PI*3))*(1-t)*10,alpha:Math.min(1,raw*3)};
  default:return base;
 }
}

export function drawCaption(ctx:CanvasRenderingContext2D,cue:Cue,time:number,style:SubtitleStyle,W:number,H:number,presentation:string='Frase',effectMs:number=300){
 const span=cue.end-cue.start;
 if(span<=0)return;
 const words=cue.text.trim().split(/\s+/);
 const scale=W/720;
 const fontSize=style.fontSize*scale;
 const lineH=fontSize*1.25;
 ctx.save();
 ctx.font=`${style.fontWeight??800} ${fontSize}px ${style.fontFamily??'sans-serif'}`;
 ctx.textAlign='center';ctx.textBaseline='middle';
 ctx.fillStyle=style.color;
 ctx.strokeStyle=style.outlineColor??'#000000';
 ctx.lineWidth=(style.outlineWidth??0)*2;
 const lines=wrapText(cue.text,style.maxLines??2,style.align==='misto'?26:24);
 const enter=easeOut((time-cue.start)/0.35);
 const m=motion(style.defaultMotion||'Sem animação',(time-cue.start)/(effectMs/1000));
 const cx=W/2,cy=H*(style.posY/100);
 ctx.globalAlpha=enter*m.alpha;
 ctx.translate(cx+m.dx*scale,cy+m.dy*scale);
 ctx.rotate(m.rotate*Math.PI/180);
 ctx.scale(m.scale,m.scale);
 const startY=-(lines.length-1)*lineH/2;
 const index=Math.min(words.length-1,Math.floor((time-cue.start)/span*words.length));
 if(presentation==='Frase'){
  lines.forEach((line,i)=>{const y=startY+i*lineH;if((style.outlineWidth??0)>0)ctx.strokeText(line,0,y);ctx.fillText(line,0,y);});
 }else if(presentation==='Realce ativo'){
  let n=0;
  lines.forEach((line,i)=>{const y=startY+i*lineH;const ws=line.split(' ');const lineW=ctx.measureText(line).width;let x=-lineW/2;
   ws.forEach(word=>{const wWidth=ctx.measureText(word+' ').width;const active=n===index;const wp=(time-(cue.start+span*n/words.length))/(effectMs/1000);const pm=motion(style.defaultMotion||'Saltar',wp);
    ctx.save();ctx.translate(x+wWidth/2,y);ctx.scale(pm.scale,pm.scale);
    if((style.outlineWidth??0)>0)ctx.strokeText(word,0,0);
    ctx.fillStyle=active?style.highlightColor:style.color;
    ctx.fillText(word,0,0);ctx.restore();
    ctx.fillStyle=style.color;x+=wWidth;n++;});
  });
 }else{
  const first=presentation==='Blocos'?Math.floor(index/3)*3:presentation==='Palavra'?index:0;
  const count=presentation==='Palavra'?1:presentation==='Blocos'?3:words.length;
  const shown=words.slice(first,first+count).join(' ');
  const wp=(time-(cue.start+span*first/words.length))/(effectMs/1000);
  const pm=motion(style.defaultMotion||'Saltar',wp);
  ctx.scale(pm.scale,pm.scale);
  if((style.outlineWidth??0)>0)ctx.strokeText(shown,0,0);
  ctx.fillText(shown,0,0);
 }
 ctx.restore();
}
