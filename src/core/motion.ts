import type {SubtitleAnimation} from '../data/animations/types';
import type {SubtitleStyle} from '../data/styles';

export interface MotionFrame {
 dx:number;dy:number;sx:number;sy:number;rotate:number;alpha:number;
 reveal:number;blur:number;tracking:number;glow:number;
}
export const identity=():MotionFrame=>({dx:0,dy:0,sx:1,sy:1,rotate:0,alpha:1,reveal:1,blur:0,tracking:0,glow:1});
export const clamp=(v:number,min=0,max=1)=>Math.min(max,Math.max(min,v));
export const MOTION_TYPES=['None','Fade','Zoom','Pop','Bounce','Slide','Reveal','Rotate','Elastic','Impact','Pulse','Glow','Shake','Glitch','Float','Wave','Flicker','Typewriter','Flip','Blur','Stretch','Swing','Tracking','Orbit','Roll','Squeeze','Mask'];
export function sampleMotion(a:SubtitleAnimation,progress:number,seed=0,loop=false):MotionFrame{
 const f=identity(),p=clamp(progress),i=clamp(a.intensity,0,1.5);
 let t=p;
 switch(a.easing??'easeOut'){
  case 'easeOut':t=1-Math.pow(1-p,3);break;
  case 'easeInOut':t=p*p*(3-2*p);break;
  case 'back':t=1+2.70158*Math.pow(p-1,3)+1.70158*Math.pow(p-1,2);break;
 }
 const r=1-t,phase=(loop?progress:p)*Math.PI*2;
 const sign=a.direction==='left'||a.direction==='up'?-1:1;
 switch(a.type){
  case 'None':break;
  case 'Fade':f.alpha=t;break;
  case 'Zoom':f.sx=f.sy=1-r*.65*i;f.alpha=t;break;
  case 'Pop':f.sx=f.sy=1-r*.5*i+Math.sin(p*Math.PI)*.2*i;break;
  case 'Bounce':f.dy=(-r*r*50+Math.abs(Math.sin(t*Math.PI*3))*r*16)*i;f.alpha=clamp(p*4);break;
  case 'Slide':
   if(a.direction==='up'||a.direction==='down')f.dy=sign*r*65*i;else f.dx=sign*r*65*i;
   f.alpha=t;break;
  case 'Reveal':case 'Mask':case 'Typewriter':f.reveal=p;break;
  case 'Rotate':f.rotate=sign*r*38*i;f.alpha=t;break;
  case 'Elastic':f.sx=1-Math.cos(p*14)*Math.pow(1-p,2)*.6*i;f.sy=1+Math.cos(p*14)*Math.pow(1-p,2)*.25*i;break;
  case 'Impact':f.sx=f.sy=1+r*.8*i;f.dx=Math.sin(p*40)*r*3*i;f.alpha=clamp(p*5);break;
  case 'Pulse':f.sx=f.sy=1+Math.sin(phase)*.12*i;break;
  case 'Glow':f.glow=1+(.5+.5*Math.sin(phase))*2*i;break;
  case 'Shake':f.dx=Math.sin((loop?progress:p)*36+seed*.7)*7*i*(loop?1:r);f.dy=Math.sin((loop?progress:p)*47+seed)*3*i*(loop?1:r);break;
  case 'Glitch':f.dx=(Math.sin((loop?progress:p)*63+seed*2)>0?1:-1)*5*i*(loop?1:r);f.alpha=(Math.sin((loop?progress:p)*91+seed)>.8?.55:1);break;
  case 'Float':f.dy=Math.sin(phase)*9*i;break;
  case 'Wave':f.dy=Math.sin(phase+seed*.65)*12*i;f.rotate=Math.sin(phase+seed*.65)*3*i;break;
  case 'Flicker':f.alpha=.45+.55*Math.abs(Math.sin(phase*3+seed));if(!loop&&p===1)f.alpha=1;break;
  case 'Flip':f.sx=Math.max(.02,Math.cos(r*Math.PI/2));f.sy=1+r*.15*i;f.alpha=t;break;
  case 'Blur':f.blur=Math.max(0,r*12*i);f.alpha=t;break;
  case 'Stretch':f.sx=1+r*.9*i;f.sy=1-r*.6*i;f.alpha=t;break;
  case 'Swing':f.rotate=Math.sin(phase)*10*i*(loop?1:r);break;
  case 'Tracking':f.tracking=r*10*i;f.alpha=t;break;
  case 'Orbit':f.dx=Math.sin(phase)*10*i*(loop?1:r);f.dy=Math.cos(phase)*10*i*(loop?1:r);break;
  case 'Roll':f.rotate=sign*r*180*i;f.dx=sign*r*60*i;f.alpha=t;break;
  case 'Squeeze':f.sx=1-r*.65*i;f.sy=1+r*.4*i;f.alpha=t;break;
  default:throw new Error('Família de animação não implementada: '+a.type);
 }
 f.alpha=clamp(f.alpha);f.sx=Math.max(.02,f.sx);f.sy=Math.max(.02,f.sy);
 return f;
}
const legacy:Record<string,[string,boolean?,SubtitleAnimation['direction']?]>={
 'Saltar':['Bounce'],'Pular':['Pop'],'Cair':['Slide',false,'up'],'Deslizar':['Slide',false,'right'],
 'Aproximar':['Zoom'],'Pulsar':['Pulse',true],'Girar':['Rotate'],'Tremer':['Shake'],
 'Revelar':['Reveal'],'Elasticidade':['Elastic'],'Flutuar':['Float',true],'Piscar':['Flicker',true],
 'Neon':['Glow',true],'Glitch':['Glitch',true],'Onda':['Wave',true],'Zoom viral':['Impact'],'Bounce':['Bounce']
};
export function tracksFor(style:SubtitleStyle,duration=300):SubtitleAnimation[]{
 if(style.animationTracks)return Object.values(style.animationTracks).filter((a):a is SubtitleAnimation=>!!a);
 const old=legacy[style.defaultMotion??''];
 return old?[{id:'legacy',name:style.defaultMotion!,type:old[0],mode:old[1]?'loop':'in',duration,intensity:.8,direction:old[2]}]:[];
}
export interface MotionTiming {elapsed:number;remaining:number;span:number;wordStart:number;wordDuration:number;charStart:number;lineStart:number;seed:number;active:boolean}
export function motionAt(tracks:SubtitleAnimation[],scope:'block'|'word'|'char'|'line',c:MotionTiming):MotionFrame{
 const f=identity();
 for(const a of tracks){
  const global=a.mode==='in'||a.mode==='out'||a.mode==='loop';
  if(global&&scope!=='block')continue;
  if(!global&&a.mode!==scope&&!(a.mode==='highlight'&&scope==='word'&&c.active))continue;
  const duration=Math.max(.001,Math.min(Math.max(1,a.duration)/1000,a.mode==='out'?c.span/2:c.span));
  let p=a.mode==='out'?c.remaining/duration:a.mode==='loop'?c.elapsed/duration:
   (c.elapsed-(a.mode==='word'||a.mode==='highlight'?c.wordStart:a.mode==='char'?c.charStart:a.mode==='line'?c.lineStart:0))/duration;
  if(a.mode==='highlight'&&p<0)continue;
  const part=sampleMotion(a,p,c.seed,a.mode==='loop');
  if(p<0&&!global)part.alpha=0;
  f.dx+=part.dx;f.dy+=part.dy;f.sx*=part.sx;f.sy*=part.sy;f.rotate+=part.rotate;
  f.alpha*=part.alpha;f.reveal=Math.min(f.reveal,part.reveal);f.blur=Math.max(f.blur,part.blur);f.tracking+=part.tracking;f.glow*=part.glow;
 }
 return f;
}
