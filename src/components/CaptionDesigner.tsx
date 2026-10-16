import React,{useState} from 'react';
import {useStore} from '../store';
import {SubtitleStyle} from '../data/styles';
export type Look=SubtitleStyle&{glow?:number;gradient?:string;radius?:number;tracking?:number;defaultMotion?:string};
export function lookPaint(st:Look):React.CSSProperties{return {fontFamily:st.fontFamily,fontWeight:st.weight,color:st.color,WebkitTextStroke:`${st.outlineWidth}px ${st.outlineColor}`,paintOrder:'stroke fill',textShadow:st.glow?`0 0 ${st.glow}px ${st.highlightColor},0 0 ${st.glow*2}px ${st.highlightColor}`:st.shadow?'2px 3px 5px #000':'none',textAlign:st.align,borderRadius:st.radius||0,letterSpacing:(st.tracking||0)+'px',...(st.gradient?{backgroundImage:st.gradient,backgroundClip:'text',WebkitBackgroundClip:'text',color:'transparent'}:{background:st.background||'transparent'})}};
export const MOTIONS=['Sem animação','Saltar','Pular','Cair','Deslizar','Aproximar','Pulsar','Girar','Tremer','Revelar','Elasticidade','Flutuar','Piscar'];
const recipes:[string,Partial<Look>][]=[
 ['Impacto Branco',{fontFamily:'sans-serif',weight:900,color:'#ffffff',outlineWidth:2,shadow:1,defaultMotion:'Pular'}],
 ['Néon Elétrico',{fontFamily:'sans-serif',color:'#ffffff',glow:12,highlightColor:'#00e5ff',outlineWidth:0,defaultMotion:'Piscar'}],
 ['Néon Magenta',{fontFamily:'monospace',color:'#fff0ff',glow:16,highlightColor:'#ff39cc',outlineWidth:0,tracking:2,defaultMotion:'Pulsar'}],
 ['Ouro Líquido',{fontFamily:'serif',gradient:'linear-gradient(115deg,#80530d,#fff2b3,#c78d24,#fff2b3)',outlineWidth:0,weight:900,defaultMotion:'Revelar'}],
 ['Prisma',{gradient:'linear-gradient(100deg,#53efff,#ff66dc,#ffe581)',outlineWidth:0,defaultMotion:'Aproximar'}],
 ['Caixa Editorial',{background:'#f4f0e8',color:'#161616',fontFamily:'serif',outlineWidth:0,radius:4,defaultMotion:'Deslizar'}],
 ['Pílula Ativa',{background:'#161622',color:'#ffffff',highlightColor:'#aaff00',radius:22,outlineWidth:0,defaultMotion:'Saltar'}],
 ['Máquina Documental',{fontFamily:'monospace',background:'#000000',color:'#ffffff',outlineWidth:0,tracking:1,defaultMotion:'Revelar'}],
 ['Cinema Silencioso',{fontFamily:'serif',weight:400,color:'#ffffff',tracking:3,outlineWidth:0,shadow:1,defaultMotion:'Cair'}],
 ['Arcade',{fontFamily:'monospace',weight:900,color:'#89ff7e',outlineWidth:2,outlineColor:'#172113',defaultMotion:'Tremer'}],
 ['Flutuação',{fontFamily:'sans-serif',color:'#ffffff',shadow:1,defaultMotion:'Flutuar'}],
 ['Manchete',{fontFamily:'sans-serif',weight:900,background:'#bd202b',color:'#ffffff',outlineWidth:0,defaultMotion:'Elasticidade'}]
];
export default function CaptionDesigner(){
 const s=useStore();const st=s.style as Look;
 const [name,setName]=useState(''),[notice,setNotice]=useState('');
 const [saved,setSaved]=useState<Look[]>(()=>{try{return JSON.parse(localStorage.getItem('legendario-custom-looks')||'[]')}catch{return []}});
 const patch=(v:Partial<Look>)=>s.setStyle({...st,...v});
 const looks=recipes.map(([name,v],i)=>({...st,glow:0,gradient:undefined,background:null,tracking:0,radius:0,outlineColor:'#000000',...v,id:'original-'+i,name,category:'Originais LEGENDÁRIO'} as Look));
 const store=()=>{if(!name.trim()){setNotice('Escreva um nome para a variação.');return}const item={...st,id:crypto.randomUUID(),name:name.trim(),category:'Personalizadas'};try{const next=[item,...saved];localStorage.setItem('legendario-custom-looks',JSON.stringify(next));setSaved(next);s.setStyle(item);setNotice('Variação guardada neste dispositivo.')}catch{setNotice('Não foi possível guardar a variação.')}};
 return <details className="panel"><summary>Legenda personalizada · néon, brilho e tipografia</summary><p>Estilos originais. Ajustes globais de pré-visualização; não são recursos proprietários do CapCut.</p><div className="style-grid">{[...looks,...saved].map(v=><button key={v.id} className="style-card" onClick={()=>s.setStyle(v)}><span className="style-example" style={lookPaint(v)}>A SUA HISTÓRIA</span><strong>{v.name}</strong><small>{v.defaultMotion||'Sem animação'}</small></button>)}</div>
 <label>Tipo de letra<select value={st.fontFamily} onChange={e=>patch({fontFamily:e.target.value})}>{Array.from(new Set([st.fontFamily,'sans-serif','serif','monospace','Arial','Georgia','Verdana','Courier New'])).map(f=><option key={f}>{f}</option>)}</select></label><small>As fontes dependem das disponíveis no dispositivo; os nomes não significam fontes licenciadas incluídas.</small>
 <label>Peso<select value={st.weight} onChange={e=>patch({weight:+e.target.value})}>{[400,700,900].map(n=><option key={n}>{n}</option>)}</select></label>
 <label>Cor do realce e brilho<input type="color" value={st.highlightColor} onChange={e=>patch({highlightColor:e.target.value})}/></label><label>Brilho: {st.glow||0}<input type="range" min={0} max={24} value={st.glow||0} onChange={e=>patch({glow:+e.target.value})}/></label>
 <label>Contorno: {st.outlineWidth}<input type="range" min={0} max={5} step={.5} value={st.outlineWidth} onChange={e=>patch({outlineWidth:+e.target.value})}/></label><label>Cor do contorno<input type="color" value={st.outlineColor} onChange={e=>patch({outlineColor:e.target.value})}/></label>
 <label>Acabamento<select value={st.gradient||''} onChange={e=>patch({gradient:e.target.value||undefined})}><option value="">Cor sólida / fundo</option><option value="linear-gradient(115deg,#80530d,#fff2b3,#c78d24,#fff2b3)">Dourado</option><option value="linear-gradient(100deg,#53efff,#ff66dc,#ffe581)">Prisma</option></select></label>
 <label>Fundo<input type="color" value={st.background?.startsWith('#')?st.background:'#161622'} onChange={e=>patch({background:e.target.value,gradient:undefined})}/></label><button onClick={()=>patch({background:null})}>Sem fundo</button>
 <label>Cantos: {st.radius||0}<input type="range" min={0} max={30} value={st.radius||0} onChange={e=>patch({radius:+e.target.value})}/></label><label>Espaçamento<input type="range" min={-1} max={8} step={.25} value={st.tracking||0} onChange={e=>patch({tracking:+e.target.value})}/></label><label>Animação associada<select value={st.defaultMotion||'Sem animação'} onChange={e=>patch({defaultMotion:e.target.value})}>{MOTIONS.map(m=><option key={m}>{m}</option>)}</select></label>
 <input aria-label="Nome da variação" placeholder="Nome da sua legenda" value={name} onChange={e=>setName(e.target.value)}/><button onClick={store}>Guardar variação</button>{notice&&<p role="status">{notice}</p>}</details>;
}
