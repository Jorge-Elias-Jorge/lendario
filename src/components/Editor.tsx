import React, { useRef, useState } from 'react';
import { useStore } from '../store';
import { STYLES } from '../data/styles';
import { ANIMATIONS } from '../data/animations';
import { formatTime } from '../core/srt';

export default function Editor() {
  const { videoUrl, cues, selectedCueId, style, animation, select, updateCue, setStyle, setAnimation } = useStore();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [time, setTime] = useState(0);

  const active = cues.find(c => time >= c.start && time <= c.end);
  const selected = cues.find(c => c.id === selectedCueId);

  const seek = (t: number) => { if (videoRef.current) { videoRef.current.currentTime = t; setTime(t); } };

  return (
    <div className="editor">
      <div className="preview">
        {videoUrl && <video ref={videoRef} src={videoUrl} onTimeUpdate={e => setTime(e.currentTarget.currentTime)} controls />}
        {active && (
          <div className="subtitle-overlay" style={{
            bottom: `${100 - style.posY}%`, textAlign: style.align,
            fontFamily: style.fontFamily, fontSize: style.fontSize, fontWeight: style.weight,
            color: style.color, WebkitTextStroke: `${style.outlineWidth}px ${style.outlineColor}`,
            textShadow: style.shadow ? '2px 2px 6px rgba(0,0,0,0.8)' : 'none',
            background: style.background || 'transparent', padding: style.background ? '4px 10px' : 0
          }}>{active.text}</div>
        )}
      </div>
      <div className="timeline">
        {cues.map(c => (
          <div key={c.id}
            className={`cue ${c.id === selectedCueId ? 'selected' : ''}`}
            style={{ left: `${(c.start / (videoRef.current?.duration || 1)) * 100}%`, width: `${((c.end - c.start) / (videoRef.current?.duration || 1)) * 100}%` }}
            onClick={() => { select(c.id); seek(c.start); }}
            title={`${formatTime(c.start)} → ${formatTime(c.end)}`}
          >{c.text.slice(0, 30)}</div>
        ))}
      </div>
      <div className="time">{formatTime(time)}</div>
      {selected && (
        <div className="panel">
          <h3>Editar legenda</h3>
          <textarea value={selected.text} onChange={e => updateCue(selected.id, { text: e.target.value })} />
          <div className="row">
            <label>Início (s)<input type="number" step="0.01" value={selected.start} onChange={e => updateCue(selected.id, { start: +e.target.value })} /></label>
            <label>Fim (s)<input type="number" step="0.01" value={selected.end} onChange={e => updateCue(selected.id, { end: +e.target.value })} /></label>
          </div>
        </div>
      )}
      <div className="panel">
        <h3>Estilo ({STYLES.length} disponíveis)</h3>
        <select value={style.id} onChange={e => setStyle(STYLES.find(s => s.id === e.target.value)!) }>
          {STYLES.map(s => <option key={s.id} value={s.id}>{s.category} — {s.name}</option>)}
        </select>
        <h3>Animação ({ANIMATIONS.length} disponíveis)</h3>
        <select value={animation.id} onChange={e => setAnimation(ANIMATIONS.find(a => a.id === e.target.value)!) }>
          {ANIMATIONS.map(a => <option key={a.id} value={a.id}>{a.type} — {a.name}</option>)}
        </select>
      </div>
    </div>
  );
}