import React,{useEffect,useId,useRef} from 'react';
import {createPortal} from 'react-dom';
import {useStore} from '../store';
import Icon from './Icon';
export default function ToolSheet({title,subtitle,onClose,children,wide=false}:{title:string;subtitle?:string;onClose:()=>void;children:React.ReactNode;wide?:boolean}){
 const theme=useStore(s=>s.theme),ref=useRef<HTMLDivElement>(null),heading=useId(),close=useRef(onClose);
 close.current=onClose;
 useEffect(()=>{
  const previous=document.activeElement as HTMLElement|null,overflow=document.body.style.overflow;
  document.body.style.overflow='hidden';
  ref.current?.focus();
  const key=(e:KeyboardEvent)=>{
   if(e.key==='Escape'){e.preventDefault();e.stopPropagation();close.current();return;}
   if(e.key!=='Tab')return;
   const focusable=Array.from(ref.current?.querySelectorAll<HTMLElement>('button:not(:disabled),a[href],input:not(:disabled):not([type=hidden]),textarea:not(:disabled),select:not(:disabled),summary,[tabindex="0"]')??[]).filter(el=>el.getClientRects().length>0);
   const first=focusable[0],last=focusable[focusable.length-1];
   if(!first){e.preventDefault();return;}
   if(e.shiftKey&&(document.activeElement===first||document.activeElement===ref.current)){e.preventDefault();last.focus();}
   else if(!e.shiftKey&&(document.activeElement===last||document.activeElement===ref.current)){e.preventDefault();first.focus();}
  };
  document.addEventListener('keydown',key);
  return()=>{document.body.style.overflow=overflow;document.removeEventListener('keydown',key);if(previous?.isConnected)previous.focus();};
 },[]);
 return createPortal(<div className={'workspace-layer '+theme}>
  <button className="sheet-scrim" aria-label={'Fechar '+title} tabIndex={-1} onClick={onClose}/>
  <div className={'tool-sheet '+(wide?'wide':'')} role="dialog" aria-modal="true" aria-labelledby={heading} tabIndex={-1} ref={ref}>
   <div className="sheet-handle"/><div className="sheet-header"><div><span className="section-kicker">{subtitle??'LEGENDÁRIO / FERRAMENTA'}</span><h2 id={heading}>{title}</h2></div><button className="icon-button" aria-label="Fechar painel" onClick={onClose}><Icon name="close"/></button></div>
   <div className="sheet-content">{children}</div>
  </div>
 </div>,document.body);
}
