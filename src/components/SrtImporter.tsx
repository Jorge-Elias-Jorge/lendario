import React, { useState } from 'react';
import { parseSRT } from '../core/srt';
import { useStore } from '../store';

export default function SrtImporter() {
  const [text, setText] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const setCues = useStore(s => s.setCues);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const content = await f.text();
    setText(content);
  };

  const validate = () => {
    const { cues, errors } = parseSRT(text);
    setErrors(errors);
    if (cues.length && errors.length === 0) setCues(cues);
    return cues;
  };

  const apply = () => {
    const { cues, errors } = parseSRT(text);
    setErrors(errors);
    if (cues.length) setCues(cues);
  };

  return (
    <div className="panel">
      <h3>Importar SRT</h3>
      <textarea rows={10} value={text} onChange={e => setText(e.target.value)} placeholder="Cole aqui o conteúdo SRT..." />
      <div className="row">
        <button onClick={() => navigator.clipboard.readText().then(setText)}>Colar texto</button>
        <button onClick={validate}>Validar SRT</button>
        <button onClick={apply}>Adicionar ao projeto</button>
        <label className="filebtn">Importar ficheiro<input type="file" accept=".srt,text/plain" onChange={handleFile} hidden /></label>
      </div>
      {errors.length > 0 && <ul className="errors">{errors.map((e, i) => <li key={i}>{e}</li>)}</ul>}
    </div>
  );
}