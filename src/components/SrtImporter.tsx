import React, { useState } from 'react';
import { parseSRT } from '../core/srt';
import { useStore } from '../store';

export default function SrtImporter() {
  const [text, setText] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [preview, setPreview] = useState(false);
  const cues = useStore(s => s.cues);
  const setCues = useStore(s => s.setCues);
  const select = useStore(s => s.select);
  const result = parseSRT(text);
  const change = (value: string) => { setText(value); setMessage(''); setErrors([]); setPreview(false); };
  const validate = () => {
    const r = parseSRT(text);
    setErrors(r.errors);
    setMessage(r.errors.length ? 'Corrija os erros antes de aplicar.' : `${r.cues.length} legendas válidas. Confirme abaixo para aplicar.`);
  };
  const apply = (mode: 'add' | 'replace') => {
    const r = parseSRT(text);
    setErrors(r.errors);
    if (r.errors.length || !r.cues.length) { setMessage('Importação não aplicada. Corrija o SRT.'); return; }
    const next = mode === 'add' ? [...cues, ...r.cues] : r.cues;
    setCues(next.sort((a,b) => a.start - b.start));
    select(r.cues[0].id);
    setMessage(`${r.cues.length} legendas aplicadas. Na linha temporal, toque na primeira legenda para ir ao seu início e reproduza o vídeo.`);
  };
  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    try { change((await f.text()).replace(/^\uFEFF/, '')); }
    catch { setMessage('Não foi possível ler o ficheiro. Selecione-o novamente.'); }
    e.target.value = '';
  };
  return <section className="panel">
    <h3>Importar legendas SRT</h3>
    <p>Selecione um vídeo e importe as legendas. O texto aparece apenas nos intervalos definidos no SRT.</p>
    <textarea aria-label="Texto SRT" rows={8} value={text} onChange={e => change(e.target.value)} placeholder={'1\n00:00:01,000 --> 00:00:04,000\nA sua legenda aqui.'} />
    <div className="row">
      <button onClick={async () => { try { change(await navigator.clipboard.readText()); } catch { setMessage('Não foi possível aceder à área de transferência. Mantenha pressionada a caixa e escolha Colar.'); } }}>Colar texto</button>
      <label className="filebtn">Importar ficheiro<input type="file" accept=".srt,text/plain,application/x-subrip" onChange={handleFile} hidden /></label>
      <button onClick={validate}>Validar SRT</button>
      <button onClick={() => { validate(); setPreview(true); }}>Pré-visualizar</button>
    </div>
    {message && <p role="status" className="notice">{message}</p>}
    {errors.length > 0 && <ul role="alert" className="errors">{errors.map((e,i) => <li key={i}>{e}</li>)}</ul>}
    {preview && <ol className="srt-preview">{result.cues.slice(0,100).map(c => <li key={c.id}><small>{c.start.toFixed(3)} s → {c.end.toFixed(3)} s</small><br/>{c.text}</li>)}</ol>}
    <div className="row">
      <button disabled={!result.cues.length || result.errors.length > 0} onClick={() => apply('add')}>Adicionar ao projeto</button>
      {cues.length > 0 && <button disabled={!result.cues.length || result.errors.length > 0} onClick={() => { if (window.confirm('Substituir todas as legendas atuais pelas legendas deste SRT?')) apply('replace'); }}>Substituir legendas atuais</button>}
      <button onClick={() => change('')}>Limpar importação</button>
    </div>
  </section>;
}
