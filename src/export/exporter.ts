import {Capacitor,registerPlugin} from '@capacitor/core';
import type {PluginListenerHandle} from '@capacitor/core';
import type {Cue} from '../core/srt';
import type {SubtitleStyle} from '../data/styles';
import {drawCaption} from '../core/captionRender';
export type ExportQuality='alta'|'ultra';
export interface ExportOptions{presentation?:string;effectMs?:number;quality?:ExportQuality}
interface Bridge{
 begin():Promise<{id:string}>;
 append(o:{id:string;data:string}):Promise<void>;
 save(o:{id:string}):Promise<{uri:string;bytes:number}>;
 discard(o:{id:string}):Promise<void>;
 addListener(name:'copyProgress',fn:(e:{id:string;fraction:number})=>void):Promise<PluginListenerHandle>;
}
const native=registerPlugin<Bridge>('LegendarioExport');
let pending:{blob:Blob;id:string|null}|null=null;
let busy=false;
function base64(blob:Blob):Promise<string>{return new Promise((resolve,reject)=>{const r=new FileReader();r.onerror=()=>reject(new Error('Falha ao preparar vídeo'));r.onload=()=>resolve(String(r.result).split(',')[1]);r.readAsDataURL(blob);});}
function panel(){
 const root=document.createElement('div');
 root.setAttribute('role','dialog');root.setAttribute('aria-modal','true');root.setAttribute('aria-label','Exportação de vídeo');
 root.style.cssText='position:fixed;inset:0;background:#101018;color:white;z-index:2147483647;padding:24px;display:flex;flex-direction:column;justify-content:center;gap:16px';
 const title=document.createElement('h2');title.textContent='A exportar vídeo';
 const label=document.createElement('p');label.setAttribute('role','status');
 const bar=document.createElement('progress');bar.max=100;bar.value=0;bar.style.width='100%';
 const clock=document.createElement('p');const start=Date.now();
 const tick=()=>{const seconds=Math.floor((Date.now()-start)/1000);clock.textContent='Tempo decorrido: '+Math.floor(seconds/60)+':'+String(seconds%60).padStart(2,'0');};
 tick();const timer=setInterval(tick,1000);
 root.append(title,label,bar,clock);document.body.append(root);
 return {update:(p:number,text:string)=>{bar.value=p;label.textContent=Math.floor(p)+'% — '+text;},finish:async(text:string)=>{clearInterval(timer);label.textContent=text;await new Promise<void>(resolve=>{const b=document.createElement('button');b.textContent='Concluir';b.onclick=()=>resolve();root.append(b);b.focus();});root.remove();},remove:()=>{clearInterval(timer);root.remove();}};
}
export async function exportVideo(videoFile:File,cues:Cue[],style:SubtitleStyle,onProgress?:(p:number)=>void,options?:ExportOptions):Promise<Blob>{
 if(busy)throw new Error('Já existe uma exportação em andamento.');busy=true;
 const ui=panel();let url='';let video:HTMLVideoElement|null=null;let audio:AudioContext|null=null;let stream:MediaStream|null=null;let rec:MediaRecorder|null=null;let frame=0;
 const report=(p:number,text:string)=>{ui.update(p,text);onProgress?.(p/100);};
 try{
  report(0,'A preparar');
  const android=Capacitor.getPlatform()==='android';
  let blob:Blob;
  const retry=android&&pending&&window.confirm('Guardar o vídeo anterior cuja gravação não terminou? Cancelar gera outro com as edições atuais.');
  if(retry&&pending){blob=pending.blob;}else{
   if(pending?.id)await native.discard({id:pending.id}).catch(()=>undefined);pending=null;
   if(typeof MediaRecorder==='undefined')throw new Error('Este WebView não suporta MediaRecorder.');
   const mime=['video/webm;codecs=vp8,opus','video/webm;codecs=vp9,opus','video/webm'].find(m=>MediaRecorder.isTypeSupported(m));
   if(!mime)throw new Error('Este WebView não suporta gravação WebM.');
   video=document.createElement('video');video.playsInline=true;video.preload='auto';url=URL.createObjectURL(videoFile);
   const v=video;
   await new Promise<void>((resolve,reject)=>{const t=setTimeout(()=>reject(new Error('Tempo excedido ao abrir vídeo')),30000);v.onloadeddata=()=>{clearTimeout(t);resolve();};v.onerror=()=>{clearTimeout(t);reject(new Error('Não foi possível abrir o vídeo'));};v.src=url;v.load();});
   if(!v.videoWidth||!v.videoHeight||!Number.isFinite(v.duration)||v.duration<=0)throw new Error('Vídeo inválido.');
   await document.fonts.ready;
   const canvas=document.createElement('canvas');canvas.width=v.videoWidth;canvas.height=v.videoHeight;
   const ctx=canvas.getContext('2d');if(!ctx||typeof canvas.captureStream!=='function')throw new Error('Captura de canvas indisponível neste WebView.');
   stream=canvas.captureStream(30);audio=new AudioContext();await audio.resume();if(audio.state!=='running')throw new Error('O Android bloqueou o áudio. Tente exportar novamente.');
   const source=audio.createMediaElementSource(v),dest=audio.createMediaStreamDestination();source.connect(dest);dest.stream.getAudioTracks().forEach(track=>stream!.addTrack(track));
   const ultra=options?.quality==='ultra';rec=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:ultra?12000000:8000000,audioBitsPerSecond:ultra?256000:192000});
   const recorder=rec,chunks:Blob[]=[];recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};
   blob=await new Promise<Blob>((resolve,reject)=>{
    const timeout=setTimeout(()=>reject(new Error('Tempo excedido na exportação')),Math.max(120000,v.duration*3000+60000));
    const fail=(e:Error)=>{clearTimeout(timeout);reject(e);};
    recorder.onerror=()=>fail(new Error('Falha do gravador Android'));v.onerror=()=>fail(new Error('Falha ao ler vídeo'));
    recorder.onstop=()=>{clearTimeout(timeout);resolve(new Blob(chunks,{type:'video/webm'}));};
    const draw=()=>{try{ctx.drawImage(v,0,0,canvas.width,canvas.height);const hits=cues.filter(c=>v.currentTime>=c.start&&v.currentTime<c.end&&c.end>c.start).sort((a,b)=>b.start-a.start);if(hits[0])drawCaption(ctx,hits[0],v.currentTime,style,canvas.width,canvas.height,options?.presentation??'Frase',options?.effectMs??300);report(Math.min(80,v.currentTime/v.duration*80),'A gerar vídeo e legendas');if(!v.ended)frame=requestAnimationFrame(draw);}catch(e){fail(e instanceof Error?e:new Error(String(e)));}};
    v.onended=()=>{cancelAnimationFrame(frame);report(80,'A finalizar o ficheiro');if(recorder.state==='recording')recorder.stop();};recorder.start(1000);draw();void v.play().catch(e=>fail(new Error(String(e))));
   });
   if(!blob.size)throw new Error('O vídeo gerado está vazio.');
   v.pause();stream.getTracks().forEach(t=>t.stop());await audio.close();audio=null;
  }
  if(android){
   if(!pending||pending.blob!==blob)pending={blob,id:null};
   if(!pending.id){
    const {id}=await native.begin();
    try{for(let offset=0;offset<blob.size;offset+=524288){await native.append({id,data:await base64(blob.slice(offset,offset+524288))});report(80+Math.min(offset+524288,blob.size)/blob.size*10,'A preparar gravação local');}pending.id=id;}catch(e){await native.discard({id}).catch(()=>undefined);throw e;}
   }
   const id=pending.id;
   const listener=await native.addListener('copyProgress',e=>{if(e.id===id)report(90+Math.min(1,e.fraction)*9,'A guardar no destino');});
   try{report(90,'Escolha uma pasta local e confirme Guardar');const result=await native.save({id});if(result.bytes!==blob.size)throw new Error('Tamanho da cópia diferente do vídeo gerado.');}finally{await listener.remove();}
   await native.discard({id}).catch(()=>undefined);pending=null;
   report(100,'Vídeo guardado no destino escolhido');await ui.finish('100% — Vídeo guardado no destino escolhido.');
  }else{report(100,'Vídeo gerado; use o botão Descarregar para o guardar');await ui.finish('Vídeo gerado. A gravação no navegador depende do botão Descarregar.');}
  return blob;
 }catch(error){await ui.finish('Exportação não concluída: '+(error instanceof Error?error.message:String(error)));throw error;}
 finally{cancelAnimationFrame(frame);video?.pause();if(rec?.state==='recording')rec.stop();stream?.getTracks().forEach(t=>t.stop());if(audio)await audio.close().catch(()=>undefined);if(video){video.removeAttribute('src');video.load();}if(url)URL.revokeObjectURL(url);ui.remove();busy=false;}
}
