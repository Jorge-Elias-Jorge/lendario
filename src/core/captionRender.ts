import type {Cue} from './srt';
import type {SubtitleStyle} from '../data/styles';
import {clamp,identity,motionAt,tracksFor,type MotionFrame,type MotionTiming} from './motion';
import {wordState} from './alignment';
interface Word{text:string;index:number;charIndex:number}
export function drawCaption(ctx:CanvasRenderingContext2D,cue:Cue,style:SubtitleStyle,time:number,width:number,height:number,options?:{presentation?:string;effectMs?:number}){
 const scale=width/720,span=Math.max(.001,cue.end-cue.start),elapsed=time-cue.start;
 if(elapsed<0||elapsed>=span)return;
 const text=style.uppercase?cue.text.toUpperCase():cue.text;
 let charIndex=0;
 const all:Word[]=text.trim().split(/\s+/).filter(Boolean).map((text,index)=>{const w={text,index,charIndex};charIndex+=Array.from(text).length;return w;});
 if(!all.length)return;
 const totalChars=Math.max(1,charIndex),state=wordState(cue,time),active=state.index,wordProgress=state.progress;
 const presentation=options?.presentation??style.presentation??'Frase';
 let words=all;
 if(presentation==='Palavra')words=[all[active]];
 if(presentation==='Blocos'){const size=Math.max(1,Math.min(8,style.blockSize??3)),first=Math.floor(active/size)*size;words=all.slice(first,first+size);}
 const tracks=tracksFor(style,options?.effectMs??300);
 const timing=(word:Word=all[0],charOffset=0,lineIndex=0,lineCount=1):MotionTiming=>({
  elapsed,remaining:span-elapsed,span,wordStart:state.words?state.words[word.index].start-cue.start:word.index/all.length*span,wordDuration:state.words?state.words[word.index].end-state.words[word.index].start:span/all.length,
  charStart:state.words?state.words[word.index].start-cue.start+charOffset/Math.max(1,Array.from(word.text).length)*(state.words[word.index].end-state.words[word.index].start):(word.charIndex+charOffset)/totalChars*span,lineStart:lineIndex/lineCount*span,seed:word.index+charOffset*.37,active:word.index===active
 });
 const block=motionAt(tracks,'block',timing());
 let fontSize=style.fontSize*scale;
 const family=style.fontFamily??'Manrope',baseTracking=(style.letterSpacing??0)+block.tracking;
 const setFont=()=>{ctx.font=`${style.italic?'italic ':''}${style.fontWeight??800} ${fontSize}px "${family}", sans-serif`;};
 const wordWidth=(word:string,extra=0)=>ctx.measureText(word).width+Math.max(0,Array.from(word).length-1)*(baseTracking+extra)*scale;
 let lines:Word[][]=[],widths:number[]=[];
 const maxWidth=width*.86,maxLines=Math.max(1,style.maxLines??2);
 for(let attempt=0;attempt<22;attempt++){
  setFont();const space=ctx.measureText(' ').width;
  lines=[];widths=[];let line:Word[]=[],lineWidth=0;
  for(const word of words){
   const ww=wordWidth(word.text);
   if(line.length&&lineWidth+space+ww>maxWidth){lines.push(line);widths.push(lineWidth);line=[];lineWidth=0;}
   if(line.length)lineWidth+=space;line.push(word);lineWidth+=ww;
  }
  if(line.length){lines.push(line);widths.push(lineWidth);}
  if((lines.length<=maxLines&&widths.every(w=>w<=maxWidth))||fontSize<=12*scale)break;
  fontSize*=.92;
 }
 const lineHeight=fontSize*(style.lineHeight??1.25),padding=(style.padding??10)*scale;
 const align=style.align==='left'?'left':style.align==='right'?'right':'center';
 const anchorX=width*(style.posX??(align==='left'?10:align==='right'?90:50))/100;
 const leftOf=(w:number)=>align==='left'?0:align==='right'?-w:-w/2;
 const minLeft=Math.min(...widths.map(leftOf)),maxRight=Math.max(...widths.map(w=>leftOf(w)+w)),top=-lineHeight*lines.length/2,bottom=-top;
 const apply=(f:MotionFrame)=>{ctx.translate(f.dx*scale,f.dy*scale);ctx.rotate(f.rotate*Math.PI/180);ctx.scale(f.sx,f.sy);ctx.globalAlpha*=f.alpha;};
 const clip=(f:MotionFrame,x:number,y:number,w:number,h:number)=>{if(f.reveal<1){ctx.beginPath();ctx.rect(x,y,w*f.reveal,h);ctx.clip();}};
 const roundRect=(x:number,y:number,w:number,h:number,r:number)=>{
  r=Math.max(0,Math.min(r,w/2,h/2));ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();
 };
 const box=(x:number,y:number,w:number,h:number)=>{
  ctx.save();ctx.globalAlpha*=clamp(style.backgroundOpacity??.9);ctx.fillStyle=style.backgroundColor!;
  roundRect(x-padding,y-padding,w+padding*2,h+padding*2,(style.backgroundRadius??0)*scale);ctx.fill();
  if(style.accentBar){ctx.fillStyle=style.accentBar;ctx.fillRect(x-padding,y-padding,4*scale,h+padding*2);}
  ctx.restore();
 };
 const glyph=(value:string,x:number,y:number,color:string,f:MotionFrame=identity())=>{
  ctx.save();ctx.lineJoin='round';ctx.miterLimit=2;ctx.textBaseline='alphabetic';ctx.textAlign='left';
  if(f.blur>0)ctx.filter=`blur(${f.blur*scale}px)`;
  const outline=(style.outlineWidth??0)*2*scale;
  const glow=style.glow??(f.glow>1.001?style.highlightColor:undefined);
  if(glow){ctx.shadowColor=glow;ctx.shadowBlur=fontSize*.18*f.glow;}
  else if(style.shadow){ctx.shadowColor='rgba(0,0,0,.8)';ctx.shadowBlur=4*scale;ctx.shadowOffsetX=2*scale;ctx.shadowOffsetY=2*scale;}
  if(style.extrusionDepth){ctx.fillStyle=style.extrusionColor??'#15202B';for(let d=Math.min(8,style.extrusionDepth);d>0;d--)ctx.fillText(value,x+d*scale,y+d*scale);}
  ctx.strokeStyle=style.outlineColor??'#101114';ctx.lineWidth=outline||2*scale;
  if(outline>0||style.strokeOnly)ctx.strokeText(value,x,y);
  if(!style.strokeOnly){
   ctx.fillStyle=color;
   if(style.gradient&&color===style.color){
    const colors=style.gradient.match(/#[0-9a-fA-F]{6}/g);
    if(colors&&colors.length>1){const gradient=ctx.createLinearGradient(x,y,x+Math.max(1,ctx.measureText(value).width),y);colors.forEach((c,i)=>gradient.addColorStop(i/(colors.length-1),c));ctx.fillStyle=gradient;}
   }
   ctx.fillText(value,x,y);
  }
  ctx.restore();
 };
 ctx.save();ctx.translate(anchorX,height*style.posY/100);apply(block);clip(block,minLeft-padding,top-padding,maxRight-minLeft+padding*2,bottom-top+padding*2);
 if(style.backgroundColor&&style.backgroundMode!=='line')box(minLeft,top,maxRight-minLeft,bottom-top);
 const space=ctx.measureText(' ').width;
 lines.forEach((line,lineIndex)=>{
  const lf=motionAt(tracks,'line',timing(line[0],0,lineIndex,lines.length)),lw=widths[lineIndex],y=(lineIndex-(lines.length-1)/2)*lineHeight;
  ctx.save();ctx.translate(leftOf(lw)+lw/2,y);apply(lf);clip(lf,-lw/2-padding,-lineHeight/2-padding,lw+padding*2,lineHeight+padding*2);
  if(style.backgroundColor&&style.backgroundMode==='line')box(-lw/2,-lineHeight/2,lw,lineHeight);
  let x=-lw/2;
  line.forEach(word=>{
   const w=wordWidth(word.text),isActive=word.index===active,frame=motionAt(tracks,'word',timing(word,0,lineIndex,lines.length));
   frame.glow*=block.glow*lf.glow;frame.blur=Math.max(frame.blur,block.blur,lf.blur);
   const highlighting=presentation==='Realce ativo',mode=style.highlightMode??'color';
   ctx.save();ctx.translate(x+w/2,0);apply(frame);
   if(highlighting&&isActive&&mode==='scale')ctx.scale(1.13,1.13);
   if(highlighting&&word.index>active)ctx.globalAlpha*=style.futureOpacity??1;
   clip(frame,-w/2-padding,-lineHeight/2-padding,w+padding*2,lineHeight+padding*2);
   if(highlighting&&isActive&&(mode==='box'||mode==='pill')){ctx.fillStyle=style.highlightBackground??style.highlightColor;roundRect(-w/2-6*scale,-fontSize*.6,w+12*scale,fontSize*1.2,mode==='pill'?fontSize*.6:3*scale);ctx.fill();}
   const paintWord=(color:string)=>{
    const hasChars=tracks.some(a=>a.mode==='char'),tracking=(baseTracking+frame.tracking)*scale;
    if(!hasChars&&tracking===0){glyph(word.text,-w/2,fontSize*.34,color,frame);return;}
    const chars=Array.from(word.text),total=ctx.measureText(word.text).width+Math.max(0,chars.length-1)*tracking;
    let cx=-total/2;
    chars.forEach((char,index)=>{
     const cw=ctx.measureText(char).width,cf=motionAt(tracks,'char',timing(word,index,lineIndex,lines.length));cf.glow*=frame.glow;cf.blur=Math.max(cf.blur,frame.blur);
     ctx.save();ctx.translate(cx+cw/2,0);apply(cf);clip(cf,-cw/2,-lineHeight/2,cw,lineHeight);glyph(char,-cw/2,fontSize*.34,color,cf);ctx.restore();cx+=cw+tracking;
    });
   };
   paintWord(highlighting&&isActive&&mode!=='karaoke'&&mode!=='outline'?style.highlightColor:style.color);
   if(highlighting&&mode==='karaoke'&&word.index<=active){ctx.save();ctx.beginPath();ctx.rect(-w/2-padding,-lineHeight/2-padding,(w+padding*2)*(word.index<active?1:wordProgress),lineHeight+padding*2);ctx.clip();paintWord(style.highlightColor);ctx.restore();}
   if(highlighting&&isActive&&mode==='outline'){ctx.save();ctx.strokeStyle=style.highlightColor;ctx.lineWidth=2*scale;roundRect(-w/2-5*scale,-fontSize*.6,w+10*scale,fontSize*1.2,4*scale);ctx.stroke();ctx.restore();}
   if(highlighting&&isActive&&mode==='underline'){ctx.fillStyle=style.highlightColor;ctx.fillRect(-w/2,fontSize*.54,w,fontSize*.065);}
   ctx.restore();x+=w+space;
  });
  ctx.restore();
 });
 ctx.restore();
}
