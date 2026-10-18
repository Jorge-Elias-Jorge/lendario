import type {Cue} from './srt';
export function timelineDuration(cues:Cue[],mediaDuration:number){
 const end=Math.max(Number.isFinite(mediaDuration)?mediaDuration:0,...cues.filter(c=>Number.isFinite(c.end)).map(c=>c.end),0);
 return end>0?end:10;
}
export function seekTime(value:number,duration:number){
 return Math.max(0,Math.min(Number.isFinite(duration)&&duration>0?duration:0,Number.isFinite(value)?value:0));
}
export function compactTime(value:number){
 const seconds=Math.max(0,Math.floor(Number.isFinite(value)?value:0));
 return `${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`;
}
export function fixCueOverlaps(cues:Cue[]):Cue[]{
 let previous=0;
 return [...cues].sort((a,b)=>a.start-b.start).map(c=>{
  const start=Math.max(c.start,previous),end=Math.max(c.end,start+.2);previous=end;
  return start===c.start&&end===c.end?c:{...c,start,end,words:undefined,alignment:undefined,
   originalTiming:c.originalTiming??{start:c.start,end:c.end,text:c.text,words:c.words}};
 });
}
