import React, { useRef } from 'react';
import { useStore } from './store';
import SrtImporter from './components/SrtImporter';
import Editor from './components/Editor';
import { exportVideo } from './export/exporter';
import { useState } from 'react';

export default function App() {
  const { videoUrl, setVideo, cues, style, theme, toggleTheme } = useStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [exportUrl, setExportUrl] = useState<string | null>(null);

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setVideo(URL.createObjectURL(f), f.name);
  };

  const doExport = async () => {
    if (!fileRef.current?.files?.[0]) return;
    setProgress(0);
    const blob = await exportVideo(fileRef.current.files[0], cues, style, setProgress);
    setExportUrl(URL.createObjectURL(blob));
    setProgress(null);
  };

  return (
    <div className={`app ${theme}`}>
      <header>
        <h1>LEGENDÁRIO</h1>
        <label className="filebtn">+ Criar projeto<input type="file" accept="video/*" ref={fileRef} onChange={onFile} hidden /></label>
        <button onClick={toggleTheme}>{theme === 'dark' ? '☀️ Claro' : '🌙 Escuro'}</button>
      </header>
      {videoUrl ? <Editor /> : <p className="empty">Selecione um vídeo para começar.</p>}
      <SrtImporter />
      <div className="panel">
        <h3>Exportação</h3>
        <button onClick={doExport} disabled={!videoUrl || progress !== null}>Exportar MP4 com legendas</button>
        {progress !== null && <progress value={progress} max={1} />}
        {exportUrl && <a href={exportUrl} download="legendario.mp4">Descarregar vídeo exportado</a>}
      </div>
    </div>
  );
}