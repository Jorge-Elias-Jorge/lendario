import React, { useState, useRef } from 'react';
import { useStore } from './store';
import Editor from './components/Editor';
import SrtImporter from './components/SrtImporter';
import { exportVideo } from './export/exporter';
import './modern.css';

export default function App(){
 const s=useStore();
 const [page,setPage]=useState<'home'|'media'|'edit'>('home');
 const [projects,setProjects]=useState<{id:string;name:string}[]>(()=>{try{return JSON.parse(localStorage.getItem('legendario-project-list')||'[]')}catch{return []}});
 const [id,setId]=useState('');
 const [status,setStatus]=useState('');
 const [progress,setProgress]=useState<number|null>(null);
 const [output,setOutput]=useState('');
 const file=useRef<File|null>(null);
 const url=useRef('');
 const save=()=>{if(!id)return;try{localStorage.setItem('legendario-project-'+id,JSON.stringify({cues:s.cues,style:s.style,animation:s.animation}));setStatus('Edição guardada. Ao reabrir, será necessário selecionar o vídeo original.')}catch{setStatus('Não foi possível guardar: armazenamento indisponível ou cheio.')}};
 const choose=(f:File)=>{if(url.current)URL.revokeObjectURL(url.current);url.current=URL.createObjectURL(f);file.current=f;s.setVideo(url.current,f.name);if(!id){const nextId=crypto.randomUUID();setId(nextId);s.setCues([]);const next=[{id:nextId,name:f.name},...projects];setProjects(next);try{localStorage.setItem('legendario-project-list',JSON.stringify(next))}catch{setStatus('Não foi possível guardar a lista de projetos.')}}setPage('edit');setOutput('')};
 const reopen=(key:string)=>{try{const data=JSON.parse(localStorage.getItem('legendario-project-'+key)||'null');if(data){s.setCues(data.cues||[]);if(data.style)s.setStyle(data.style);if(data.animation)s.setAnimation(data.animation)}else{s.setCues([])}setId(key);setPage('media');setStatus('Selecione novamente o vídeo original deste projeto.')}catch{setStatus('Não foi possível recuperar este projeto.')}};
 const runExport=async()=>{if(!file.current)return;setProgress(0);try{const blob=await exportVideo(file.current,s.cues,s.style,setProgress);if(output)URL.revokeObjectURL(output);setOutput(URL.createObjectURL(blob));setStatus('Exportação básica concluída. Verifique o resultado: este motor ainda não preserva o áudio nem os efeitos dinâmicos.')}catch(e){setStatus('Falha na exportação: '+(e instanceof Error?e.message:String(e)))}finally{setProgress(null)}};
 return <div className={'app '+s.theme}>
 {page==='home'?<main className="home"><button className="create-project" onClick={()=>{setId('');setStatus('');setPage('media')}}>+ Criar projeto</button><h2>Os meus projetos</h2><div className="project-grid">{projects.map(p=><button className="project-card" key={p.id} onClick={()=>reopen(p.id)}><span aria-hidden="true">▶</span><strong>{p.name}</strong><small>Reabrir e selecionar vídeo original</small></button>)}</div>{!projects.length&&<p>Ainda não existem projetos.</p>}</main>:page==='media'?<main className="panel"><button onClick={()=>setPage('home')}>Voltar</button><h2>Selecionar vídeo</h2><p>Escolha o ficheiro local. O original não será alterado.</p><label className="filebtn">Selecionar vídeo<input hidden type="file" accept="video/*" onChange={e=>{const f=e.target.files?.[0];if(f)choose(f)}}/></label></main>:<><header><button onClick={()=>{save();setPage('home')}}>Projetos</button><h1>LEGENDÁRIO</h1><button onClick={save}>Guardar</button><button onClick={s.toggleTheme}>Tema</button></header><Editor/><SrtImporter/><section className="panel"><h3>Exportação básica — limitada</h3><p>As animações e o ritmo por palavra desta pré-visualização ainda não são incorporados pelo exportador atual. O áudio também não é preservado. Não use esta saída como entrega final.</p><button disabled={progress!==null} onClick={runExport}>Exportar versão básica sem áudio</button>{progress!==null&&<progress max={1} value={progress}/ >}{output&&<a href={output} download="legendario-basico.mp4">Guardar MP4 básico</a>}</section></>}
 {status&&<p role="status" className="panel">{status}</p>}
 </div>;
}
