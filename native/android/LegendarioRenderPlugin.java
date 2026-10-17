package com.legendario.editor;

import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.Typeface;
import android.media.Image;
import android.media.MediaCodec;
import android.media.MediaCodecInfo;
import android.media.MediaExtractor;
import android.media.MediaFormat;
import android.media.MediaMuxer;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.File;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.util.ArrayList;
import java.util.List;
import org.json.JSONArray;
import org.json.JSONObject;

@CapacitorPlugin(name = "LegendarioRender")
public class LegendarioRenderPlugin extends Plugin {
    private static class Cue { long startUs; long endUs; String text; }
    private static class Style {
        int fontSize = 44; int posY = 78; int color = Color.WHITE; int highlight = Color.YELLOW;
        int outline = Color.BLACK; int outlineWidth = 4; boolean uppercase = true;
        String motion = "Saltar"; String presentation = "Frase"; int effectMs = 300;
    }
    private final List<Cue> cues = new ArrayList<>();
    private final Style style = new Style();
    private volatile boolean cancelled = false;

    @PluginMethod
    public void render(PluginCall call) {
        MediaExtractor extractor = null;
        MediaCodec decoder = null;
        MediaCodec encoder = null;
        MediaMuxer muxer = null;
        try {
            cancelled = false;
            String source = call.getString("source");
            if (source == null || source.isEmpty()) throw new IllegalArgumentException("Vídeo de origem ausente.");
            parseCues(call.getArray("cues"));
            parseStyle(call.getObject("style"), call.getString("presentation", "Frase"), call.getInt("effectMs", 300));
            File output = new File(getContext().getCacheDir(), "legendario-render-" + System.nanoTime() + ".mp4");
            extractor = new MediaExtractor();
            extractor.setDataSource(source);
            int videoIndex = -1, audioIndex = -1;
            MediaFormat videoFormat = null, audioFormat = null;
            for (int index = 0; index < extractor.getTrackCount(); index++) {
                MediaFormat format = extractor.getTrackFormat(index);
                String mime = format.getString(MediaFormat.KEY_MIME);
                if (mime == null) continue;
                if (mime.startsWith("video/") && videoIndex < 0) { videoIndex = index; videoFormat = format; }
                else if (mime.startsWith("audio/") && audioIndex < 0) { audioIndex = index; audioFormat = format; }
            }
            if (videoIndex < 0 || videoFormat == null) throw new IllegalStateException("O vídeo não contém uma faixa de vídeo compatível.");
            int width = videoFormat.getInteger(MediaFormat.KEY_WIDTH);
            int height = videoFormat.getInteger(MediaFormat.KEY_HEIGHT);
            float frameRate = videoFormat.containsKey(MediaFormat.KEY_FRAME_RATE) ? videoFormat.getInteger(MediaFormat.KEY_FRAME_RATE) : 30f;
            String inputMime = videoFormat.getString(MediaFormat.KEY_MIME);
            extractor.selectTrack(videoIndex);
            long durationUs = videoFormat.containsKey(MediaFormat.KEY_DURATION) ? videoFormat.getLong(MediaFormat.KEY_DURATION) : 0;
            String encoderMime = MediaFormat.MIMETYPE_VIDEO_AVC;
            encoder = MediaCodec.createEncoderByType(encoderMime);
            MediaFormat encodeFormat = MediaFormat.createVideoFormat(encoderMime, width, height);
            encodeFormat.setInteger(MediaFormat.KEY_COLOR_FORMAT, MediaCodecInfo.CodecCapabilities.COLOR_FormatYUV420SemiPlanar);
            encodeFormat.setInteger(MediaFormat.KEY_BIT_RATE, Math.max(2500000, Math.min(16000000, width * height * 4)));
            encodeFormat.setInteger(MediaFormat.KEY_FRAME_RATE, Math.round(frameRate));
            encodeFormat.setInteger(MediaFormat.KEY_I_FRAME_INTERVAL, 2);
            encoder.configure(encodeFormat, null, null, MediaCodec.CONFIGURE_FLAG_ENCODE);
            encoder.start();
            muxer = new MediaMuxer(output.getAbsolutePath(), MediaMuxer.OutputFormat.MUXER_OUTPUT_MPEG_4);
            decoder = MediaCodec.createDecoderByType(inputMime);
            decoder.configure(videoFormat, null, null, 0);
            decoder.start();
            MediaCodec.BufferInfo decodeInfo = new MediaCodec.BufferInfo();
            MediaCodec.BufferInfo encodeInfo = new MediaCodec.BufferInfo();
            int videoMux = -1, audioMux = -1;
            boolean decoderDone = false, encoderDone = false, muxerStarted = false;
            ByteBuffer audioBuffer = audioIndex >= 0 && audioFormat != null ? ByteBuffer.allocateDirect(Math.max(65536, audioFormat.getInteger(MediaFormat.KEY_MAX_INPUT_SIZE, 65536))) : null;
            long lastReport = 0;
            while (!encoderDone && !cancelled) {
                if (!decoderDone) {
                    int inputIndex = decoder.dequeueInputBuffer(10000);
                    if (inputIndex >= 0) {
                        ByteBuffer input = decoder.getInputBuffer(inputIndex);
                        if (input == null) throw new IllegalStateException("Buffer de entrada do decodificador indisponível.");
                        input.clear();
                        int size = extractor.readSampleData(input, 0);
                        if (size < 0) {
                            decoder.queueInputBuffer(inputIndex, 0, 0, 0, MediaCodec.BUFFER_FLAG_END_OF_STREAM);
                            decoderDone = true;
                        } else {
                            decoder.queueInputBuffer(inputIndex, 0, size, extractor.getSampleTime(), 0);
                            extractor.advance();
                        }
                    }
                }
                int outputIndex = decoder.dequeueOutputBuffer(decodeInfo, 10000);
                if (outputIndex >= 0) {
                    Image image = decoder.getOutputImage(outputIndex);
                    if (image != null) {
                        Bitmap frame = imageToBitmap(image);
                        long presentationTimeUs = decodeInfo.presentationTimeUs;
                        drawCaptions(frame, presentationTimeUs);
                        byte[] nv12 = bitmapToNv12(frame);
                        int encoderInput = encoder.dequeueInputBuffer(10000);
                        if (encoderInput >= 0) {
                            ByteBuffer encoderBuffer = encoder.getInputBuffer(encoderInput);
                            if (encoderBuffer == null) throw new IllegalStateException("Buffer de entrada do codificador indisponível.");
                            encoderBuffer.clear();
                            encoderBuffer.put(nv12);
                            encoder.queueInputBuffer(encoderInput, 0, nv12.length, presentationTimeUs, decodeInfo.flags & MediaCodec.BUFFER_FLAG_END_OF_STREAM);
                        }
                        frame.recycle();
                        image.close();
                    }
                    decoder.releaseOutputBuffer(outputIndex, false);
                    if ((decodeInfo.flags & MediaCodec.BUFFER_FLAG_END_OF_STREAM) != 0) decoderDone = true;
                }
                int encoderOutput = encoder.dequeueOutputBuffer(encodeInfo, 10000);
                if (encoderOutput == MediaCodec.INFO_OUTPUT_FORMAT_CHANGED) {
                    if (videoMux < 0) videoMux = muxer.addTrack(encoder.getOutputFormat());
                    if (audioMux < 0 && audioIndex >= 0 && audioFormat != null) audioMux = muxer.addTrack(audioFormat);
                    if (videoMux >= 0) { muxer.start(); muxerStarted = true; }
                } else if (encoderOutput >= 0) {
                    ByteBuffer encoded = encoder.getOutputBuffer(encoderOutput);
                    if (encoded != null && encodeInfo.size > 0 && muxerStarted && videoMux >= 0) {
                        encoded.position(encodeInfo.offset);
                        encoded.limit(encodeInfo.offset + encodeInfo.size);
                        muxer.writeSampleData(videoMux, encoded, encodeInfo);
                    }
                    encoder.releaseOutputBuffer(encoderOutput, false);
                    if ((encodeInfo.flags & MediaCodec.BUFFER_FLAG_END_OF_STREAM) != 0) encoderDone = true;
                    if (durationUs > 0 && System.nanoTime() - lastReport > 100000000) {
                        lastReport = System.nanoTime();
                        JSObject progress = new JSObject();
                        progress.put("fraction", Math.min(0.92, encodeInfo.presentationTimeUs / (double) durationUs * 0.92));
                        notifyListeners("renderProgress", progress);
                    }
                }
            }
            if (cancelled) throw new IllegalStateException("Exportação cancelada.");
            if (!muxerStarted) throw new IllegalStateException("O codificador não produziu um formato de vídeo válido.");
            if (audioIndex >= 0 && audioMux >= 0 && audioBuffer != null) {
                extractor.unselectTrack(videoIndex);
                extractor.selectTrack(audioIndex);
                extractor.seekTo(0, MediaExtractor.SEEK_TO_PREVIOUS_SYNC);
                MediaCodec.BufferInfo audioInfo = new MediaCodec.BufferInfo();
                while (extractor.readSampleData(audioBuffer, 0) >= 0) {
                    audioInfo.offset = 0;
                    audioInfo.size = extractor.getSampleSize();
                    audioInfo.presentationTimeUs = extractor.getSampleTime();
                    audioInfo.flags = extractor.getSampleFlags();
                    muxer.writeSampleData(audioMux, audioBuffer, audioInfo);
                    extractor.advance();
                }
            }
            muxer.stop();
            JSObject result = new JSObject();
            result.put("path", output.getAbsolutePath());
            result.put("mime", "video/mp4");
            result.put("bytes", output.length());
            call.resolve(result);
        } catch (Exception error) {
            call.reject("Falha na renderização nativa: " + error.getMessage());
        } finally {
            try { if (decoder != null) { decoder.stop(); decoder.release(); } } catch (Exception ignored) {}
            try { if (encoder != null) { encoder.stop(); encoder.release(); } } catch (Exception ignored) {}
            try { if (muxer != null) muxer.release(); } catch (Exception ignored) {}
            try { if (extractor != null) extractor.release(); } catch (Exception ignored) {}
        }
    }

    @PluginMethod
    public void cancel(PluginCall call) { cancelled = true; call.resolve(); }

    private void parseCues(JSArray array) throws Exception {
        cues.clear();
        if (array == null) return;
        for (int index = 0; index < array.length(); index++) {
            JSONObject item = array.getJSONObject(index);
            Cue cue = new Cue();
            cue.startUs = (long) (item.getDouble("start") * 1000000);
            cue.endUs = (long) (item.getDouble("end") * 1000000);
            cue.text = item.getString("text");
            if (cue.endUs > cue.startUs && cue.text != null && !cue.text.trim().isEmpty()) cues.add(cue);
        }
    }

    private void parseStyle(JSObject object, String presentation, int effectMs) {
        if (object != null) {
            style.fontSize = object.has("fontSize") ? object.getInt("fontSize") : 44;
            style.posY = object.has("posY") ? object.getInt("posY") : 78;
            style.color = parseColor(object.getString("color"), Color.WHITE);
            style.highlight = parseColor(object.getString("highlightColor"), Color.YELLOW);
            style.outline = parseColor(object.getString("outlineColor"), Color.BLACK);
            style.outlineWidth = object.has("outlineWidth") ? object.getInt("outlineWidth") : 4;
            style.uppercase = object.optBoolean("uppercase", true);
            style.motion = object.optString("defaultMotion", "Saltar");
        }
        style.presentation = presentation;
        style.effectMs = effectMs;
    }

    private int parseColor(String value, int fallback) {
        try { return value == null ? fallback : Color.parseColor(value); } catch (Exception error) { return fallback; }
    }

    private Bitmap imageToBitmap(Image image) {
        int width = image.getWidth(), height = image.getHeight();
        Image.Plane yPlane = image.getPlanes()[0], uPlane = image.getPlanes()[1], vPlane = image.getPlanes()[2];
        ByteBuffer y = buffer(yPlane), u = buffer(uPlane), v = buffer(vPlane);
        int[] pixels = new int[width * height];
        for (int row = 0; row < height; row++) for (int column = 0; column < width; column++) {
            int luma = y.get(row * yPlane.getRowStride() + column * yPlane.getPixelStride()) & 0xff;
            int chromaU = u.get((row / 2) * uPlane.getRowStride() + (column / 2) * uPlane.getPixelStride()) & 0xff;
            int chromaV = v.get((row / 2) * vPlane.getRowStride() + (column / 2) * vPlane.getPixelStride()) & 0xff;
            int red = clamp((int) (luma + 1.402 * (chromaV - 128)));
            int green = clamp((int) (luma - 0.344136 * (chromaU - 128) - 0.714136 * (chromaV - 128)));
            int blue = clamp((int) (luma + 1.772 * (chromaU - 128)));
            pixels[row * width + column] = 0xff000000 | (red << 16) | (green << 8) | blue;
        }
        Bitmap bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888);
        bitmap.setPixels(pixels, 0, width, 0, 0, width, height);
        return bitmap;
    }

    private ByteBuffer buffer(Image.Plane plane) {
        ByteBuffer buffer = plane.getBuffer().duplicate();
        buffer.order(ByteOrder.nativeOrder());
        return buffer;
    }

    private int clamp(int value) { return value < 0 ? 0 : value > 255 ? 255 : value; }

    private byte[] bitmapToNv12(Bitmap bitmap) {
        int width = bitmap.getWidth(), height = bitmap.getHeight();
        int[] pixels = new int[width * height];
        bitmap.getPixels(pixels, 0, width, 0, 0, width, height);
        byte[] result = new byte[width * height * 3 / 2];
        for (int row = 0; row < height; row++) for (int column = 0; column < width; column++) {
            int pixel = pixels[row * width + column];
            int red = Color.red(pixel), green = Color.green(pixel), blue = Color.blue(pixel);
            int luma = (77 * red + 150 * green + 29 * blue) >> 8;
            result[row * width + column] = (byte) luma;
            if (row % 2 == 0 && column % 2 == 0) {
                int chromaU = ((-43 * red - 85 * green + 128 * blue) >> 8) + 128;
                int chromaV = ((128 * red - 107 * green - 21 * blue) >> 8) + 128;
                int index = width * height + (row / 2) * (width / 2) + (column / 2) * 2;
                result[index] = (byte) chromaU;
                result[index + 1] = (byte) chromaV;
            }
        }
        return result;
    }

    private Cue cueAt(long timeUs) {
        Cue found = null;
        for (Cue cue : cues) if (timeUs >= cue.startUs && timeUs < cue.endUs) found = cue;
        return found;
    }

    private void drawCaptions(Bitmap bitmap, long timeUs) {
        Cue cue = cueAt(timeUs);
        if (cue == null) return;
        Canvas canvas = new Canvas(bitmap);
        float scale = bitmap.getWidth() / 720f;
        float fontSize = style.fontSize * scale;
        Paint paint = new Paint(Paint.ANTI_ALIAS_FLAG);
        paint.setTypeface(Typeface.create(Typeface.DEFAULT, Typeface.BOLD));
        paint.setTextSize(fontSize);
        paint.setTextAlign(Paint.Align.CENTER);
        String text = style.uppercase ? cue.text.toUpperCase() : cue.text;
        String[] words = text.split("\\s+");
        float maxWidth = bitmap.getWidth() * 0.9f;
        List<String> lines = new ArrayList<>();
        StringBuilder line = new StringBuilder();
        for (String word : words) {
            String candidate = line.length() == 0 ? word : line + " " + word;
            if (paint.measureText(candidate) > maxWidth && line.length() > 0) { lines.add(line.toString()); line = new StringBuilder(word); }
            else line = new StringBuilder(candidate);
        }
        lines.add(line.toString());
        float lineHeight = fontSize * 1.25f;
        float startY = bitmap.getHeight() * style.posY / 100f - (lines.size() - 1) * lineHeight / 2f;
        float progress = Math.max(0, Math.min(1, (timeUs - cue.startUs) / (float) (style.effectMs * 1000)));
        float motionScale = 1, motionY = 0;
        if ("Saltar".equals(style.motion) || "Pular".equals(style.motion) || "Zoom viral".equals(style.motion)) {
            motionScale = 0.85f + 0.15f * progress;
            motionY = (1 - progress) * 20 * scale;
        }
        canvas.save();
        canvas.translate(bitmap.getWidth() / 2f, motionY);
        canvas.scale(motionScale, motionScale);
        for (int lineIndex = 0; lineIndex < lines.size(); lineIndex++) {
            float y = startY + lineIndex * lineHeight;
            if ("Frase".equals(style.presentation)) {
                paint.setColor(style.outline);
                paint.setStyle(Paint.Style.STROKE);
                paint.setStrokeWidth(style.outlineWidth * 2 * scale);
                canvas.drawText(lines.get(lineIndex), 0, y, paint);
                paint.setStyle(Paint.Style.FILL);
                paint.setColor(style.color);
                canvas.drawText(lines.get(lineIndex), 0, y, paint);
            } else {
                String[] lineWords = lines.get(lineIndex).split("\\s+");
                float total = 0;
                for (String word : lineWords) total += paint.measureText(word + " ");
                float x = -total / 2;
                for (String word : lineWords) {
                    boolean active = !"Frase".equals(style.presentation);
                    float wordScale = active ? 0.85f + 0.15f * progress : 1;
                    canvas.save();
                    canvas.translate(x + paint.measureText(word) / 2, y);
                    canvas.scale(wordScale, wordScale);
                    paint.setColor(style.outline);
                    paint.setStyle(Paint.Style.STROKE);
                    paint.setStrokeWidth(style.outlineWidth * 2 * scale);
                    canvas.drawText(word, 0, 0, paint);
                    paint.setStyle(Paint.Style.FILL);
                    paint.setColor(active ? style.highlight : style.color);
                    canvas.drawText(word, 0, 0, paint);
                    canvas.restore();
                    x += paint.measureText(word + " ");
                }
            }
        }
        canvas.restore();
    }
}
