package com.legendario.editor;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.view.WindowManager;
import androidx.activity.result.ActivityResult;
import com.getcapacitor.*;
import com.getcapacitor.annotation.*;
import java.io.*;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.*;
import java.util.concurrent.atomic.*;

@CapacitorPlugin(name="LegendarioSpeech")
public class LegendarioSpeechPlugin extends Plugin {
 private final ExecutorService worker=Executors.newSingleThreadExecutor();
 private final AtomicBoolean busy=new AtomicBoolean(),cancelled=new AtomicBoolean(),saving=new AtomicBoolean();
 private boolean screenRequested,screenWasKeptOn;
 private void keepScreen(boolean enabled){
  getActivity().runOnUiThread(()->{
   if(enabled){
    screenRequested=true;screenWasKeptOn=(getActivity().getWindow().getAttributes().flags&WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)!=0;
    getActivity().getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
   }else if(screenRequested){
    if(!screenWasKeptOn)getActivity().getWindow().clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
    screenRequested=false;
   }
  });
 }
 @PluginMethod public void analyze(PluginCall call){
  if(!busy.compareAndSet(false,true)){call.reject("Já existe uma análise em andamento.");return;}
  cancelled.set(false);
  keepScreen(true);
  worker.execute(()->{
   try{
    Uri uri=Uri.parse(call.getString("source",""));if(!"file".equals(uri.getScheme())||uri.getPath()==null)throw new IOException("Importe o vídeo localmente antes de sincronizar.");
    File input=new File(uri.getPath()).getCanonicalFile(),imports=new File(getContext().getFilesDir(),"imports").getCanonicalFile();
    if(!input.getPath().startsWith(imports.getPath()+File.separator)||!input.isFile())throw new IOException("Vídeo importado indisponível.");
    org.json.JSONObject result=LegendarioSpeechEngine.transcribe(getContext(),input,cancelled,(fraction,stage)->{
     JSObject event=new JSObject();event.put("fraction",fraction);event.put("stage",stage);event.put("requestId",call.getString("requestId",""));notifyListeners("speechProgress",event);
    });
    LegendarioSpeechEngine.check(cancelled);
    keepScreen(false);busy.set(false);call.resolve(JSObject.fromJSONObject(result));
   }catch(Exception|LinkageError error){keepScreen(false);busy.set(false);call.reject(error instanceof CancellationException?"Análise cancelada. Nenhuma legenda foi alterada.":"Falha na análise local: "+error.getMessage());}
  });
 }
 @PluginMethod public void cancel(PluginCall call){cancelled.set(true);call.resolve();}
 @PluginMethod public void saveSrt(PluginCall call){
  String text=call.getString("text");
  if(text==null||text.length()>2_000_000){call.reject("SRT vazio ou demasiado grande.");return;}
  if(!saving.compareAndSet(false,true)){call.reject("Aguarde a gravação anterior.");return;}
  Intent intent=new Intent(Intent.ACTION_CREATE_DOCUMENT);intent.addCategory(Intent.CATEGORY_OPENABLE);
  intent.setType("application/x-subrip");intent.putExtra(Intent.EXTRA_LOCAL_ONLY,true);
  intent.putExtra(Intent.EXTRA_TITLE,call.getBoolean("original",false)?"LEGENDARIO-original.srt":"LEGENDARIO-sincronizado.srt");
  getActivity().runOnUiThread(()->{try{startActivityForResult(call,intent,"srtDestination");}catch(Exception e){saving.set(false);call.reject(e.getMessage());}});
 }
 @ActivityCallback private void srtDestination(PluginCall call,ActivityResult result){
  if(call==null){saving.set(false);return;}
  if(result.getResultCode()!=Activity.RESULT_OK||result.getData()==null||result.getData().getData()==null){saving.set(false);call.reject("Gravação de SRT cancelada.");return;}
  Uri uri=result.getData().getData();
  worker.execute(()->{
   try(OutputStream out=getContext().getContentResolver().openOutputStream(uri,"w")){
    if(out==null)throw new IOException("Destino indisponível.");byte[] bytes=call.getString("text","").getBytes(StandardCharsets.UTF_8);out.write(bytes);out.flush();
    JSObject value=new JSObject();value.put("uri",uri.toString());saving.set(false);call.resolve(value);
   }catch(Exception e){saving.set(false);call.reject("Não foi possível guardar o SRT: "+e.getMessage());}
  });
 }
 @Override protected void handleOnDestroy(){cancelled.set(true);keepScreen(false);worker.shutdown();}
}
