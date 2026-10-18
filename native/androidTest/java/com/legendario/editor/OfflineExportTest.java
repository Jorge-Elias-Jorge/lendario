package com.legendario.editor;

import android.content.Context;
import android.graphics.Bitmap;
import android.media.MediaExtractor;
import android.media.MediaFormat;
import android.media.MediaMetadataRetriever;
import android.net.Uri;
import androidx.media3.common.MediaItem;
import androidx.media3.common.MimeTypes;
import androidx.media3.common.util.Size;
import androidx.media3.common.util.UnstableApi;
import androidx.media3.effect.OverlayEffect;
import androidx.media3.transformer.*;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.platform.app.InstrumentationRegistry;
import androidx.test.core.app.ActivityScenario;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.PluginCall;
import java.io.*;
import java.util.Collections;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;
import org.json.*;
import org.junit.Test;
import org.junit.runner.RunWith;
import static org.junit.Assert.*;

@UnstableApi
@RunWith(AndroidJUnit4.class)
public class OfflineExportTest {
    private JSONObject style() throws Exception {
        return new JSONObject("{\"fontSize\":80,\"posY\":50,\"color\":\"#FFFFFF\",\"highlightColor\":\"#FFFF00\",\"defaultMotion\":\"Sem animação\"}");
    }
    private JSONArray cues() throws Exception {
        return new JSONArray("[{\"start\":0,\"end\":3,\"text\":\"OFFLINE\"}]");
    }
    private File fixture(String name) throws Exception {
        Context context = InstrumentationRegistry.getInstrumentation().getTargetContext();
        File file = new File(context.getCacheDir(), name);
        try (InputStream in = InstrumentationRegistry.getInstrumentation().getContext().getAssets().open(name);
             OutputStream out = new FileOutputStream(file)) {
            byte[] buffer = new byte[8192]; int n;
            while ((n=in.read(buffer))!=-1) out.write(buffer,0,n);
        }
        return file;
    }
    private void export(String name, boolean expectedAudio, boolean portrait) throws Exception {
        File input = fixture(name);
        File output = new File(input.getParentFile(), "export-"+name);
        output.delete();
        CountDownLatch latch = new CountDownLatch(1);
        AtomicReference<Throwable> failure = new AtomicReference<>();
        AtomicReference<Transformer> active = new AtomicReference<>();
        AtomicReference<ExportResult> result = new AtomicReference<>();
        LegendarioCaptionOverlay overlay = new LegendarioCaptionOverlay(cues(),style(),"Frase",300);
        InstrumentationRegistry.getInstrumentation().runOnMainSync(() -> {
            try {
                EditedMediaItem item = new EditedMediaItem.Builder(MediaItem.fromUri(Uri.fromFile(input)))
                        .setEffects(new Effects(Collections.emptyList(),Collections.singletonList(
                                new OverlayEffect(Collections.singletonList(overlay))))).build();
                Transformer transformer = new Transformer.Builder(
                        InstrumentationRegistry.getInstrumentation().getTargetContext())
                        .setVideoMimeType(MimeTypes.VIDEO_H264).setAudioMimeType(MimeTypes.AUDIO_AAC)
                        .addListener(new Transformer.Listener() {
                            @Override public void onCompleted(Composition c, ExportResult r) { result.set(r); latch.countDown(); }
                            @Override public void onError(Composition c, ExportResult r, ExportException e) { failure.set(e); latch.countDown(); }
                        }).build();
                active.set(transformer);
                transformer.start(item, output.getAbsolutePath());
            } catch (Throwable error) { failure.set(error); latch.countDown(); }
        });
        if (!latch.await(90,TimeUnit.SECONDS)) {
            InstrumentationRegistry.getInstrumentation().runOnMainSync(() -> active.get().cancel());
            fail("Exportação não terminou em 90 segundos.");
        }
        if (failure.get()!=null) throw new AssertionError("Falha do motor",failure.get());
        assertTrue(output.length()>1000);
        assertNotNull(result.get());
        assertTrue(result.get().videoFrameCount>=20);
        MediaExtractor extractor = new MediaExtractor();
        try {
            extractor.setDataSource(output.getAbsolutePath());
            boolean video=false,audio=false;
            for(int i=0;i<extractor.getTrackCount();i++){
                MediaFormat format=extractor.getTrackFormat(i);
                String mime=format.getString(MediaFormat.KEY_MIME);
                if(mime.startsWith("video/")){
                    video=true;assertEquals("video/avc",mime);
                    assertTrue(format.getLong(MediaFormat.KEY_DURATION)>1_500_000);
                }
                if(mime.startsWith("audio/"))audio=true;
            }
            assertTrue(video);assertEquals(expectedAudio,audio);
        }finally{extractor.release();}
        MediaMetadataRetriever retriever=new MediaMetadataRetriever();
        try{
            retriever.setDataSource(output.getAbsolutePath());
            Bitmap frame=retriever.getFrameAtTime(1_000_000,MediaMetadataRetriever.OPTION_CLOSEST);
            assertNotNull(frame);
            if(portrait)assertTrue(frame.getHeight()>frame.getWidth());
            else assertTrue(frame.getWidth()>frame.getHeight());
            // Fixture is black: visible white pixels in the centre prove captions were burned in.
            int white=0;
            for(int y=frame.getHeight()/3;y<frame.getHeight()*2/3;y++)
                for(int x=0;x<frame.getWidth();x++){
                    int pixel=frame.getPixel(x,y);
                    if(android.graphics.Color.red(pixel)>180&&android.graphics.Color.green(pixel)>180&&android.graphics.Color.blue(pixel)>180)white++;
                }
            assertTrue("Legendas não aparecem no MP4",white>100);
            frame.recycle();
        }finally{retriever.release();}
        input.delete();output.delete();
    }
    @Test public void mp4WithAudioExportsOffline() throws Exception {export("audio.mp4",true,false);}
    @Test public void silentVideoExportsOffline() throws Exception {export("silent.mp4",false,false);}
    @Test public void rotatedPhoneVideoKeepsPortrait() throws Exception {export("portrait.mp4",true,true);}
    @Test public void overlayClearsExpiredCaptions() throws Exception {
        LegendarioCaptionOverlay overlay=new LegendarioCaptionOverlay(cues(),style(),"Frase",300);
        overlay.configure(new Size(320,240));
        Bitmap frame=overlay.getBitmap(4_000_000);
        for(int y=0;y<240;y+=20)for(int x=0;x<320;x+=20)assertEquals(0,frame.getPixel(x,y));
        overlay.release();
    }

    /** Exercise the production plugin, not just Media3's default configuration. */
    @Test public void productionPluginRendersAndSavesLocally() throws Exception {
        Context context=InstrumentationRegistry.getInstrumentation().getTargetContext();
        assertEquals("O teste deve impedir acesso à internet por permissão",
                android.content.pm.PackageManager.PERMISSION_DENIED,
                context.checkSelfPermission(android.Manifest.permission.INTERNET));
        File original=fixture("audio.mp4");
        File imports=new File(context.getFilesDir(),"imports");
        assertTrue(imports.isDirectory()||imports.mkdirs());
        File imported=new File(imports,"integration.mp4");
        try(InputStream in=new FileInputStream(original);OutputStream out=new FileOutputStream(imported)){
            byte[] buffer=new byte[8192];int n;
            while((n=in.read(buffer))!=-1)out.write(buffer,0,n);
        }
        try(ActivityScenario<MainActivity> scenario=ActivityScenario.launch(MainActivity.class)){
            AtomicReference<LegendarioRenderPlugin> renderer=new AtomicReference<>();
            AtomicReference<LegendarioExportPlugin> storage=new AtomicReference<>();
            scenario.onActivity(activity->{
                renderer.set((LegendarioRenderPlugin)activity.getBridge().getPlugin("LegendarioRender").getInstance());
                storage.set((LegendarioExportPlugin)activity.getBridge().getPlugin("LegendarioExport").getInstance());
            });
            JSObject data=new JSObject();
            data.put("source",Uri.fromFile(imported).toString());
            data.put("cues",new JSArray(cues().toString()));
            data.put("style",new JSObject(style().toString()));
            data.put("quality","ultra");
            data.put("presentation","Realce ativo");
            data.put("effectMs",300);
            RecordedCall render=new RecordedCall(data);
            renderer.get().render(render);
            JSObject result=render.await();
            assertEquals("video/mp4",result.getString("mime"));
            File output=new File(Uri.parse(result.getString("path")).getPath());
            assertTrue(output.isFile());assertEquals(output.length(),result.getLong("bytes"));
            if(android.os.Build.VERSION.SDK_INT>=29){
                JSObject saveData=new JSObject();saveData.put("path",result.getString("path"));
                RecordedCall save=new RecordedCall(saveData);
                storage.get().save(save);
                JSObject saved=save.await();
                assertEquals(output.length(),saved.getLong("bytes"));
                Uri destination=Uri.parse(saved.getString("uri"));
                try{
                    assertEquals("video/mp4",context.getContentResolver().getType(destination));
                    try(android.os.ParcelFileDescriptor fd=context.getContentResolver().openFileDescriptor(destination,"r")){
                        assertNotNull(fd);assertEquals(output.length(),fd.getStatSize());
                    }
                }finally{context.getContentResolver().delete(destination,null,null);}
            }
            JSObject discardData=new JSObject();discardData.put("path",result.getString("path"));
            RecordedCall discard=new RecordedCall(discardData);storage.get().discard(discard);discard.await();
            assertFalse(output.exists());
        }finally{imported.delete();original.delete();}
    }

    private static class RecordedCall extends PluginCall {
        final CountDownLatch latch=new CountDownLatch(1);
        JSObject value;
        String error;
        RecordedCall(JSObject data){super(null,"integration-test","test","test",data);}
        @Override public void resolve(JSObject result){value=result;latch.countDown();}
        @Override public void resolve(){value=new JSObject();latch.countDown();}
        @Override public void reject(String message){error=message;latch.countDown();}
        JSObject await() throws Exception {
            assertTrue("Plugin não terminou em 90s",latch.await(90,TimeUnit.SECONDS));
            if(error!=null)throw new AssertionError(error);
            return value;
        }
    }
}
