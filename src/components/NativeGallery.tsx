import React,{useCallback,useEffect,useRef,useState} from 'react';
import {Media,videoSource,type Access,type MediaItem} from '../native/media';
import {compactTime} from '../core/editorTimeline';
import Icon from './Icon';
export default function NativeGallery({onChoose}:{onChoose:(item:MediaItem)=>Promise<void>}){
 const [access,setAccess]=useState<Access|null>(null),[items,setItems]=useState<MediaItem[]>([]),[kind,setKind]=useState<'videos'|'images'>('videos');
 const [offset,setOffset]=useState(0),[more,setMore]=useState(false),[busy,setBusy]=useState(false),[message,setMessage]=useState(''),[query,setQuery]=useState('');
 const [preview,setPreview]=useState<{item:MediaItem;path:string}|null>(null);
 const generation=useRef(0),locked=useRef(false),offsetRef=useRef(0),mounted=useRef(true);
 useEffect(()=>()=>{mounted.current=false;generation.current++;},[]);
 const load=useCallback(async(reset:boolean)=>{
  const token=++generation.current;setBusy(true);setMessage('');
  try{
   const a=await Media.access();if(token!==generation.current)return;setAccess(a);
   if(!(a[kind]||a.partial)){setItems([]);setMore(false);return;}
   const start=reset?0:offsetRef.current,r=await Media.listMedia({kind,offset:start,limit:24});
   if(token!==generation.current)return;
   setItems(old=>reset?r.items:[...old,...r.items.filter(item=>!old.some(previous=>previous.uri===item.uri))]);
   offsetRef.current=start+r.items.length;setOffset(offsetRef.current);setMore(r.more);
  }catch(e){if(token===generation.current)setMessage(e instanceof Error?e.message:String(e));}
  finally{if(token===generation.current)setBusy(false);}
 },[kind]);
 useEffect(()=>{setItems([]);offsetRef.current=0;void load(true);return()=>{generation.current++;};},[load]);
 useEffect(()=>{const refresh=()=>{if(document.visibilityState==='visible'&&!locked.current&&!preview)void load(true);};document.addEventListener('visibilitychange',refresh);return()=>document.removeEventListener('visibilitychange',refresh);},[load,preview]);
 const permit=async()=>{if(locked.current)return;locked.current=true;setBusy(true);try{setAccess(await Media.requestLibrary());await load(true);}catch(e){setMessage(String(e));}finally{locked.current=false;if(mounted.current)setBusy(false);}};
 const openPreview=async(item:MediaItem)=>{
  if(locked.current)return;locked.current=true;setBusy(true);setMessage('A preparar a prévia local…');
  try{const r=await Media.previewVideo({uri:item.uri});if(mounted.current){setPreview({item,path:r.path});setMessage('');}}
  catch(e){if(mounted.current)setMessage(String(e));}
  finally{locked.current=false;if(mounted.current)setBusy(false);}
 };
 const confirm=async()=>{
  if(!preview||locked.current)return;locked.current=true;setBusy(true);setMessage('A importar o vídeo para o projeto…');
  try{await onChoose(preview.item);if(mounted.current)setPreview(null);}
  catch(e){if(mounted.current)setMessage(String(e));}
  finally{locked.current=false;if(mounted.current)setBusy(false);}
 };
 const permitted=access&&(access[kind]||access.partial),visible=items.filter(item=>item.name.toLocaleLowerCase().includes(query.toLocaleLowerCase()));
 if(preview)return <section className="media-confirm">
  <div className="confirm-video"><video src={videoSource(preview.path)} poster={preview.item.thumbnail} controls playsInline preload="metadata" onError={()=>setMessage('Não foi possível reproduzir este vídeo. Tente outro arquivo.')}/></div>
  <div className="confirm-details"><span className="section-kicker">CONFIRME A SUA MÍDIA</span><h2>{preview.item.name}</h2><p>{compactTime(preview.item.duration)} · {(preview.item.size/1048576).toFixed(1)} MB · vídeo local</p><p className="muted">Reproduza para confirmar. O vídeo só entra no projeto depois da sua escolha.</p><div className="confirm-actions"><button disabled={busy} onClick={()=>void confirm()}><Icon name="check" size={18}/>{busy?'A importar…':'Usar este vídeo'}</button><button className="secondary-button" disabled={busy} onClick={()=>{setPreview(null);setMessage('');}}>Escolher outro vídeo</button></div></div>
  {message&&<p className="inline-notice" role="status">{message}</p>}
 </section>;
 return <section className="media-library">
  <div className="media-toolbar"><div className="segmented"><button aria-pressed={kind==='videos'} disabled={busy} onClick={()=>setKind('videos')}><Icon name="film" size={16}/> Vídeos</button><button aria-pressed={kind==='images'} disabled={busy} onClick={()=>setKind('images')}><Icon name="image" size={16}/> Fotos</button></div><button className="icon-button" aria-label="Atualizar biblioteca" disabled={busy} onClick={()=>void load(true)}><Icon name="sync" size={18}/></button></div>
  {permitted&&<label className="media-search"><Icon name="search" size={18}/><input type="search" aria-label="Pesquisar mídia pelo nome" placeholder="Pesquisar nas mídias carregadas" value={query} onChange={e=>setQuery(e.target.value)}/></label>}
  {access&&!permitted&&<div className="permission-card"><span className="large-icon"><Icon name="folder" size={30}/></span><h2>Os seus vídeos, aqui.</h2><p>Permita o acesso à biblioteca para escolher uma mídia do armazenamento local. Nada é enviado para a internet.</p><button disabled={busy} onClick={()=>void permit()}><Icon name="lock" size={17}/> Permitir acesso às mídias</button><small>Você mantém o controle das permissões nas definições do Android.</small></div>}
  {access?.partial&&<div className="library-access"><span>A mostrar apenas as mídias autorizadas.</span><button className="text-button" disabled={busy} onClick={()=>void permit()}>Gerir acesso</button></div>}
  {kind==='images'&&permitted&&<p className="inline-notice">Fotos disponíveis para consulta. Nesta versão, os projetos de legendas começam com um vídeo.</p>}
  <div className="media-grid">{visible.map(item=><button key={item.uri} className="media-tile" disabled={busy||kind==='images'} onClick={()=>void openPreview(item)} aria-label={'Pré-visualizar '+item.name}><div className="media-thumb">{item.thumbnail?<img src={item.thumbnail} alt="" loading="lazy" onError={e=>{e.currentTarget.style.display='none';e.currentTarget.parentElement?.classList.add('thumbnail-failed');}}/>:<div className="media-thumb-fallback"><Icon name={kind==='videos'?'film':'image'} size={28}/><small>Miniatura indisponível</small></div>}<span className="tile-play"><Icon name="play" size={15}/></span>{kind==='videos'&&<span className="media-duration">{compactTime(item.duration)}</span>}</div><strong>{item.name}</strong><small>{(item.size/1048576).toFixed(1)} MB</small></button>)}</div>
  {busy&&permitted&&!items.length&&<div className="media-grid media-skeletons" aria-hidden="true">{Array.from({length:6},(_,i)=><div key={i}><div className="media-thumb"/><span/></div>)}</div>}
  {busy&&<div className="media-loading" role="status"><span className="loading-spinner"/>A preparar a biblioteca…</div>}
  {!busy&&permitted&&!visible.length&&<div className="sheet-empty"><Icon name="search" size={28}/><h3>{query?'Nenhuma mídia encontrada.':'Ainda não há mídias acessíveis.'}</h3><p>{query?'Experimente outro nome.':'Atualize a biblioteca ou escolha mais mídias nas permissões.'}</p><button className="secondary-button" onClick={()=>query?setQuery(''):void permit()}>{query?'Limpar pesquisa':'Rever permissões'}</button></div>}
  {more&&<button className="secondary-button load-more" disabled={busy} onClick={()=>void load(false)}>Carregar mais mídias <small>({offset} carregadas)</small></button>}
  {message&&<p className="inline-notice" role="status">{message}</p>}
  {permitted&&!access?.partial&&<button className="text-button permission-manage" disabled={busy} onClick={()=>void permit()}>Gerir permissões da biblioteca</button>}
 </section>;
}
