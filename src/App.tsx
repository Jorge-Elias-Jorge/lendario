import React,{useEffect,useRef,useState} from 'react';
import {useStore} from './store';
import Editor from './components/Editor';
import SrtImporter from './components/SrtImporter';
import NativeGallery from './components/NativeGallery';
import {Media,nativeAndroid,videoSource,saveDraft,readDraft,listDrafts,deleteDraft,Draft,DraftRow,MediaItem} from './native/media';
import {exportVideo,ExportQuality} from './export/exporter';
import './modern.css';

export default function App(){
 const s=useStore();
 const [page,setPage]=useState<'home'|'media'|'edit'>('home');
 const [library,setLibrary]=useState(false);
 const [rows,setRows]=useState<DraftRow[]>([]),[current,setCurrent]=useState<Draft|null>(null);
 const [legacy,setLegacy]=useState<{id:string;name:string}[]>(()=>{try{return JSON.parse(localStorage.getItem('legendario-project-list')||'[]')}catch{return []}});
 const [status,setStatus]=useState(''),[progress,setProgress]=useState<number|null>(null),[output,setOutput]=useState(''),[outputName,setOutputName]=useState('legendario-final.mp4');
 const [quality,setQuality]=useState<ExportQuality>('alta');
 const [permissionInfo,setPermissionInfo]=useState(false);
 const currentRef=useRef<Draft|null>(null),file=useRef<File|null>(null),url=useRef('');
 const timer=useRef<ReturnType<typeof setTimeout>|null>(null),queue=useRef(Promise.resolve());
 const refresh=async()=>{try{setRows((await listDrafts()).sort((a,b)=>b.updated-a.updated))}catch(e){setStatus('Não foi possível listar rascunhos: '+String(e))}};
 const snapshot=()=>{const d=currentRef.current;if(!d)return null;const state=useStore.getState();return {...d,updated:Date.now(),cues:state.cues,style:state.style,animation:state.animation,presentation:state.presentation,effectMs:state.effectMs}};
 const persist=(d:Draft|null)=>{if(!d)return queue.current;queue.current=queue.current.catch(()=>{}).then(async()=>{try{await saveDraft(d);setStatus('Rascunho guardado automaticamente.');}catch(e){setStatus('Alterações ainda não guardadas: '+String(e));throw e}});return queue.current};
 const flush=()=>{if(timer.current)clearTimeout(timer.current);timer.current=null;return persist(snapshot())};
 useEffect(()=>{void refresh();if(nativeAndroid){try{setPermissionInfo(localStorage.getItem('legendario-media-intro')!=='seen')}catch{setPermissionInfo(true)}}},[]);
 useEffect(()=>{if(!current)return;const d=snapshot();if(timer.current)clearTimeout(timer.current);setStatus('Alterações pendentes…');timer.current=setTimeout(()=>{timer.current=null;void persist(d).catch(()=>{})},400);return()=>{if(timer.current)clearTimeout(timer.current)}},[s.cues,s.style,s.animation,s.presentation,s.effectMs,current?.id]);
 useEffect(()=>{const onHidden=()=>{if(document.visibilityState==='hidden')void flush().catch(()=>{})};const onLeave=()=>{void flush().catch(()=>{})};document.addEventListener('visibilitychange',onHidden);window.addEventListener('pagehide',onLeave);return()=>{document.removeEventListener('visibilitychange',onHidden);window.removeEventListener('pagehide',onLeave)}},[]);
 const setDraft=(d:Draft)=>{currentRef.current=d;setCurrent(d)};
 const restore=(d:Draft)=>useStore.setState({cues:d.cues,style:d.style,animation:d.animation,selectedCueId:null,presentation:d.presentation??d.style.presentation??'Frase',effectMs:d.effectMs??300});
 const create=(name:string,path?:string,thumbnail?:string)=>{const state=useStore.getState();return {id:crypto.randomUUID(),name,updated:Date.now(),path,thumbnail,cues:[],style:state.style,animation:state.animation} as Draft};
 const nativeChoose=async(item:MediaItem)=>{const result=await Media.importVideo({uri:item.uri});const existing=currentRef.current;const d=existing?{...existing,path:result.path,thumbnail:item.thumbnail,name:existing.name||item.name}:create(item.name,result.path,item.thumbnail);setDraft(d);restore(d);file.current=null;s.setVideo(videoSource(result.path),item.name);await persist(d);setPage('edit');setOutput('')};
 const chooseFile=async(f:File)=>{if(url.current)URL.revokeObjectURL(url.current);url.current=URL.createObjectURL(f);file.current=f;const existing=currentRef.current;const d=existing||create(f.name);setDraft(d);restore(d);s.setVideo(url.current,f.name);await persist(d);setPage('edit');setOutput('')};
 const reopen=async(id:string)=>{try{const d=await readDraft(id);setDraft(d);restore(d);file.current=null;if(nativeAndroid&&d.path&&!d.missing){s.setVideo(videoSource(d.path),d.name);setPage('edit')}else{setStatus('Selecione novamente o vídeo para recuperar este rascunho.');setPage('media')}}catch(e){setStatus(String(e))}};
 const openLegacy=(id:string,name:string)=>{try{const raw=JSON.parse(localStorage.getItem('legendario-project-'+id)||'null');const d=create(name);if(raw){d.cues=raw.cues||[];d.style=raw.style||d.style;d.animation=raw.animation||d.animation}setDraft(d);restore(d);setPage('media');setStatus('Projeto anterior preservado. Selecione o vídeo para criar um rascunho nativo.')}catch(e){setStatus(String(e))}};
 const home=async()=>{try{await flush();setPage('home');await refresh()}catch{}};
 const remove=async(id:string)=>{if(!window.confirm('Eliminar este rascunho? O vídeo original não será eliminado.'))return;try{await deleteDraft(id);if(currentRef.current?.id===id){currentRef.current=null;setCurrent(null)}await refresh()}catch(e){setStatus(String(e))}};
 const permit=async()=>{try{await Media.requestLibrary();localStorage.setItem('legendario-media-intro','seen');setPermissionInfo(false)}catch(e){setStatus(String(e))}};
 const runExport=async()=>{setProgress(0);try{
  const source=nativeAndroid?currentRef.current?.path:file.current;
  if(!source){setStatus('Nenhum vídeo disponível para exportar.');return}
  const result=await exportVideo(source,s.cues,s.style,setProgress,{presentation:s.presentation,effectMs:s.effectMs,quality});
  if(output)URL.revokeObjectURL(output);
  setOutput('');
  if(result instanceof Blob){
   setOutput(URL.createObjectURL(result));setOutputName('legendario-final.webm');
   setStatus('Vídeo WebM gerado no navegador. Use Descarregar para guardar.');
  }else setStatus('MP4 guardado no dispositivo: '+result.location+' ('+(result.bytes/1048576).toFixed(1)+' MB). O projeto permanece guardado para novas edições.');
 }catch(e){setStatus('Falha na exportação: '+(e instanceof Error?e.message:String(e)))}finally{setProgress(null)}};
 const canExport=!s.syncBusy&&progress===null&&(!!file.current||!!currentRef.current?.path);
 if(library)return <div className={'app '+s.theme}><header><button onClick={()=>setLibrary(false)}>← Voltar</button><h1>LEGENDÁRIO / STUDIO</h1><button onClick={s.toggleTheme}>Tema</button></header><p className="library-demo-notice">Biblioteca de demonstração. As alterações aqui não substituem um rascunho existente.</p><Editor libraryOnly/></div>;
 return <div className={'app '+s.theme}>
 {page==='home'&&<section className="home-studio"><div><small className="eyebrow">CRIADO PARA A SUA HISTÓRIA</small><h1>LEGENDÁRIO</h1><p>Estilos, palavras e movimento. Tudo no seu dispositivo.</p></div><button onClick={()=>{void flush().then(()=>{currentRef.current=null;setCurrent(null);setLibrary(true);}).catch(()=>{});}}>Explorar estilos e animações</button></section>}
 {permissionInfo&&<section className="panel"><h2>Acesso à biblioteca</h2><p>O LEGENDÁRIO pode mostrar as fotos e vídeos que autorizar. O Android pedirá a sua escolha; não fazemos upload da média.</p><div className="row"><button onClick={permit}>Permitir acesso</button><button onClick={()=>setPermissionInfo(false)}>Agora não</button></div></section>}
 {page==='home'?<main className="home"><button className="create-project" onClick={()=>{currentRef.current=null;setCurrent(null);setPage('media');setStatus('')}}>+ Criar projeto</button><h2>Os meus projetos e rascunhos</h2><div className="project-grid">{rows.map(p=><article className="panel" key={p.id}><button className="project-card" onClick={()=>reopen(p.id)}>{p.thumbnail&&<img src={p.thumbnail} alt="" style={{width:'100%',borderRadius:8}}/>}<strong>{p.name}</strong><small>{new Date(p.updated).toLocaleString('pt-PT')}</small><small>Rascunho recuperável</small></button><button onClick={()=>remove(p.id)}>Eliminar rascunho</button></article>)}</div>{!rows.length&&<p>Ainda não existem rascunhos.</p>}{legacy.length>0&&<section className="panel"><h3>Projetos anteriores preservados</h3>{legacy.map(p=><button key={p.id} onClick={()=>openLegacy(p.id,p.name)}>{p.name}</button>)}</section>}</main>:page==='media'?<><section className="panel"><button onClick={()=>{setPage('home');void refresh()}}>← Voltar</button></section>{nativeAndroid?<NativeGallery onChoose={nativeChoose}/>:<section className="panel"><h2>Selecionar vídeo</h2><p>Na versão de navegador é necessário selecionar o ficheiro novamente ao reabrir.</p><input type="file" accept="video/*" onChange={e=>{const f=e.target.files?.[0];if(f)void chooseFile(f).catch(e=>setStatus(String(e)))}}/></section>}</>:<><header><button onClick={home}>← Voltar</button><h1>LEGENDÁRIO</h1><button onClick={()=>void flush().catch(()=>{})}>Guardar agora</button><button onClick={s.toggleTheme}>Tema</button></header><Editor source={current?.path}/><SrtImporter/><section className="panel"><h3>Exportar vídeo legendado</h3>
 <p>{nativeAndroid?'MP4 offline com legendas e áudio, quando presente. Android 10+: guarda na galeria, em Movies/Legendario. Android 8/9: escolha uma pasta local e confirme Guardar.':'O navegador gera WebM em tempo real. Use Descarregar no final. A exportação nativa MP4 está disponível no APK Android.'}</p>
 <label>Qualidade da exportação<select value={quality} onChange={e=>setQuality(e.target.value as ExportQuality)}><option value="alta">Alta: recomendada</option><option value="ultra">Ultra: taxa superior</option></select></label>
 <p>Alta equilibra qualidade e tamanho. Ultra solicita uma taxa de vídeo superior, conforme o codec do aparelho; nenhuma opção significa compressão sem perdas. Mantenha o aplicativo aberto até terminar.</p>
 <button disabled={!canExport} onClick={runExport}>{progress!==null?'A gerar vídeo final…':'Exportar vídeo legendado em '+quality}</button>{progress!==null&&<progress max={1} value={progress}/>}{output&&<a href={output} download={outputName}>Descarregar vídeo legendado</a>}</section></>}
 {status&&<p role="status" className="panel">{status}</p>}
 </div>;
}
