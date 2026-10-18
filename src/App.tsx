import React,{useEffect,useRef,useState} from 'react';
import {useStore} from './store';
import Editor from './components/Editor';
import NativeGallery from './components/NativeGallery';
import BrowserGallery from './components/BrowserGallery';
import ToolSheet from './components/ToolSheet';
import Icon from './components/Icon';
import {nativeAndroid,Media,videoSource,saveDraft,readDraft,listDrafts,deleteDraft,type Draft,type DraftRow,type MediaItem} from './native/media';
import {browserStorage,browserPersistenceAvailable} from './native/browserStorage';
import {exportVideo,type ExportQuality} from './export/exporter';

export default function App(){
 const s=useStore(),[page,setPage]=useState<'home'|'media'|'edit'>('home'),[library,setLibrary]=useState(false);
 const [rows,setRows]=useState<DraftRow[]>([]),[current,setCurrent]=useState<Draft|null>(null),[status,setStatus]=useState(''),[saving,setSaving]=useState(false);
 const [quality,setQuality]=useState<ExportQuality>('alta'),[exportOpen,setExportOpen]=useState(false),[progress,setProgress]=useState<number|null>(null);
 const [output,setOutput]=useState(''),[outputName,setOutputName]=useState('LEGENDARIO-final.webm'),[projectsQuery,setProjectsQuery]=useState('');
 const [legacy]=useState<{id:string;name:string}[]>(()=>{try{return JSON.parse(browserStorage.getItem('legendario-project-list')||'[]');}catch{return [];}});
 const currentRef=useRef<Draft|null>(null),file=useRef<File|null>(null),url=useRef(''),outputRef=useRef(''),queue=useRef(Promise.resolve());
 const timer=useRef<ReturnType<typeof setTimeout>|null>(null),exportLock=useRef(false);
 const snapshot=()=>{const d=currentRef.current;if(!d)return null;const state=useStore.getState();return{...d,updated:Date.now(),cues:state.cues,style:state.style,animation:state.animation,presentation:state.presentation,effectMs:state.effectMs};};
 const refresh=async()=>{try{setRows((await listDrafts()).sort((a,b)=>b.updated-a.updated));}catch(e){setStatus('Não foi possível listar os rascunhos: '+String(e));}};
 const persist=(draft:Draft|null)=>{
  if(!draft)return queue.current;
  setSaving(true);
  queue.current=queue.current.catch(()=>{}).then(async()=>{
   try{await saveDraft(draft);setStatus('Rascunho guardado.');}
   catch(e){setStatus('Alterações ainda não guardadas: '+String(e));throw e;}
   finally{setSaving(false);}
  });return queue.current;
 };
 const flush=()=>{if(timer.current)clearTimeout(timer.current);timer.current=null;return persist(snapshot());};
 useEffect(()=>{void refresh();return()=>{if(url.current)URL.revokeObjectURL(url.current);if(outputRef.current)URL.revokeObjectURL(outputRef.current);};},[]);
 useEffect(()=>{
  if(!current||page!=='edit'||library)return;const draft=snapshot();if(timer.current)clearTimeout(timer.current);setSaving(true);
  timer.current=setTimeout(()=>{timer.current=null;void persist(draft).catch(()=>{});},500);
  return()=>{if(timer.current)clearTimeout(timer.current);};
 },[s.cues,s.style,s.animation,s.presentation,s.effectMs,current?.id,page,library]);
 useEffect(()=>{const hidden=()=>{if(document.visibilityState==='hidden')void flush().catch(()=>{});};const leave=()=>{void flush().catch(()=>{});};document.addEventListener('visibilitychange',hidden);window.addEventListener('pagehide',leave);return()=>{document.removeEventListener('visibilitychange',hidden);window.removeEventListener('pagehide',leave);};},[]);
 const setDraft=(draft:Draft)=>{currentRef.current=draft;setCurrent(draft);};
 const restore=(draft:Draft)=>useStore.setState({cues:draft.cues,style:draft.style,animation:draft.animation,selectedCueId:null,presentation:draft.presentation??draft.style.presentation??'Frase',effectMs:draft.effectMs??300});
 const create=(name:string,path?:string,thumbnail?:string):Draft=>{const state=useStore.getState();return{id:crypto.randomUUID(),name,path,thumbnail,updated:Date.now(),cues:[],style:state.style,animation:state.animation,presentation:state.presentation,effectMs:state.effectMs};};
 const resetOutput=()=>{if(outputRef.current)URL.revokeObjectURL(outputRef.current);outputRef.current='';setOutput('');};
 const nativeChoose=async(item:MediaItem)=>{
  const result=await Media.importVideo({uri:item.uri}),old=currentRef.current;
  const draft=old?{...old,path:result.path,missing:false,thumbnail:item.thumbnail??old.thumbnail}:create(item.name,result.path,item.thumbnail);
  await persist(draft);setDraft(draft);restore(draft);file.current=null;s.setVideo(videoSource(result.path),draft.name);setPage('edit');resetOutput();
 };
 const chooseFile=async(selected:File,thumbnail?:string)=>{
  const old=currentRef.current,draft=old?{...old,thumbnail:thumbnail??old.thumbnail}:create(selected.name,undefined,thumbnail);
  await persist(draft);
  if(url.current)URL.revokeObjectURL(url.current);url.current=URL.createObjectURL(selected);file.current=selected;
  setDraft(draft);restore(draft);s.setVideo(url.current,draft.name);setPage('edit');resetOutput();
 };
 const newProject=()=>{currentRef.current=null;setCurrent(null);setStatus('');setPage('media');};
 const reopen=async(id:string)=>{
  try{const draft=await readDraft(id);setDraft(draft);restore(draft);file.current=null;resetOutput();
   if(nativeAndroid&&draft.path&&!draft.missing){s.setVideo(videoSource(draft.path),draft.name);setPage('edit');}
   else{setStatus('Selecione o vídeo deste rascunho. As legendas e os ajustes serão recuperados.');setPage('media');}
  }catch(e){setStatus(String(e));}
 };
 const openLegacy=(id:string,name:string)=>{
  try{const raw=JSON.parse(browserStorage.getItem('legendario-project-'+id)||'null'),draft=create(name);if(raw){draft.cues=raw.cues||[];draft.style=raw.style||draft.style;draft.animation=raw.animation||draft.animation;}setDraft(draft);restore(draft);setPage('media');setStatus('Selecione o vídeo para recuperar este projeto anterior.');}catch(e){setStatus(String(e));}
 };
 const home=async()=>{if(progress!==null)return;try{await flush();setLibrary(false);setPage('home');await refresh();}catch{/* Error remains visible and current project stays open. */}};
 const remove=async(id:string)=>{
  if(!window.confirm('Eliminar este rascunho? O vídeo original não será eliminado.'))return;
  try{await deleteDraft(id);if(currentRef.current?.id===id){currentRef.current=null;setCurrent(null);}await refresh();}catch(e){setStatus(String(e));}
 };
 const libraryOpen=async()=>{try{await flush();currentRef.current=null;setCurrent(null);setLibrary(true);setStatus('');}catch{}};
 const runExport=async()=>{
  if(exportLock.current||s.syncBusy)return;exportLock.current=true;setExportOpen(false);setProgress(0);
  try{
   await flush();const source=nativeAndroid?currentRef.current?.path:file.current;
   if(!source)throw new Error('Selecione novamente o vídeo antes de exportar.');
   const result=await exportVideo(source,s.cues,s.style,setProgress,{presentation:s.presentation,effectMs:s.effectMs,quality});
   resetOutput();
   if(result instanceof Blob){const next=URL.createObjectURL(result);outputRef.current=next;setOutput(next);setOutputName('LEGENDARIO-final.webm');setStatus('Vídeo pronto. Toque em Descarregar vídeo para guardar.');}
   else setStatus('MP4 guardado no dispositivo: '+result.location+'. O rascunho foi preservado.');
  }catch(e){setStatus('Não foi possível exportar: '+(e instanceof Error?e.message:String(e)));}
  finally{exportLock.current=false;setProgress(null);}
 };
 const canExport=!s.syncBusy&&progress===null&&(!!file.current||!!current?.path),visibleRows=rows.filter(p=>p.name.toLocaleLowerCase().includes(projectsQuery.toLocaleLowerCase()));
 return <div className={'app workspace-app '+s.theme+(page==='edit'||library?' editing':'')}>
  <header className="app-header">
   {page==='home'&&!library?<a className="wordmark" href="#" onClick={e=>{e.preventDefault();}}>LEGENDÁRIO<span>STUDIO</span></a>:<button className="icon-button back-button" aria-label={page==='edit'||library?'Voltar aos projetos':'Voltar'} disabled={progress!==null} onClick={()=>void home()}><Icon name="back"/></button>}
   {(page==='edit'||library)&&<div className="project-title"><strong>{library?'Biblioteca de estilos':current?.name||'Novo projeto'}</strong><small><span className={'save-dot '+(saving?'pending':'')}/>{library?'Explorar sem alterar rascunhos':saving?'A guardar…':'Rascunho local'}</small></div>}
   {page==='media'&&!library&&<div className="project-title"><strong>{current?'Recuperar mídia':'Novo projeto'}</strong><small>Escolher · confirmar · editar</small></div>}
   <div className="header-actions">{page==='edit'&&!library&&<><button className="icon-button desktop-save" aria-label="Guardar projeto agora" onClick={()=>void flush().catch(()=>{})}><Icon name="save" size={18}/></button><button className="export-trigger" disabled={!canExport} onClick={()=>setExportOpen(true)}><Icon name="upload" size={16}/><span>Exportar</span></button></>}<button className="icon-button theme-toggle" aria-label={s.theme==='dark'?'Ativar tema claro':'Ativar tema escuro'} onClick={s.toggleTheme}><Icon name={s.theme==='dark'?'sun':'moon'} size={18}/></button></div>
  </header>
  {page==='home'&&!library&&<main className="projects-home">
   <div className="home-intro"><span className="section-kicker">DA SUA VOZ PARA A TELA</span><h1>A próxima história<br/>começa aqui<span>.</span></h1><p>Transforme cada palavra em algo que se vê.</p></div>
   <button className="new-project-card" onClick={newProject}><span className="new-project-icon"><Icon name="plus" size={28}/></span><span><strong>Novo projeto</strong><small>Escolha um vídeo e dê vida às legendas</small></span><Icon name="chevron" size={22}/></button>
   <div className="home-shortcuts"><button onClick={()=>void libraryOpen()}><Icon name="styles" size={20}/><span><strong>Estilos e animações</strong><small>Explore a biblioteca</small></span><Icon name="chevron" size={15}/></button><div className="offline-chip"><Icon name="lock" size={15}/><span>Crie no seu dispositivo.<small>Sem enviar os seus vídeos.</small></span></div></div>
   <div className="section-title"><div><span className="section-kicker">CONTINUE DE ONDE PAROU</span><h2>Os seus projetos <small>{rows.length.toString().padStart(2,'0')}</small></h2></div>{rows.length>0&&<label className="projects-search"><Icon name="search" size={17}/><input type="search" aria-label="Pesquisar projetos" placeholder="Pesquisar" value={projectsQuery} onChange={e=>setProjectsQuery(e.target.value)}/></label>}</div>
   {visibleRows.length?<div className="projects-grid">{visibleRows.map(p=><article className="project-tile" key={p.id}><button className="project-open" onClick={()=>void reopen(p.id)}><div className="project-poster">{p.thumbnail?<img src={p.thumbnail} alt=""/>:<Icon name="film" size={30}/>}<span className="project-open-mark"><Icon name="play" size={16}/></span></div><div><strong>{p.name}</strong><small>{new Date(p.updated).toLocaleDateString('pt-PT',{day:'2-digit',month:'short'})} · rascunho local</small></div></button><button className="icon-button project-delete" aria-label={'Eliminar rascunho '+p.name} onClick={()=>void remove(p.id)}><Icon name="trash" size={16}/></button></article>)}</div>:<div className="projects-empty"><Icon name={projectsQuery?'search':'film'} size={30}/><h3>{projectsQuery?'Não encontrámos esse projeto.':'Um espaço para as suas ideias.'}</h3><p>{projectsQuery?'Tente outro nome.':'Os projetos que criar vão aparecer aqui, prontos para continuar.'}</p>{projectsQuery&&<button className="text-button" onClick={()=>setProjectsQuery('')}>Limpar pesquisa</button>}</div>}
   {legacy.length>0&&<details className="legacy-projects"><summary>Projetos anteriores preservados ({legacy.length})</summary>{legacy.map(p=><button className="secondary-button" key={p.id} onClick={()=>openLegacy(p.id,p.name)}>{p.name}</button>)}</details>}
   <footer className="home-footer"><span>LEGENDÁRIO</span><small>Palavras. Ritmo. A sua assinatura.</small></footer>
  </main>}
  {page==='media'&&!library&&<main className="media-page"><div className="page-heading"><span className="section-kicker">PRIMEIRO, A SUA MÍDIA</span><h1>O que vamos criar?</h1><p>Escolha um vídeo. Confirme na prévia. Comece a editar.</p></div>{nativeAndroid?<NativeGallery onChoose={nativeChoose}/>:<BrowserGallery onChoose={chooseFile}/>}</main>}
  {(page==='edit'||library)&&<Editor key={library?'library':current?.id} libraryOnly={library} source={current?.path} thumbnail={current?.thumbnail}/>}
  {status&&status!=='Rascunho guardado.'&&<div className={'app-status '+(page==='edit'&&!library?'editor-status':'')} role="status"><Icon name={status.startsWith('Não')||status.startsWith('Alterações')?'clock':'check'} size={15}/><span>{status}</span>{output&&<a href={output} download={outputName}><Icon name="download" size={15}/> Descarregar vídeo</a>}<button className="icon-button" aria-label="Dispensar aviso" onClick={()=>setStatus('')}><Icon name="close" size={14}/></button></div>}
  {!nativeAndroid&&!browserPersistenceAvailable()&&<div className="temporary-preview">Prévia temporária: os rascunhos desta janela não persistem após recarregar. No APK, são guardados no dispositivo.</div>}
  {exportOpen&&<ToolSheet title="Exportar vídeo" subtitle="FINALIZAR / ARMAZENAMENTO LOCAL" onClose={()=>setExportOpen(false)}>
   <div className="export-settings"><span className="export-format">{nativeAndroid?'MP4':'WEBM'}<small>{nativeAndroid?'VÍDEO H.264 + ÁUDIO QUANDO PRESENTE':'EXPORTAÇÃO DO NAVEGADOR'}</small></span><h3>Pronto para sair do editor.</h3><p className="muted">As legendas e os movimentos são gravados no vídeo. O seu projeto continua disponível para novas edições.</p><label>Qualidade<select value={quality} onChange={e=>setQuality(e.target.value as ExportQuality)}><option value="alta">Alta · recomendada</option><option value="ultra">Ultra · taxa de vídeo superior</option></select></label><p className="inline-notice">{nativeAndroid?'Exportação offline. Android 10+: guarda em Movies/Legendario. Android 8/9: escolha uma pasta local.':'No navegador, mantenha esta janela aberta. A exportação gera WebM em tempo real; a opção MP4 está no APK Android.'}</p><small className="muted">Alta e Ultra não significam compressão sem perdas. A capacidade do aparelho determina os formatos suportados.</small><button className="export-final" disabled={!canExport} onClick={()=>void runExport()}><Icon name="upload" size={18}/> Exportar vídeo em {quality==='alta'?'alta qualidade':'qualidade ultra'}</button></div>
  </ToolSheet>}
 </div>;
}
