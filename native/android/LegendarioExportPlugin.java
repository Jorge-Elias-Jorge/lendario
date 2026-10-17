package com.legendario.editor;
import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.util.Base64;
import androidx.activity.result.ActivityResult;
import com.getcapacitor.*;
import com.getcapacitor.annotation.*;
import java.io.*;
import java.util.UUID;

@CapacitorPlugin(name="LegendarioExport")
public class LegendarioExportPlugin extends Plugin {
  private File file(String id) {
    if(id==null || !id.matches("[a-f0-9-]{36}")) throw new IllegalArgumentException("ID inválido");
    File dir=new File(getContext().getFilesDir(),"pending-exports");
    if(!dir.isDirectory() && !dir.mkdirs()) throw new IllegalStateException("Sem acesso ao armazenamento temporário");
    return new File(dir,id+".webm");
  }
  @PluginMethod public void begin(PluginCall call) {
    try { String id=UUID.randomUUID().toString(); if(!file(id).createNewFile()) throw new IOException("Não foi possível criar o temporário"); JSObject r=new JSObject(); r.put("id",id); call.resolve(r); }
    catch(Exception e){call.reject(e.getMessage());}
  }
  @PluginMethod public void append(PluginCall call) {
    try { File f=file(call.getString("id")); String data=call.getString("data"); if(!f.isFile() || data==null || data.length()>1000000) throw new IOException("Bloco inválido"); try(FileOutputStream out=new FileOutputStream(f,true)){out.write(Base64.decode(data,Base64.NO_WRAP));} call.resolve(); }
    catch(Exception e){call.reject(e.getMessage());}
  }
  @PluginMethod public void save(PluginCall call) {
    try { File f=file(call.getString("id")); if(!f.isFile() || f.length()==0) throw new IOException("Vídeo vazio"); Intent i=new Intent(Intent.ACTION_CREATE_DOCUMENT); i.addCategory(Intent.CATEGORY_OPENABLE); i.setType("video/webm"); i.putExtra(Intent.EXTRA_TITLE,"LEGENDARIO-"+call.getString("id")+".webm"); startActivityForResult(call,i,"destination"); }
    catch(Exception e){call.reject(e.getMessage());}
  }
  @ActivityCallback private void destination(PluginCall call,ActivityResult result) {
    if(call==null)return;
    Intent data=result.getData();
    if(result.getResultCode()!=Activity.RESULT_OK || data==null || data.getData()==null){call.reject("Gravação cancelada. Pode tentar novamente sem gerar o vídeo outra vez enquanto o app continuar aberto.");return;}
    Uri uri=data.getData();
    getBridge().execute(()->{
      try {
        File f=file(call.getString("id")); long copied=0;
        try(FileInputStream in=new FileInputStream(f); OutputStream out=getContext().getContentResolver().openOutputStream(uri,"w")){
          if(out==null)throw new IOException("Destino indisponível");
          byte[] buffer=new byte[262144]; int n; long last=0;
          while((n=in.read(buffer))!=-1){out.write(buffer,0,n);copied+=n;if(copied-last>=1048576){JSObject p=new JSObject();p.put("id",call.getString("id"));p.put("fraction",(double)copied/f.length());notifyListeners("copyProgress",p);last=copied;}}
          out.flush();
        }
        if(copied!=f.length())throw new IOException("Cópia incompleta");
        JSObject r=new JSObject();r.put("uri",uri.toString());r.put("bytes",copied);call.resolve(r);
      }catch(Exception e){call.reject("Falha ao guardar; o temporário foi mantido. "+e.getMessage());}
    });
  }
  @PluginMethod public void discard(PluginCall call){try{File f=file(call.getString("id"));if(f.exists()&&!f.delete())throw new IOException("Falha ao remover temporário");call.resolve();}catch(Exception e){call.reject(e.getMessage());}}
}
