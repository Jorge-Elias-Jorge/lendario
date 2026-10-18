package com.legendario.editor;

import android.app.Activity;
import android.content.ContentValues;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.MediaStore;
import androidx.activity.result.ActivityResult;
import com.getcapacitor.*;
import com.getcapacitor.annotation.*;
import java.io.*;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicBoolean;

@CapacitorPlugin(name="LegendarioExport")
public class LegendarioExportPlugin extends Plugin {
    private final ExecutorService worker = Executors.newSingleThreadExecutor();
    private final AtomicBoolean saving = new AtomicBoolean(false);

    private File file(PluginCall call) throws IOException {
        String path = call.getString("path");
        if (path == null) throw new IOException("Caminho MP4 ausente.");
        Uri uri = Uri.parse(path);
        if (!"file".equals(uri.getScheme()) || uri.getPath() == null) throw new IOException("Caminho local inválido.");
        File file = new File(uri.getPath()).getCanonicalFile();
        File dir = new File(getContext().getCacheDir(), "exports").getCanonicalFile();
        if (!file.getParentFile().equals(dir) || !file.getName().matches("LEGENDARIO-[a-f0-9-]{36}\\.mp4")
                || !file.isFile() || file.length() == 0) throw new IOException("MP4 temporário indisponível.");
        return file;
    }

    @PluginMethod public void save(PluginCall call) {
        if (!saving.compareAndSet(false, true)) { call.reject("Já existe uma gravação em andamento."); return; }
        worker.execute(() -> {
            try {
                File source = file(call);
                if (Build.VERSION.SDK_INT >= 29) {
                    ContentValues values = new ContentValues();
                    values.put(MediaStore.Video.Media.DISPLAY_NAME, source.getName());
                    values.put(MediaStore.Video.Media.MIME_TYPE, "video/mp4");
                    values.put(MediaStore.Video.Media.RELATIVE_PATH, Environment.DIRECTORY_MOVIES + "/Legendario");
                    values.put(MediaStore.Video.Media.IS_PENDING, 1);
                    Uri destination = getContext().getContentResolver().insert(MediaStore.Video.Media.EXTERNAL_CONTENT_URI, values);
                    if (destination == null) throw new IOException("Não foi possível criar o vídeo na galeria.");
                    try {
                        long bytes = copy(source, destination);
                        ContentValues ready = new ContentValues();
                        ready.put(MediaStore.Video.Media.IS_PENDING, 0);
                        if (getContext().getContentResolver().update(destination, ready, null, null) != 1)
                            throw new IOException("Não foi possível publicar o vídeo na galeria.");
                        resolve(call, destination, bytes, "Movies/Legendario");
                    } catch (Exception error) {
                        getContext().getContentResolver().delete(destination, null, null);
                        throw error;
                    }
                } else {
                    Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT);
                    intent.addCategory(Intent.CATEGORY_OPENABLE);
                    intent.setType("video/mp4");
                    intent.putExtra(Intent.EXTRA_LOCAL_ONLY, true);
                    intent.putExtra(Intent.EXTRA_TITLE, source.getName());
                    getActivity().runOnUiThread(() -> {
                        try { startActivityForResult(call, intent, "destination"); }
                        catch (Exception error) { reject(call, error.getMessage()); }
                    });
                }
            } catch (Exception error) { reject(call, "Falha ao guardar: " + error.getMessage()); }
        });
    }

    private long copy(File source, Uri destination) throws IOException {
        long copied = 0;
        try (InputStream in = new FileInputStream(source);
             OutputStream out = getContext().getContentResolver().openOutputStream(destination, "w")) {
            if (out == null) throw new IOException("Destino indisponível.");
            byte[] buffer = new byte[256 * 1024];
            int count;
            while ((count = in.read(buffer)) != -1) { out.write(buffer, 0, count); copied += count; }
            out.flush();
        }
        if (copied != source.length()) throw new IOException("Cópia incompleta.");
        // Verify the persisted file length too, not just the number of bytes written.
        try (android.os.ParcelFileDescriptor fd = getContext().getContentResolver().openFileDescriptor(destination, "r")) {
            if (fd == null || (fd.getStatSize() >= 0 && fd.getStatSize() != copied))
                throw new IOException("O tamanho do vídeo guardado não confere.");
        }
        return copied;
    }

    @ActivityCallback private void destination(PluginCall call, ActivityResult result) {
        if (call == null) { saving.set(false); return; }
        Intent data = result.getData();
        if (result.getResultCode() != Activity.RESULT_OK || data == null || data.getData() == null) {
            reject(call, "Gravação cancelada. O MP4 está pronto para tentar guardar novamente."); return;
        }
        Uri uri = data.getData();
        worker.execute(() -> {
            try { resolve(call, uri, copy(file(call), uri), "Pasta escolhida no dispositivo"); }
            catch (Exception error) {
                try { android.provider.DocumentsContract.deleteDocument(getContext().getContentResolver(), uri); }
                catch (Exception ignored) {}
                reject(call, "Falha ao guardar: " + error.getMessage());
            }
        });
    }

    private void resolve(PluginCall call, Uri uri, long bytes, String location) {
        JSObject result = new JSObject();
        result.put("uri", uri.toString()); result.put("bytes", bytes); result.put("location", location);
        saving.set(false);
        call.resolve(result);
    }
    private void reject(PluginCall call, String message) { saving.set(false); call.reject(message); }

    @PluginMethod public void discard(PluginCall call) {
        worker.execute(() -> {
            try {
                if (saving.get()) throw new IOException("Aguarde o fim da gravação.");
                if (!file(call).delete()) throw new IOException("Não foi possível remover o temporário.");
                call.resolve();
            } catch (Exception error) { call.reject(error.getMessage()); }
        });
    }

    @Override protected void handleOnDestroy() { worker.shutdown(); }
}
