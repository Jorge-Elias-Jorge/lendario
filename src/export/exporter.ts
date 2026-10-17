import {Capacitor,registerPlugin} from '@capacitor/core';
import type {PluginListenerHandle} from '@capacitor/core';
import type {Cue} from '../core/srt';
import type {SubtitleStyle} from '../data/styles';
import {drawCaption} from '../core/captionRender';

export type ExportQuality='alta'|'ultra';
export interface ExportOptions{presentation?:string;effectMs?:number;quality?:ExportQuality}
interface RenderBridge{render(options:{source:string;cues:string;style:string;presentation:string;effectMs:number}):Promise<{path:string;mime:string;bytes:number}>;cancel():Promise<void>;addListener(name:'renderProgress',listener:(event:{fraction:number})=>void):Promise<PluginListenerHandle>}
interface SaveBridge{begin():Promise<{id:string}>;append(options:{id:string;data:string}):Promise<void>;save(options:{id:string}):Promise<{uri:string;bytes:number}>;discard(options:{id:string}):Promise<void>}
const renderer=registerPlugin<RenderBridge>('LegendarioRender');
const storage=registerPlugin<SaveBridge>('LegendarioExport');
let busy=false;
function base64(blob:Blob):Promise<string>{return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onerror=()=>reject(new Error('Não foi possível preparar o vídeo.'));reader.onload=()=>resolve(String(reader.result).split(',')[1]);reader.readAsDataURL(blob);});}
function panel(){
 const root=document.createElement('div');root.setAttribute('role','dialog');root.setAttribute('aria-modal','true');root.setAttribute('aria-label','Exportação de vídeo');
 root.style.cssText='position:fixed;inset:0;background:#101018;color:white;z-index:2147483647;padding:24px;display:flex;flex-direction:column;justify-content:center;gap:16px';
 const title=document.createElement('h2');title.textContent='A exportar vídeo';
 const label=document.createElement('p');label.setAttribute('role','status');
 const bar=document.createElement('progress');bar.max=100;bar.value=0;bar.style.width='100%';
 const clock=document.createElement('p');const start=Date.now();
 const tick=()=>{const seconds=Math.floor((Date.now()-start)/1000);clock.textContent='Tempo decorrido: '+Math.floor(seconds/60)+':'+String(seconds%60).padStart(2,'0');};tick();const timer=setInterval(tick,1000);
 root.append(title,label,bar,clock);document.body.append(root);
 return {update:(value:number,text:string)=>{bar.value=value;label.textContent=Math.floor(value)+'% — '+text;},finish:async(text:string)=>{clearInterval(timer);label.textContent=text;await new Promise<void>(resolve=>{const button=document.createElement('button');button.textContent='Concluir';button.onclick=()=>resolve();root.append(button);button.focus();});root.remove();},remove:()=>{clearInterval(timer);root.remove();}};
}
async function saveAndroid(blob:Blob,update:(value:number,text:string)=>void):Promise<void>{
 const {id}=await storage.begin();
 try{for(let offset=0;offset<blob.size;offset+=524288){await storage.append({id,data:await base64(blob.slice(offset,offset+524288))});update(90+Math.min(offset+524288,blob.size)/blob.size*9,'A preparar gravação local');}
 update(90,'Escolha uma pasta local e confirme Guardar');const result=await storage.save({id});if(result.bytes!==blob.size)throw new Error('Tamanho da cópia diferente do vídeo gerado.');}
 catch(error){await storage.discard({id}).catch(()=>undefined);throw error;}
}
export async function exportVideo(videoFile:File,cues:Cue[],style:SubtitleStyle,onProgress?:(value:number)=>void,options?:ExportOptions):Promise<Blob>{
 if(busy)throw new Error('Já existe uma exportação em andamento.');busy=true;
 const ui=panel();const report=(value:number,text:string)=>{ui.update(value,text);onProgress?.(value/100);};
 try{
  report(0,'A preparar');
  if(Capacitor.getPlatform()==='android'){
   const source=await new Promise<string>((resolve,reject)=>{const reader=new FileReader();reader.onerror=()=>reject(new Error('Não foi possível ler o vídeo original.'));reader.onload=()=>resolve(String(reader.result));reader.readAsDataURL(videoFile);});
   const listener=await renderer.addListener('renderProgress',event=>report(Math.min(88,event.fraction*88),'A renderizar vídeo e legendas'));
   let path:string;
   try{const result=await renderer.render({source,cues:JSON.stringify(cues),style:JSON.stringify(style),presentation:options?.presentation??'Frase',effectMs:options?.effectMs??300});path=result.path;}finally{await listener.remove();}
   report(89,'A finalizar o ficheiro MP4');
   const response=await fetch(Capacitor.convertFileSrc(path));if(!response.ok)throw new Error('Não foi possível abrir o MP4 gerado.');
   const blob=await response.blob();if(!blob.size)throw new Error('O MP4 gerado está vazio.');
   await saveAndroid(blob,report);report(100,'Vídeo guardado no destino escolhido');await ui.finish('100% — Vídeo guardado no destino escolhido.');return blob;
  }
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
    const draw=()=>{try{context.drawImage(video,0,0,canvas.width,canvas.height);const hits=cues.filter(cue=>video.currentTime>=cue.start&&video.currentTime<cue.end&&cue.end>cue.start).sort((a,b)=>b.start-a.start);if(hits[0])drawCaption(context,hits[0],video.currentTime,style,canvas.width,canvas.height,options?.presentation??'Frase',options?.effectMs??300);report(Math.min(80,video.currentTime/video.duration*80),'A gerar vídeo e legendas');if(!video.ended)frame=requestAnimationFrame(draw);}catch(error){fail(error instanceof Error?error:new Error(String(error)));}};
    video.onended=()=>{cancelAnimationFrame(frame);report(80,'A finalizar o ficheiro');if(recorder?.state==='recording')recorder.stop();};recorder!.start(1000);draw();void video.play().catch(error=>fail(new Error(String(error))));
   });
   if(!blob.size)throw new Error('O gravador produziu um vídeo vazio.');video.pause();stream.getTracks().forEach(track=>track.stop());await audio.close();audio=null;
   report(100,'Vídeo gerado; use o botão Descarregar para o guardar');await ui.finish('Vídeo gerado. A gravação no navegador depende do botão Descarregar.');return blob;
  }finally{cancelAnimationFrame(frame);video.pause();if(recorder?.state==='recording')recorder.stop();stream?.getTracks().forEach(track=>track.stop());if(audio)await audio.close().catch(()=>undefined);video.removeAttribute('src');video.load();URL.revokeObjectURL(url);}
 }catch(error){await ui.finish('Exportação não concluída: '+(error instanceof Error?error.message:String(error)));throw error;}
 finally{busy=false;ui.remove();}
}
