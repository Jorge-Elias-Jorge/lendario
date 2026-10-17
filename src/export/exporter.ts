import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import { Cue } from '../core/srt';
import { SubtitleStyle } from '../data/styles';
import { wrapText } from '../core/wrap';

const pickMime=()=>{const options=['video/webm;codecs=vp9','video/webm;codecs=vp8','video/webm'];if(typeof MediaRecorder==='undefined')return '';for(const mime of options){if(MediaRecorder.isTypeSupported(mime))return mime;}return '';};

export async function exportVideo(videoFile: File, cues: Cue[], style: SubtitleStyle, onProgress?: (p: number) => void): Promise<Blob> {
  const mime = pickMime();
  if (!mime) throw new Error('Este dispositivo não suporta a gravação necessária para exportar.');
  const video = document.createElement('video');
  video.src = URL.createObjectURL(videoFile);
  await new Promise(r => video.onloadedmetadata = r);
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth || 720;
  canvas.height = video.videoHeight || 1280;
  const ctx = canvas.getContext('2d')!;
  const stream = canvas.captureStream(30);
  const rec = new MediaRecorder(stream, { mimeType: mime });
  const chunks: Blob[] = [];
  rec.ondataavailable = e => { if (e.data.size) chunks.push(e.data); };
  const stopped = new Promise<void>(r => rec.onstop = () => r());
  rec.start();
  await video.play();
  const align = style.align === 'left' ? 'left' : style.align === 'right' ? 'right' : 'center';
  const scale = canvas.width / 720;
  const fontSize = style.fontSize * scale;
  const lineHeight = fontSize * 1.25;
  ctx.font = `${style.fontWeight ?? 800} ${fontSize}px ${style.fontFamily ?? 'sans-serif'}`;
  ctx.fillStyle = style.color;
  ctx.strokeStyle = style.outlineColor ?? '#000000';
  ctx.lineWidth = (style.outlineWidth ?? 0) * 2;
  ctx.textAlign = align as CanvasTextAlign;
  ctx.textBaseline = 'middle';
  const draw = () => {
    if (video.ended || video.paused && !video.ended) { if (video.ended) rec.stop(); return; }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const cue = cues.find(c => video.currentTime >= c.start && video.currentTime < c.end);
    if (cue) {
      const lines = wrapText(cue.text, style.maxLines ?? 2, style.align === 'misto' ? 26 : 24);
      const x = align === 'left' ? canvas.width * 0.06 : align === 'right' ? canvas.width * 0.94 : canvas.width / 2;
      const startY = canvas.height * (style.posY / 100) - (lines.length - 1) * lineHeight / 2;
      lines.forEach((line, i) => {
        const y = startY + i * lineHeight;
        if ((style.outlineWidth ?? 0) > 0) ctx.strokeText(line, x, y);
        ctx.fillText(line, x, y);
      });
    }
    onProgress?.(video.duration ? video.currentTime / video.duration : 0);
    requestAnimationFrame(draw);
  };
  requestAnimationFrame(draw);
  await new Promise<void>(r => { const check = () => { if (video.ended) r(); else setTimeout(check, 100); }; check(); });
  await stopped;
  URL.revokeObjectURL(video.src);
  const webm = new Blob(chunks, { type: mime });
  try {
    const ffmpeg = new FFmpeg();
    await ffmpeg.load({
      coreURL: await toBlobURL('https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.js', 'text/javascript'),
      wasmURL: await toBlobURL('https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.wasm', 'application/wasm')
    });
    await ffmpeg.writeFile('in.webm', await fetchFile(webm));
    await ffmpeg.exec(['-i', 'in.webm', '-c:v', 'libx264', '-preset', 'veryfast', '-pix_fmt', 'yuv420p', 'out.mp4']);
    const data = await ffmpeg.readFile('out.mp4');
    return new Blob([data], { type: 'video/mp4' });
  } catch {
    return webm;
  }
}
