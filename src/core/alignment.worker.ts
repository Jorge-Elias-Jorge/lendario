import {alignCues} from './alignment';
import type {Cue,WordTiming} from './srt';
self.onmessage=(event:MessageEvent<{cues:Cue[];words:WordTiming[];duration:number}>)=>{
 try{self.postMessage({proposals:alignCues(event.data.cues,event.data.words,event.data.duration)});}
 catch(e){self.postMessage({error:e instanceof Error?e.message:String(e)});}
};
