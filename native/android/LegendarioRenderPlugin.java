package com.legendario.editor;

import android.media.MediaExtractor;
import android.media.MediaFormat;
import android.net.Uri;
import android.os.Build;
import android.os.Handler;
import android.os.HandlerThread;
import android.view.WindowManager;
import androidx.media3.common.MediaItem;
import androidx.media3.common.MimeTypes;
import androidx.media3.common.util.UnstableApi;
import androidx.media3.effect.OverlayEffect;
import androidx.media3.transformer.AudioEncoderSettings;
import androidx.media3.transformer.Composition;
import androidx.media3.transformer.DefaultEncoderFactory;
import androidx.media3.transformer.EditedMediaItem;
import androidx.media3.transformer.EditedMediaItemSequence;
import androidx.media3.transformer.Effects;
import androidx.media3.transformer.ExportException;
import androidx.media3.transformer.ExportResult;
import androidx.media3.transformer.ProgressHolder;
import androidx.media3.transformer.Transformer;
import androidx.media3.transformer.VideoEncoderSettings;
import com.getcapacitor.*;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.File;
import java.util.Collections;
import java.util.UUID;

/** All Transformer access, including cancellation, stays on one application looper. */
@UnstableApi
@CapacitorPlugin(name = "LegendarioRender")
public class LegendarioRenderPlugin extends Plugin {
    private HandlerThread thread;
    private Handler handler;
    private Transformer transformer;
    private PluginCall pending;
    private File output;
    private boolean screenWasKeptOn;
    private boolean screenRequested;
    private Runnable progressPoll;

    @Override public void load() {
        thread = new HandlerThread("legendario-export");
        thread.start();
        handler = new Handler(thread.getLooper());
    }

    private void keepScreen(boolean enabled) {
        getActivity().runOnUiThread(() -> {
            if (enabled) {
                screenRequested = true;
                screenWasKeptOn = (getActivity().getWindow().getAttributes().flags
                        & WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON) != 0;
                getActivity().getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
            } else if (screenRequested) {
                if (!screenWasKeptOn) getActivity().getWindow().clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
                screenRequested = false;
            }
        });
    }

    @PluginMethod public void render(PluginCall call) {
        if(LegendarioSpeechEngine.isRunning()){
            call.reject("Aguarde a conclusão da análise de voz antes de exportar.");
            return;
        }
        handler.post(() -> {
            if (pending != null) { call.reject("Já existe uma exportação em andamento."); return; }
            pending = call;
            try {
                String source = call.getString("source");
                if (source == null) throw new IllegalArgumentException("Vídeo de origem ausente.");
                Uri uri = Uri.parse(source);
                // Never open remote URLs, data URLs or arbitrary files from a compromised WebView.
                if (!"file".equals(uri.getScheme()) || uri.getPath() == null)
                    throw new IllegalArgumentException("A origem deve ser um vídeo importado localmente.");
                File input = new File(uri.getPath()).getCanonicalFile();
                File imports = new File(getContext().getFilesDir(), "imports").getCanonicalFile();
                if (!input.getPath().startsWith(imports.getPath() + File.separator) || !input.isFile())
                    throw new IllegalArgumentException("Vídeo importado indisponível. Importe-o novamente.");
                if (call.getArray("cues") == null || call.getObject("style") == null)
                    throw new IllegalArgumentException("Legendas ou estilo inválidos.");

                long pixels = 1920L * 1080;
                float fps = 30;
                long inputBitrate = 0;
                long durationUs = 0;
                MediaExtractor probe = new MediaExtractor();
                try {
                    probe.setDataSource(input.getAbsolutePath());
                    boolean found = false;
                    for (int i = 0; i < probe.getTrackCount(); i++) {
                        MediaFormat format = probe.getTrackFormat(i);
                        String mime = format.getString(MediaFormat.KEY_MIME);
                        if (mime != null && mime.startsWith("video/")) {
                            pixels = (long) format.getInteger(MediaFormat.KEY_WIDTH) * format.getInteger(MediaFormat.KEY_HEIGHT);
                            if (format.containsKey(MediaFormat.KEY_FRAME_RATE)) {
                                try { fps = format.getInteger(MediaFormat.KEY_FRAME_RATE); }
                                catch (ClassCastException ignored) { fps = format.getFloat(MediaFormat.KEY_FRAME_RATE); }
                            }
                            if (format.containsKey(MediaFormat.KEY_BIT_RATE)) inputBitrate = format.getInteger(MediaFormat.KEY_BIT_RATE);
                            if (format.containsKey(MediaFormat.KEY_DURATION)) durationUs = format.getLong(MediaFormat.KEY_DURATION);
                            found = true; break;
                        }
                    }
                    if (!found) throw new IllegalArgumentException("Ficheiro sem faixa de vídeo.");
                } finally { probe.release(); }
                boolean ultra = "ultra".equals(call.getString("quality", "alta"));
                if (!Float.isFinite(fps) || fps <= 0) fps = 30;
                if (durationUs > 0)
                    inputBitrate = Math.max(inputBitrate, Math.round(input.length() * 8_000_000.0 / durationUs));
                // Resolution/frame-rate aware target; never silently lower the input resolution.
                int bitrate = (int) Math.min(100_000_000L, Math.max(4_000_000L,
                        Math.max(inputBitrate, Math.round(pixels * fps * (ultra ? .24 : .14)))));
                long reserve = durationUs > 0 ? (long) ((bitrate / 8.0 + 32000) * durationUs / 1_000_000 * 1.2) : 32L * 1024 * 1024;
                File dir = new File(getContext().getCacheDir(), "exports");
                if (!dir.isDirectory() && !dir.mkdirs()) throw new IllegalStateException("Armazenamento temporário indisponível.");
                if (dir.getUsableSpace() < reserve) throw new IllegalStateException("Espaço insuficiente para gerar o MP4. Liberte espaço e tente novamente.");
                output = new File(dir, "LEGENDARIO-" + UUID.randomUUID() + ".mp4");
                LegendarioCaptionOverlay overlay = new LegendarioCaptionOverlay(
                        call.getArray("cues"), call.getObject("style"),
                        call.getString("presentation", "Frase"), call.getInt("effectMs", 300),getContext());
                EditedMediaItem item = new EditedMediaItem.Builder(MediaItem.fromUri(Uri.fromFile(input)))
                        .setEffects(new Effects(Collections.emptyList(),
                                Collections.singletonList(new OverlayEffect(Collections.singletonList(overlay)))))
                        .build();
                DefaultEncoderFactory encoder = new DefaultEncoderFactory.Builder(getContext())
                        // Reject unsupported resolutions instead of silently exporting a smaller video.
                        .setEnableFallback(false)
                        .setRequestedVideoEncoderSettings(new VideoEncoderSettings.Builder().setBitrate(bitrate).build())
                        .setRequestedAudioEncoderSettings(new AudioEncoderSettings.Builder().setBitrate(ultra ? 256000 : 192000).build())
                        .build();
                transformer = new Transformer.Builder(getContext())
                        .setLooper(thread.getLooper())
                        .setVideoMimeType(MimeTypes.VIDEO_H264)
                        .setAudioMimeType(MimeTypes.AUDIO_AAC)
                        .setEncoderFactory(encoder)
                        .setMaxDelayBetweenMuxerSamplesMs(60000)
                        .addListener(new Transformer.Listener() {
                            @Override public void onCompleted(Composition composition, ExportResult result) {
                                if (pending == null) return;
                                if (output == null || output.length() == 0 || result.videoFrameCount <= 0) {
                                    fail("O codificador não produziu um vídeo válido."); return;
                                }
                                JSObject value = new JSObject();
                                value.put("path", Uri.fromFile(output).toString());
                                value.put("mime", "video/mp4");
                                value.put("bytes", output.length());
                                value.put("width", result.width);
                                value.put("height", result.height);
                                value.put("durationMs", result.durationMs);
                                value.put("engine", "media3");
                                PluginCall done = pending;
                                reset(false);
                                done.resolve(value);
                            }
                            @Override public void onError(Composition composition, ExportResult result, ExportException error) {
                                fail("Falha na exportação (" + error.getErrorCodeName() + "): " + error.getMessage()
                                        + ". Experimente Alta ou um vídeo SDR/H.264 compatível com o aparelho.");
                            }
                        }).build();
                Composition.Builder composition = new Composition.Builder(new EditedMediaItemSequence.Builder(item).build());
                // GPU tone mapping avoids the old incorrect RGB/YUV conversion. HDR needs API 29+.
                if (Build.VERSION.SDK_INT >= 29)
                    composition.setHdrMode(Composition.HDR_MODE_TONE_MAP_HDR_TO_SDR_USING_OPEN_GL);
                keepScreen(true);
                transformer.start(composition.build(), output.getAbsolutePath());
                progressPoll = new Runnable() {
                    @Override public void run() {
                        if (transformer == null || pending != call) return;
                        ProgressHolder progress = new ProgressHolder();
                        if (transformer.getProgress(progress) == Transformer.PROGRESS_STATE_AVAILABLE) {
                            JSObject event = new JSObject();
                            event.put("fraction", progress.progress / 100.0);
                            notifyListeners("renderProgress", event);
                        }
                        handler.postDelayed(this, 300);
                    }
                };
                handler.post(progressPoll);
            } catch (Exception error) { fail("Não foi possível exportar: " + error.getMessage()); }
        });
    }

    private void reset(boolean delete) {
        if (progressPoll != null) handler.removeCallbacks(progressPoll);
        progressPoll = null;
        pending = null;
        transformer = null;
        if (delete && output != null) output.delete();
        output = null;
        keepScreen(false);
    }

    private void fail(String message) {
        PluginCall call = pending;
        if (transformer != null) transformer.cancel();
        reset(true);
        if (call != null) call.reject(message);
    }

    @PluginMethod public void cancel(PluginCall call) {
        handler.post(() -> { if (pending != null) fail("Exportação cancelada."); call.resolve(); });
    }

    @Override protected void handleOnDestroy() {
        handler.post(() -> {
            if (transformer != null) transformer.cancel();
            reset(true);
            thread.quitSafely();
        });
    }
}
