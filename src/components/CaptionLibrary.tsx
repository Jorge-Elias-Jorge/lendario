import React,{memo,useMemo,useState} from 'react';
import {STYLES,STYLE_CATEGORIES} from '../data/styles';
import {ANIMATIONS,ANIMATION_CATEGORIES,type AnimationMode} from '../data/animations';
import {useStore} from '../store';
import {tracksFor} from '../core/motion';
import CaptionPreview from './CaptionPreview';
const scopes:Record<AnimationMode,string>={in:'Entrada',out:'Saída',loop:'Contínua',word:'Palavra',char:'Letra',line:'Linha',highlight:'Destaque'};
function CaptionLibrary({kind}:{kind:'styles'|'animations'}){
 const s=useStore(),[query,setQuery]=useState(''),[category,setCategory]=useState('Todas'),[hover,setHover]=useState(''),[focusMode,setFocusMode]=useState<AnimationMode>('in');
 const tracks=tracksFor(s.style,s.effectMs),active=tracks.find(t=>t.mode===focusMode);
 const data=kind==='styles'?STYLES:ANIMATIONS,categories=kind==='styles'?STYLE_CATEGORIES:ANIMATION_CATEGORIES;
 const normalize=(t:string)=>t.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 const visible=useMemo(()=>STYLES.filter(v=>(category==='Todas'||v.category===category)&&normalize(v.name+' '+v.category).includes(normalize(query))),[category,query]);
 // Animation categories are groups, not animation data fields. Keep membership explicit.
 const items=kind==='styles'?visible:ANIMATIONS.filter(a=>(category==='Todas'||animationGroup(category).has(a.id))&&normalize(a.name+' '+scopes[a.mode]+' '+a.type).includes(normalize(query)));
 return <div className="caption-library">
  <div className="library-heading"><div><small className="eyebrow">LEGENDÁRIO STUDIO / OFFLINE</small><h2>{kind==='styles'?'Uma história. Muitas vozes.':'Dê ritmo a cada palavra.'}</h2><p>{kind==='styles'?`${STYLES.length} estilos, fontes incluídas e visuais editáveis.`:`${ANIMATIONS.length} animações combináveis em sete camadas.`}</p></div><span className="catalog-count">{data.length}<small>{kind==='styles'?'estilos':'animações'}</small></span></div>
  <div className="library-filter"><label>Pesquisar<input type="search" placeholder={kind==='styles'?'Ex.: karaoke, podcast, neon':'Ex.: letras, zoom, saída'} value={query} onChange={e=>setQuery(e.target.value)}/></label><label>Família<select value={category} onChange={e=>setCategory(e.target.value)}><option>Todas</option>{categories.map(c=><option key={c}>{c}</option>)}</select></label></div>
  {kind==='animations'&&<div className="tracks-panel"><div className="row"><h3>Composição de movimento</h3><button className="quiet-button" onClick={()=>s.setStyle({...s.style,defaultMotion:'Sem animação',animationTracks:{}})}>Limpar animações</button></div>
   <div className="track-list">{Object.entries(scopes).map(([mode,label])=><button key={mode} className={'track-chip '+(focusMode===mode?'active':'')} onClick={()=>setFocusMode(mode as AnimationMode)}><small>{label}</small><strong>{tracks.find(t=>t.mode===mode)?.name??'Não aplicada'}</strong></button>)}</div>
   {active?<div className="track-controls"><label>Duração: {active.duration} ms<input type="range" min={80} max={4000} step={20} value={active.duration} onChange={e=>s.patchAnimation(focusMode,{duration:+e.target.value})}/></label><label>Intensidade: {active.intensity.toFixed(1)}<input type="range" min={0} max={1.5} step={.1} value={active.intensity} onChange={e=>s.patchAnimation(focusMode,{intensity:+e.target.value})}/></label><label>Curva<select value={active.easing??'easeOut'} onChange={e=>s.patchAnimation(focusMode,{easing:e.target.value as typeof active.easing})}><option value="easeOut">Suave na chegada</option><option value="easeInOut">Suave nos dois lados</option><option value="linear">Linear</option><option value="back">Ultrapassagem</option></select></label><button onClick={()=>s.patchAnimation(focusMode,null)}>Remover {scopes[focusMode].toLowerCase()}</button></div>:<p>Escolha uma animação abaixo. Cada categoria aplica-se à sua própria camada, sem apagar as outras.</p>}
  </div>}
  <div className="library-results" role="status">{items.length} resultados<span>Prévia com o mesmo motor Canvas do editor</span></div>
  {!items.length&&<div className="catalog-empty"><h3>Nenhum resultado nesta seleção.</h3><p>Tente outro termo ou limpe os filtros para ver a biblioteca completa.</p><button onClick={()=>{setQuery('');setCategory('Todas');}}>Limpar filtros</button></div>}
  <div className="catalog-grid">{items.map(item=>{
   const styleItem='category'in item?item:undefined,animation='type'in item?item:undefined;
   const selected=styleItem?s.style.id===item.id:tracks.some(t=>t.id===item.id);
   const preview=styleItem??{...s.style,presentation:animation?.mode==='highlight'?'Realce ativo' as const:s.presentation,defaultMotion:'Sem animação',animationTracks:animation?{[animation.mode]:animation}:{}};
   return <button key={item.id} className={'catalog-card '+(selected?'selected':'')} aria-pressed={selected} onMouseEnter={()=>setHover(item.id)} onMouseLeave={()=>setHover('')} onFocus={()=>setHover(item.id)} onBlur={()=>setHover('')} onClick={()=>{if(styleItem)s.setStyle(styleItem);else if(animation){s.setAnimation(animation);setFocusMode(animation.mode);}}}>
    <div className="catalog-scene"><div className="scene-grid"/><span className="scene-index">{styleItem?.category??scopes[animation!.mode]}</span><CaptionPreview style={preview} animate={hover===item.id} label={'Prévia: '+item.name}/>{selected&&<span className="selected-mark">Aplicado</span>}</div>
    <div className="catalog-caption"><strong>{item.name}</strong><small>{styleItem?`${styleItem.fontFamily??'Fonte do sistema'} / ${styleItem.presentation??'Frase'}`:`${scopes[animation!.mode]} / ${animation!.type}`}</small></div>
   </button>;
  })}</div>
  <p className="library-note">Estilos originais inspirados em linguagens visuais de vídeos curtos, entrevistas e documentários. Não inclui pacotes, marcas d’água ou recursos pagos copiados de terceiros.</p>
 </div>;
}
import {ANIMATION_GROUPS} from '../data/animations';
function animationGroup(category:string){return new Set((ANIMATION_GROUPS[category]??[]).map(a=>a.id));}
export default memo(CaptionLibrary);
