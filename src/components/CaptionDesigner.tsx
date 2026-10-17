import React from 'react';
import type {CSSProperties} from 'react';
import {useStore} from '../store';
import type {SubtitleStyle} from '../data/styles';

export type Look=SubtitleStyle;

export const MOTIONS=['Sem animação','Saltar','Pular','Cair','Deslizar','Aproximar','Pulsar','Girar','Tremer','Revelar','Elasticidade','Flutuar','Piscar','Neon','Glitch','Onda','Zoom viral','Bounce'];

export const lookPaint=(v:Look):CSSProperties=>{
 const styles:CSSProperties={color:v.color,fontWeight:v.fontWeight??800,textTransform:v.uppercase?'uppercase':undefined};
 if(v.gradient){styles.backgroundImage=v.gradient;styles.WebkitBackgroundClip='text';styles.WebkitTextFillColor='transparent';}
 if(v.outlineWidth&&v.outlineWidth>0)styles.WebkitTextStroke=`${v.outlineWidth}px ${v.outlineColor||'#000000'}`;
 if(v.glow)styles.textShadow=`0 0 14px ${v.glow}, 0 0 30px ${v.glow}`;
 else if(v.shadow)styles.textShadow='0 2px 8px rgba(0,0,0,.65)';
 return styles;
};

export default function CaptionDesigner(){
 const s=useStore();const st=s.style as Look;
 const set=(patch:Partial<Look>)=>s.setStyle({...st,...patch} as Look);
 return <section className="panel"><h3>Ajustar o estilo selecionado</h3>
 <div className="row">
  <label>Cor das letras<input type="color" value={st.color} onChange={e=>set({color:e.target.value,gradient:undefined})}/></label>
  <label>Cor do contorno<input type="color" value={st.outlineColor||'#000000'} onChange={e=>set({outlineColor:e.target.value})}/></label>
 </div>
 <label>Contorno: {st.outlineWidth||0}px<input type="range" min={0} max={8} value={st.outlineWidth||0} onChange={e=>set({outlineWidth:+e.target.value})}/></label>
 <label>Brilho / luz<input type="color" value={st.glow||'#ffffff'} onChange={e=>set({glow:e.target.value})}/></label>
 <div className="row"><button onClick={()=>set({glow:undefined})}>Remover brilho</button><button onClick={()=>set({shadow:!st.shadow})}>{st.shadow?'Remover sombra':'Adicionar sombra'}</button><button onClick={()=>set({uppercase:!st.uppercase})}>{st.uppercase?'Letras normais':'MAIÚSCULAS'}</button></div>
 <label>Tamanho: {st.fontSize}<input type="range" min={14} max={100} value={st.fontSize} onChange={e=>set({fontSize:+e.target.value})}/></label>
 <label>Posição vertical: {st.posY}%<input type="range" min={10} max={90} value={st.posY} onChange={e=>set({posY:+e.target.value})}/></label>
 <label>Animação<select value={st.defaultMotion||'Sem animação'} onChange={e=>set({defaultMotion:e.target.value})}>{MOTIONS.map(m=><option key={m}>{m}</option>)}</select></label>
 <p>Para uma legenda estática de cor única: escolha a cor, remova o brilho e selecione “Sem animação”.</p>
 </section>;
}
