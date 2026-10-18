import {Capacitor,registerPlugin} from '@capacitor/core';
import type {PluginListenerHandle} from '@capacitor/core';
import type {Cue} from '../core/srt';
import type {SubtitleStyle} from '../data/styles';
import {drawCaption} from '../core/captionRender';
import {loadCaptionFonts} from '../data/fonts';

export type ExportQuality='alta'|'ultra';
export interface ExportOptions{presentation?:string;effectMs?:number;quality?:ExportQuality}
export interface NativeExportResult{kind:'native';uri:string;bytes:number;location:string}
interface RenderBridge{render(options:{source:string;cues:Cue[];style:SubtitleStyle;presentation:string;effectMs:number;quality:ExportQuality}):Promise<{path:string;mime:string;bytes:number}>;cancel():Promise<void>;addListener(name:'renderProgress',listener:(event:{fraction:number})=>void):Promise<PluginListenerHandle>}
interface SaveBridge{save(options:{path:string}):Promise<{uri:string;bytes:number;location:string}>;discard(options:{path:string}):Promise<void>}
const renderer=registerPlugin<RenderBridge>('LegendarioRender');
const storage=registerPlugin<SaveBridge>('LegendarioExport');
let busy=false;
function panel(){
 const root=document.createElement('div');root.setAttribute('role','dialog');root.setAttribute('aria-modal','true');root.setAttribute('aria-label','Exportação de vídeo');
 root.style.cssText='position:fixed;inset:0;background:#101018;color:white;z-index:2147483647;padding:24px;display:flex;flex-direction:column;justify-content:center;gap:16px';
 const title=document.createElement('h2');title.textContent='A exportar vídeo';
 const label=document.createElement('p');label.setAttribute('role','status');
 const bar=document.createElement('progress');bar.max=100;bar.value=0;bar.style.width='100%';
 const cancel=document.createElement('button');cancel.textContent='Cancelar exportação';cancel.hidden=true;
 const clock=document.createElement('p');const start=Date.now();
 const tick=()=>{const seconds=Math.floor((Date.now()-start)/1000);clock.textContent='Tempo decorrido: '+Math.floor(seconds/60)+':'+String(seconds%60).padStart(2,'0');};tick();const timer=setInterval(tick,1000);
 root.append(title,label,bar,clock,cancel);document.body.append(root);
 return {
  update:(value:number,text:string)=>{bar.value=value;label.textContent=Math.floor(value)+'% — '+text;},
  cancellable:(action:(()=>void)|null)=>{cancel.hidden=!action;cancel.onclick=action;},
  retry:async(text:string)=>{label.textContent=text;return new Promise<boolean>(resolve=>{
   const retry=document.createElement('button'),close=document.createElement('button');
   retry.textContent='Tentar guardar novamente';close.textContent='Descartar vídeo gerado';
   const done=(value:boolean)=>{retry.remove();close.remove();resolve(value);};
   retry.onclick=()=>done(true);close.onclick=()=>done(false);root.append(retry,close);retry.focus();
  });},
  finish:async(text:string)=>{cancel.hidden=true;clearInterval(timer);label.textContent=text;await new Promise<void>(resolve=>{const button=document.createElement('button');button.textContent='Concluir';button.onclick=()=>resolve();root.append(button);button.focus();});root.remove();},
  remove:()=>{clearInterval(timer);root.remove();}
 };
}
export async function exportVideo(videoFile:File|string,cues:Cue[],style:SubtitleStyle,onProgress?:(value:number)=>void,options?:ExportOptions):Promise<Blob|NativeExportResult>{
 if(busy)throw new Error('Já existe uma exportação em andamento.');busy=true;
 const ui=panel();const report=(value:number,text:string)=>{ui.update(value,text);onProgress?.(value/100);};
 try{
  report(0,'A preparar');
  if(Capacitor.getPlatform()==='android'){
   if(typeof videoFile!=='string'||!videoFile.startsWith('file://'))throw new Error('Importe o vídeo na biblioteca local antes de exportar.');
   const source=videoFile;
   const listener=await renderer.addListener('renderProgress',event=>report(Math.min(88,event.fraction*88),'A renderizar vídeo e legendas'));
   let cancelled=false;
   ui.cancellable(()=>{cancelled=true;ui.cancellable(null);void renderer.cancel().catch(()=>undefined);});
   let rendered:{path:string;mime:string;bytes:number};
   try{rendered=await renderer.render({source,cues,style,presentation:options?.presentation??'Frase',effectMs:options?.effectMs??300,quality:options?.quality??'alta'});}
   finally{ui.cancellable(null);await listener.remove().catch(()=>undefined);}
   try{
    if(cancelled)throw new Error('Exportação cancelada.');
    if(rendered.mime!=='video/mp4'||rendered.bytes<=0)throw new Error('O motor nativo não produziu um MP4 válido.');
    for(;;){
     report(90,'A guardar MP4 no armazenamento local; no Android 8/9 escolha uma pasta');
     try{
      const saved=await storage.save({path:rendered.path});
      if(saved.bytes!==rendered.bytes)throw new Error('Tamanho da cópia diferente do MP4 gerado.');
      report(100,'Vídeo guardado: '+saved.location);
      await ui.finish('100% — MP4 guardado no dispositivo: '+saved.location+'.');
      return {kind:'native',...saved};
     }catch(error){
      if(!await ui.retry((error instanceof Error?error.message:String(error))+' O vídeo está pronto, não é necessário renderizar novamente.'))throw new Error('Gravação descartada pelo utilizador.');
     }
    }
   }finally{await storage.discard({path:rendered.path}).catch(()=>undefined);}
  }
  if(typeof videoFile==='string')throw new Error('Selecione o ficheiro de vídeo neste navegador.');
  await loadCaptionFonts();
  if(typeof MediaRecorder==='undefined')throw new Error('Este navegador não suporta exportação de vídeo.');
  const mime=['video/webm;codecs=vp8,opus','video/webm;codecs=vp9,opus','video/webm'].find(value=>MediaRecorder.isTypeSupported(value));
  if(!mime)throw new Error('Este navegador não suporta gravação WebM.');
  const url=URL.createObjectURL(videoFile);const video=document.createElement('video');video.playsInline=true;video.preload='auto';
  let audio:AudioContext|null=null,stream:MediaStream|null=null,recorder:MediaRecorder|null=null,frame=0;
  try{
   await new Promise<void>((resolve,reject)=>{const timeout=window.setTimeout(()=>reject(new Error('Tempo excedido ao abrir o vídeo.')),30000);video.onloadeddata=()=>{clearTimeout(timeout);resolve();};video.onerror=()=>{clearTimeout(timeout);reject(new Error('Não foi possível abrir o vídeo.'));};video.src=url;video.load();});
   if(!video.videoWidth||!video.videoHeight||!Number.isFinite(video.duration)||video.duration<=0)throw new Error('Vídeo inválido.');
   await document.fonts.ready;
   const canvas=document.createElement('canvas');canvas.width=video.videoWidth;canvas.height=video.videoHeight;
   const context=canvas.getContext('2d');if(!context||typeof canvas.captureStream!=='function')throw new Error('Captura de canvas indisponível.');
   stream=canvas.captureStream(30);audio=new AudioContext();await audio.resume();if(audio.state!=='running')throw new Error('O navegador bloqueou o áudio. Tente novamente.');
   const source=audio.createMediaElementSource(video),destination=audio.createMediaStreamDestination();source.connect(destination);destination.stream.getAudioTracks().forEach(track=>stream!.addTrack(track));
   const ultra=options?.quality==='ultra';recorder=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:ultra?12000000:8000000,audioBitsPerSecond:ultra?256000:192000});
   const chunks:Blob[]=[];recorder.ondataavailable=event=>{if(event.data.size)chunks.push(event.data);};
   const blob=await new Promise<Blob>((resolve,reject)=>{
    const timeout=window.setTimeout(()=>reject(new Error('Tempo excedido na exportação.')),Math.max(120000,video.duration*3000+60000));
    const fail=(error:Error)=>{clearTimeout(timeout);reject(error);};
    recorder!.onerror=()=>fail(new Error('Falha do gravador de vídeo.'));recorder!.onstop=()=>{clearTimeout(timeout);resolve(new Blob(chunks,{type:'video/webm'}));};
    const draw=()=>{try{context.drawImage(video,0,0,canvas.width,canvas.height);const hits=cues.filter(cue=>video.currentTime>=cue.start&&video.currentTime<cue.end&&cue.end>cue.start).sort((a,b)=>b.start-a.start);if(hits[0])drawCaption(context,hits[0],style,video.currentTime,canvas.width,canvas.height,{presentation:options?.presentation??'Frase',effectMs:options?.effectMs??300});report(Math.min(80,video.currentTime/video.duration*80),'A gerar vídeo e legendas');if(!video.ended)frame=requestAnimationFrame(draw);}catch(error){fail(error instanceof Error?error:new Error(String(error)));}};
    video.onended=()=>{cancelAnimationFrame(frame);report(80,'A finalizar o ficheiro');if(recorder?.state==='recording')recorder.stop();};recorder!.start(1000);draw();void video.play().catch(error=>fail(new Error(String(error))));
   });
   if(!blob.size)throw new Error('O gravador produziu um vídeo vazio.');video.pause();stream.getTracks().forEach(track=>track.stop());await audio.close();audio=null;
   report(100,'Vídeo gerado; use o botão Descarregar para o guardar');await ui.finish('Vídeo gerado. A gravação no navegador depende do botão Descarregar.');return blob;
  }finally{cancelAnimationFrame(frame);video.pause();if(recorder?.state==='recording')recorder.stop();stream?.getTracks().forEach(track=>track.stop());if(audio)await audio.close().catch(()=>undefined);video.removeAttribute('src');video.load();URL.revokeObjectURL(url);}
 }catch(error){await ui.finish('Exportação não concluída: '+(error instanceof Error?error.message:String(error)));throw error;}
 finally{busy=false;ui.remove();}
}
