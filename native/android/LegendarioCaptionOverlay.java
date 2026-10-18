package com.legendario.editor;

import android.graphics.*;
import androidx.media3.common.VideoFrameProcessingException;
import androidx.media3.common.util.Size;
import androidx.media3.common.util.UnstableApi;
import androidx.media3.effect.BitmapOverlay;
import java.util.*;
import java.util.regex.*;
import org.json.*;

/** One reusable transparent bitmap; video pixels stay on the GPU. */
@UnstableApi
public final class LegendarioCaptionOverlay extends BitmapOverlay {
    private final List<JSONObject> cues = new ArrayList<>();
    private final JSONObject style;
    private final String presentation;
    private final int effectMs;
    private Bitmap bitmap;

    public LegendarioCaptionOverlay(JSONArray array, JSONObject style, String presentation, int effectMs) throws JSONException {
        this.style = style;
        this.presentation = presentation;
        this.effectMs = Math.max(1, effectMs);
        for (int i = 0; i < array.length(); i++) {
            JSONObject cue = array.getJSONObject(i);
            double start = cue.getDouble("start"), end = cue.getDouble("end");
            if (!Double.isFinite(start) || !Double.isFinite(end) || start < 0 || end <= start)
                throw new IllegalArgumentException("Tempos de legenda inválidos.");
            if (!cue.getString("text").trim().isEmpty()) cues.add(cue);
        }
        cues.sort(Comparator.comparingDouble(cue -> cue.optDouble("start")));
    }

    @Override public void configure(Size size) {
        if (bitmap != null) bitmap.recycle();
        bitmap = Bitmap.createBitmap(size.getWidth(), size.getHeight(), Bitmap.Config.ARGB_8888);
    }

    private int color(String key, int fallback) {
        try { return Color.parseColor(style.optString(key)); } catch (Exception ignored) { return fallback; }
    }
    private static float clamp(float value) { return Math.max(0, Math.min(1, value)); }
    private static float ease(float value) { return 1 - (float) Math.pow(1 - clamp(value), 3); }

    @Override public Bitmap getBitmap(long timeUs) {
        bitmap.eraseColor(Color.TRANSPARENT);
        double time = timeUs / 1_000_000.0;
        JSONObject cue = null;
        for (JSONObject item : cues) {
            if (item.optDouble("start") > time) break;
            if (time < item.optDouble("end")) cue = item;
        }
        if (cue == null) return bitmap;
        Canvas canvas = new Canvas(bitmap);
        float scale = bitmap.getWidth() / 720f;
        float fontSize = (float) style.optDouble("fontSize", 44) * scale;
        Paint paint = new Paint(Paint.ANTI_ALIAS_FLAG | Paint.SUBPIXEL_TEXT_FLAG);
        paint.setTextSize(fontSize);
        paint.setTypeface(Typeface.create(style.optString("fontFamily", "sans-serif"),
                style.optInt("fontWeight", 800) >= 600 ? Typeface.BOLD : Typeface.NORMAL));
        paint.setTextAlign(Paint.Align.CENTER);
        paint.setStrokeJoin(Paint.Join.ROUND);
        paint.setStrokeWidth((float) style.optDouble("outlineWidth", 0) * 2 * scale);
        String text = cue.optString("text").trim();
        if (style.optBoolean("uppercase", false)) text = text.toUpperCase(Locale.ROOT);
        String[] words = text.split("\\s+");
        double start = cue.optDouble("start"), span = cue.optDouble("end") - start;
        int active = Math.min(words.length - 1, (int) ((time - start) / span * words.length));
        if ("Palavra".equals(presentation)) text = words[active];
        else if ("Blocos".equals(presentation)) {
            int first = active / 3 * 3;
            text = String.join(" ", Arrays.copyOfRange(words, first, Math.min(words.length, first + 3)));
        }
        List<String> lines = new ArrayList<>();
        String line = "";
        for (String word : text.split("\\s+")) {
            String candidate = line.isEmpty() ? word : line + " " + word;
            if (!line.isEmpty() && paint.measureText(candidate) > bitmap.getWidth() * .9f) {
                lines.add(line); line = word;
            } else line = candidate;
        }
        lines.add(line);
        float raw = clamp((float) ((time - start) * 1000 / effectMs)), t = ease(raw);
        float dx = 0, dy = 0, zoom = 1, rotation = 0, alpha = ease((float) ((time - start) / .35));
        String motion = style.optString("defaultMotion", "Sem animação");
        switch (motion) {
            case "Saltar": dy = -(float) Math.sin(t * Math.PI) * 16; break;
            case "Pular": zoom = .7f + .3f * t + (float) Math.sin(t * Math.PI) * .18f; break;
            case "Cair": dy = -(1-t)*(1-t)*45; alpha *= t; break;
            case "Deslizar": dx = (1-t)*35; alpha *= t; break;
            case "Aproximar": zoom = .6f + .4f*t; alpha *= t; break;
            case "Pulsar": zoom = 1+(float)Math.sin(raw*Math.PI)*.12f; break;
            case "Girar": rotation = (1-t)*-30; alpha *= t; break;
            case "Tremer": dx = (float)Math.sin(raw*30)*(1-raw)*8; break;
            case "Revelar": alpha *= t; break;
            case "Elasticidade": zoom = 1-(float)Math.cos(t*12)*(1-t)*.35f; break;
            case "Flutuar": dy = (float)Math.sin(raw*3)*5; break;
            case "Piscar": alpha *= raw == 1 ? 1 : .35f+.65f*Math.abs((float)Math.sin(raw*10)); break;
            case "Neon": zoom = 1+(float)Math.sin(raw*Math.PI*2)*.06f; break;
            case "Glitch": dx = (float)Math.sin(timeUs*.001)*3; alpha *= raw < .1 ? .4f : 1; break;
            case "Onda": dy = (float)Math.sin(raw*Math.PI*2)*10; break;
            case "Zoom viral": zoom = raw < .7 ? .6f+.6f*t : 1.02f+(float)Math.sin((raw-.7)*10)*.04f; alpha *= Math.min(1, raw*2); break;
            case "Bounce": dy = -(1-t)*(1-t)*40+Math.abs((float)Math.sin(t*Math.PI*3))*(1-t)*10; alpha *= Math.min(1, raw*3); break;
        }
        canvas.save();
        canvas.translate(bitmap.getWidth()/2f + dx*scale, bitmap.getHeight()*(float)style.optDouble("posY",78)/100 + dy*scale);
        canvas.rotate(rotation); canvas.scale(zoom, zoom);
        float baseline = -(paint.ascent()+paint.descent())/2;
        int wordIndex = 0;
        for (int i = 0; i < lines.size(); i++) {
            float y = (i-(lines.size()-1)/2f)*fontSize*1.25f + baseline;
            if ("Realce ativo".equals(presentation)) {
                float x = -paint.measureText(lines.get(i))/2;
                for (String word : lines.get(i).split("\\s+")) {
                    float width = paint.measureText(word);
                    draw(canvas, paint, word, x+width/2, y, wordIndex++ == active, alpha);
                    x += paint.measureText(word+" ");
                }
            } else draw(canvas, paint, lines.get(i), 0, y, false, alpha);
        }
        canvas.restore();
        return bitmap;
    }

    private void draw(Canvas canvas, Paint paint, String text, float x, float y, boolean active, float alpha) {
        paint.setShader(null);
        paint.clearShadowLayer();
        if (paint.getStrokeWidth() > 0) {
            paint.setStyle(Paint.Style.STROKE);
            paint.setColor(color("outlineColor", Color.BLACK));
            paint.setAlpha((int)(alpha*Color.alpha(paint.getColor())));
            canvas.drawText(text, x, y, paint);
        }
        paint.setStyle(Paint.Style.FILL);
        paint.setColor(color(active ? "highlightColor" : "color", Color.WHITE));
        if (!active && style.has("gradient")) {
            Matcher matcher = Pattern.compile("#[0-9a-fA-F]{6}").matcher(style.optString("gradient"));
            List<Integer> colors = new ArrayList<>();
            while (matcher.find()) colors.add(Color.parseColor(matcher.group()));
            if (colors.size() >= 2) paint.setShader(new LinearGradient(x-paint.measureText(text)/2,y,x+paint.measureText(text)/2,y,
                    colors.get(0), colors.get(colors.size()-1), Shader.TileMode.CLAMP));
        }
        if (style.has("glow")) paint.setShadowLayer(paint.getTextSize()*.15f,0,0,color("glow",Color.WHITE));
        else if (style.optBoolean("shadow")) paint.setShadowLayer(4,2,2,Color.BLACK);
        paint.setAlpha((int)(alpha*Color.alpha(paint.getColor())));
        canvas.drawText(text,x,y,paint);
    }

    @Override public void release() throws VideoFrameProcessingException {
        super.release();
        if (bitmap != null) { bitmap.recycle(); bitmap = null; }
    }
}
