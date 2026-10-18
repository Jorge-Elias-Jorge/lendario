import React from 'react';
import type {CSSProperties} from 'react';
import {useStore} from '../store';
import type {SubtitleStyle} from '../data/styles';
import {CAPTION_FONTS} from '../data/fonts';

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
 return <section className="caption-controls"><h3>Ajustar o estilo selecionado</h3>
 <div className="row"><label>Fonte offline<select value={st.fontFamily??'Manrope'} onChange={e=>set({fontFamily:e.target.value})}>{CAPTION_FONTS.map(f=><option key={f.family}>{f.family}</option>)}</select></label><label>Peso<select value={st.fontWeight??800} onChange={e=>set({fontWeight:+e.target.value})}><option value={400}>Regular</option><option value={600}>Seminegrito</option><option value={800}>Negrito forte</option><option value={900}>Extra forte</option></select></label></div>
 <div className="row">
  <label>Cor das letras<input type="color" value={st.color} onChange={e=>set({color:e.target.value,gradient:undefined})}/></label>
  <label>Cor do contorno<input type="color" value={st.outlineColor||'#000000'} onChange={e=>set({outlineColor:e.target.value})}/></label>
 </div>
 <label>Contorno: {st.outlineWidth||0}px<input type="range" min={0} max={8} value={st.outlineWidth||0} onChange={e=>set({outlineWidth:+e.target.value})}/></label>
 <label>Brilho / luz<input type="color" value={st.glow||'#ffffff'} onChange={e=>set({glow:e.target.value})}/></label>
 <div className="row"><button onClick={()=>set({glow:undefined})}>Remover brilho</button><button onClick={()=>set({shadow:!st.shadow})}>{st.shadow?'Remover sombra':'Adicionar sombra'}</button><button onClick={()=>set({uppercase:!st.uppercase})}>{st.uppercase?'Letras normais':'MAIÚSCULAS'}</button></div>
 <label>Alinhamento<select value={st.align||'center'} onChange={e=>set({align:e.target.value as Look['align']})}><option value="center">Centralizado</option><option value="left">À esquerda</option><option value="right">À direita</option><option value="misto">Misto — linhas equilibradas</option></select></label>
 <label>Linhas máximas: {st.maxLines??2}<input type="range" min={1} max={3} value={st.maxLines??2} onChange={e=>set({maxLines:+e.target.value})}/></label>
 <label>Tamanho: {st.fontSize}<input type="range" min={14} max={100} value={st.fontSize} onChange={e=>set({fontSize:+e.target.value})}/></label>
 <label>Posição vertical: {st.posY}%<input type="range" min={10} max={90} value={st.posY} onChange={e=>set({posY:+e.target.value})}/></label>
 <label>Posição horizontal: {st.posX??50}%<input type="range" min={5} max={95} value={st.posX??50} onChange={e=>set({posX:+e.target.value})}/></label>
 <label>Espaçamento entre letras: {st.letterSpacing??0}<input type="range" min={-1} max={8} step={.25} value={st.letterSpacing??0} onChange={e=>set({letterSpacing:+e.target.value})}/></label>
 <div className="row"><label>Cor de destaque<input type="color" value={st.highlightColor} onChange={e=>set({highlightColor:e.target.value})}/></label><label>Tipo de destaque<select value={st.highlightMode??'color'} onChange={e=>set({highlightMode:e.target.value as Look['highlightMode']})}><option value="color">Cor da palavra</option><option value="karaoke">Karaoke progressivo</option><option value="box">Marcador</option><option value="pill">Pílula</option><option value="underline">Sublinhado</option><option value="outline">Moldura</option><option value="scale">Ampliar palavra</option></select></label></div>
 <div className="row"><label>Cor do marcador<input type="color" value={st.highlightBackground??st.highlightColor} onChange={e=>set({highlightBackground:e.target.value})}/></label><label>Cor de fundo<input type="color" value={st.backgroundColor??'#141820'} onChange={e=>set({backgroundColor:e.target.value})}/></label></div>
 <div className="row"><button onClick={()=>set({backgroundColor:st.backgroundColor?undefined:'#141820'})}>{st.backgroundColor?'Remover fundo':'Adicionar fundo'}</button><button onClick={()=>set({italic:!st.italic})}>{st.italic?'Remover itálico':'Itálico'}</button><button onClick={()=>set({strokeOnly:!st.strokeOnly})}>{st.strokeOnly?'Preencher letras':'Só contorno'}</button></div>
 {st.backgroundColor&&<><label>Opacidade do fundo<input type="range" min={0} max={1} step={.05} value={st.backgroundOpacity??.9} onChange={e=>set({backgroundOpacity:+e.target.value})}/></label><label>Cantos arredondados<input type="range" min={0} max={40} value={st.backgroundRadius??0} onChange={e=>set({backgroundRadius:+e.target.value})}/></label><label>Caixas<select value={st.backgroundMode??'block'} onChange={e=>set({backgroundMode:e.target.value as Look['backgroundMode']})}><option value="block">Bloco completo</option><option value="line">Uma por linha</option></select></label></>}
 <p>Use a aba Animações para combinar movimentos. O texto ajusta o tamanho quando necessário; a indicação de linhas é uma meta, não um corte de palavras.</p>
 </section>;
}
