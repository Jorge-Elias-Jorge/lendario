import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import { Cue } from '../core/srt';
import { SubtitleStyle } from '../data/styles';
import { drawCaption } from '../core/captionRender';

const pickMime=()=>{
 const options=['video/webm;codecs=vp9,opus','video/webm;codecs=vp8,opus','video/webm'];
 if(typeof MediaRecorder==='undefined')return '';
 for(const mime of options){if(MediaRecorder.isTypeSupported(mime))return mime;}
 return '';
};

export type ExportQuality='alta'|'ultra';

export interface ExportOptions{presentation?:string;effectMs?:number;quality?:ExportQuality}

const qualitySettings=(quality:ExportQuality)=>quality==='ultra'
 ?{crf:'16',preset:'slow',audioBitrate:'256k'}
 :{crf:'18',preset:'medium',audioBitrate:'192k'};

export async function exportVideo(videoFile:File,cues:Cue[],style:SubtitleStyle,onProgress?:(p:number)=>void,options?:ExportOptions):Promise<Blob>{
 const mime=pickMime();
 if(!mime)throw new Error('Este dispositivo não suporta a gravação necessária para exportar.');
 const quality=options?.quality??'alta';
 const video=document.createElement('video');
 video.src=URL.createObjectURL(videoFile);
 video.muted=false;
 await new Promise(r=>video.onloadedmetadata=r);
 const canvas=document.createElement('canvas');
 canvas.width=video.videoWidth||720;
 canvas.height=video.videoHeight||1280;
 const ctx=canvas.getContext('2d')!;
 const stream=canvas.captureStream(30);
 let audioCtx:AudioContext|null=null;
 try{
  audioCtx=new AudioContext();
  const source=audioCtx.createMediaElementSource(video);
  const destination=audioCtx.createMediaStreamDestination();
  source.connect(destination);
  destination.stream.getAudioTracks().forEach(track=>stream.addTrack(track));
 }catch{
  audioCtx=null;
 }
 const rec=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:quality==='ultra'?12000000:8000000,audioBitsPerSecond:quality==='ultra'?256000:192000});
 const chunks:Blob[]=[];
 rec.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};
 const stopped=new Promise<void>(r=>rec.onstop=()=>r());
 rec.start();
 await video.play();
 const presentation=options?.presentation??'Frase';
 const effectMs=options?.effectMs??300;
 const draw=()=>{
  if(video.ended){rec.stop();return;}
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.drawImage(video,0,0,canvas.width,canvas.height);
  const cue=cues.find(c=>video.currentTime>=c.start&&video.currentTime<c.end);
  if(cue)drawCaption(ctx,cue,video.currentTime,style,canvas.width,canvas.height,presentation,effectMs);
  onProgress?.(video.duration?video.currentTime/video.duration:0);
  requestAnimationFrame(draw);
 };
 requestAnimationFrame(draw);
 await new Promise<void>(r=>{const check=()=>{if(video.ended)r();else setTimeout(check,100);};check();});
 await stopped;
 URL.revokeObjectURL(video.src);
 if(audioCtx)await audioCtx.close().catch(()=>{});
 const webm=new Blob(chunks,{type:mime});
 try{
  const ffmpeg=new FFmpeg();
  await ffmpeg.load({
   coreURL:await toBlobURL('https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.js','text/javascript'),
   wasmURL:await toBlobURL('https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.wasm','application/wasm')
  });
  const settings=qualitySettings(quality);
  await ffmpeg.writeFile('in.webm',await fetchFile(webm));
  await ffmpeg.exec(['-i','in.webm','-c:v','libx264','-preset',settings.preset,'-crf',settings.crf,'-pix_fmt','yuv420p','-c:a','aac','-b:a',settings.audioBitrate,'-shortest','out.mp4']);
  const data=await ffmpeg.readFile('out.mp4');
  return new Blob([data],{type:'video/mp4'});
 }catch{
  return webm;
 }
}
