import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import { Cue } from '../core/srt';
import { SubtitleStyle } from '../data/styles';

export async function exportVideo(videoFile: File, cues: Cue[], style: SubtitleStyle, onProgress?: (p: number) => void): Promise<Blob> {
  const video = document.createElement('video');
  video.src = URL.createObjectURL(videoFile);
  await new Promise(r => video.onloadedmetadata = r);
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth; canvas.height = video.videoHeight;
  const ctx = canvas.getContext('2d')!;
  const stream = canvas.captureStream(30);
  const rec = new MediaRecorder(stream, { mimeType: 'video/webm' });
  const chunks: Blob[] = [];
  rec.ondataavailable = e => chunks.push(e.data);
  rec.start();
  video.play();
  const draw = () => {
    if (video.ended) { rec.stop(); return; }
    ctx.drawImage(video, 0, 0);
    const cue = cues.find(c => video.currentTime >= c.start && video.currentTime <= c.end);
    if (cue) {
      ctx.font = `${style.weight} ${style.fontSize * (canvas.width / 720)}px ${style.fontFamily}`;
      ctx.fillStyle = style.color;
      ctx.strokeStyle = style.outlineColor;
      ctx.lineWidth = style.outlineWidth * 2;
      ctx.textAlign = style.align as CanvasTextAlign;
      const x = style.align === 'left' ? 40 : style.align === 'right' ? canvas.width - 40 : canvas.width / 2;
      const y = canvas.height * (style.posY / 100);
      cue.text.split('\n').forEach((line, i) => {
        ctx.strokeText(line, x, y + i * style.fontSize * 1.3);
        ctx.fillText(line, x, y + i * style.fontSize * 1.3);
      });
    }
    onProgress?.(video.currentTime / video.duration);
    requestAnimationFrame(draw);
  };
  draw();
  await new Promise(r => rec.onstop = r);
  const webm = new Blob(chunks, { type: 'video/webm' });

  const ffmpeg = new FFmpeg();
  await ffmpeg.load({
    coreURL: await toBlobURL('https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.js', 'text/javascript'),
    wasmURL: await toBlobURL('https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.wasm', 'application/wasm')
  });
  await ffmpeg.writeFile('in.webm', await fetchFile(webm));
  await ffmpeg.exec(['-i', 'in.webm', '-c:v', 'libx264', '-c:a', 'aac', 'out.mp4']);
  const data = await ffmpeg.readFile('out.mp4');
  return new Blob([data], { type: 'video/mp4' });
}