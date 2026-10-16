package com.legendario.editor;

import android.content.ContentUris;
import android.content.pm.PackageManager;
import android.database.Cursor;
import android.net.Uri;
import android.os.Build;
import android.provider.MediaStore;
import android.graphics.Bitmap;
import android.util.AtomicFile;
import android.util.Base64;
import android.util.Size;
import android.webkit.MimeTypeMap;
import com.getcapacitor.*;
import com.getcapacitor.annotation.*;
import org.json.JSONObject;
import java.io.*;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@CapacitorPlugin(name="LegendarioMedia", permissions={
 @Permission(alias="legacy",strings={"android.permission.READ_EXTERNAL_STORAGE"}),
 @Permission(alias="images",strings={"android.permission.READ_MEDIA_IMAGES"}),
 @Permission(alias="videos",strings={"android.permission.READ_MEDIA_VIDEO"}),
 @Permission(alias="selected",strings={"android.permission.READ_MEDIA_VISUAL_USER_SELECTED"})
})
public class LegendarioMediaPlugin extends Plugin {
 private final ExecutorService worker=Executors.newSingleThreadExecutor();
 private boolean granted(String p){return Build.VERSION.SDK_INT<23 || getContext().checkSelfPermission(p)==PackageManager.PERMISSION_GRANTED;}
 @PluginMethod public void access(PluginCall call){
  boolean old=Build.VERSION.SDK_INT<33 && granted("android.permission.READ_EXTERNAL_STORAGE");
  JSObject out=new JSObject();
  out.put("videos",old || (Build.VERSION.SDK_INT>=33 && granted("android.permission.READ_MEDIA_VIDEO")));
  out.put("images",old || (Build.VERSION.SDK_INT>=33 && granted("android.permission.READ_MEDIA_IMAGES")));
  out.put("partial",Build.VERSION.SDK_INT>=34 && granted("android.permission.READ_MEDIA_VISUAL_USER_SELECTED"));
  call.resolve(out);
 }
 @PluginMethod public void requestLibrary(PluginCall call){
  if(Build.VERSION.SDK_INT>=34)requestPermissionForAliases(new String[]{"images","videos","selected"},call,"libraryResult");
  else if(Build.VERSION.SDK_INT>=33)requestPermissionForAliases(new String[]{"images","videos"},call,"libraryResult");
  else if(Build.VERSION.SDK_INT>=23)requestPermissionForAlias("legacy",call,"libraryResult");
  else access(call);
 }
 @PermissionCallback private void libraryResult(PluginCall call){access(call);}
 @PluginMethod public void listMedia(PluginCall call){worker.execute(()->{
  try{
   boolean video=!"images".equals(call.getString("kind","videos"));
   int offset=Math.max(0,call.getInt("offset",0)),limit=Math.min(24,Math.max(1,call.getInt("limit",24)));
   Uri collection=video?MediaStore.Video.Media.EXTERNAL_CONTENT_URI:MediaStore.Images.Media.EXTERNAL_CONTENT_URI;
   String[] columns=video?new String[]{"_id","_display_name","_size","duration"}:new String[]{"_id","_display_name","_size"};
   JSArray items=new JSArray();boolean more=false;
   try(Cursor cursor=getContext().getContentResolver().query(collection,columns,null,null,"date_added DESC, _id DESC")){
    if(cursor!=null){more=cursor.getCount()>offset+limit;cursor.moveToPosition(offset-1);
     while(items.length()<limit && cursor.moveToNext()){
      Uri uri=ContentUris.withAppendedId(collection,cursor.getLong(0));
      JSObject row=new JSObject();row.put("uri",uri.toString());row.put("name",cursor.getString(1));row.put("size",cursor.getLong(2));row.put("duration",video?cursor.getLong(3)/1000.0:0);row.put("kind",video?"videos":"images");
      if(Build.VERSION.SDK_INT>=29){try{
       Bitmap bitmap=getContext().getContentResolver().loadThumbnail(uri,new Size(160,100),null);
       ByteArrayOutputStream bytes=new ByteArrayOutputStream();bitmap.compress(Bitmap.CompressFormat.JPEG,65,bytes);bitmap.recycle();
       row.put("thumbnail","data:image/jpeg;base64,"+Base64.encodeToString(bytes.toByteArray(),Base64.NO_WRAP));
      }catch(Exception ignored){}}
      items.put(row);
     }
    }
   }
   JSObject result=new JSObject();result.put("items",items);result.put("more",more);call.resolve(result);
  }catch(Exception e){call.reject("Não foi possível consultar a biblioteca. Verifique as permissões.",e);}
 });}
 @PluginMethod public void importVideo(PluginCall call){worker.execute(()->{
  File dest=null;
  try{
   Uri uri=Uri.parse(call.getString("uri",""));
   if(!"content".equals(uri.getScheme()) || !"media".equals(uri.getAuthority()))throw new IOException("URI fora da biblioteca de média.");
   String mime=getContext().getContentResolver().getType(uri);
   if(mime==null || !mime.startsWith("video/"))throw new IOException("Selecione um vídeo.");
   File dir=new File(getContext().getFilesDir(),"imports");if(!dir.exists()&&!dir.mkdirs())throw new IOException("Armazenamento indisponível.");
   String ext=MimeTypeMap.getSingleton().getExtensionFromMimeType(mime);if(ext==null)ext="mp4";
   dest=File.createTempFile("video-","."+ext,dir);
   try(InputStream in=getContext().getContentResolver().openInputStream(uri);OutputStream out=new FileOutputStream(dest)){
    if(in==null)throw new IOException("Vídeo inacessível.");byte[] buffer=new byte[65536];int count;
    while((count=in.read(buffer))!=-1)out.write(buffer,0,count);
   }
   JSObject result=new JSObject();result.put("path",Uri.fromFile(dest).toString());call.resolve(result);
  }catch(Exception e){if(dest!=null)dest.delete();call.reject("Falha ao importar: verifique o espaço e a permissão.",e);}
 });}
 private File draftFile(String id)throws IOException{
  if(id==null||!id.matches("[A-Za-z0-9_-]{1,100}"))throw new IOException("Identificador inválido.");
  File dir=new File(getContext().getFilesDir(),"drafts");if(!dir.exists()&&!dir.mkdirs())throw new IOException("Não foi possível criar armazenamento.");return new File(dir,id+".json");
 }
 @PluginMethod public void saveDraft(PluginCall call){worker.execute(()->{
  FileOutputStream stream=null;AtomicFile file=null;
  try{JSObject draft=call.getObject("draft");if(draft==null)throw new IOException("Rascunho vazio.");file=new AtomicFile(draftFile(draft.getString("id")));stream=file.startWrite();stream.write(draft.toString().getBytes("UTF-8"));file.finishWrite(stream);call.resolve();}
  catch(Exception e){if(file!=null&&stream!=null)file.failWrite(stream);call.reject("Falha ao guardar rascunho.",e);}
 });}
 @PluginMethod public void readDraft(PluginCall call){worker.execute(()->{
  try{JSObject draft=new JSObject(new String(new AtomicFile(draftFile(call.getString("id"))).readFully(),"UTF-8"));
   String path=draft.optString("path","");if(!path.isEmpty()&&!new File(Uri.parse(path).getPath()).isFile())draft.put("missing",true);
   call.resolve(draft);
  }catch(Exception e){call.reject("Rascunho não encontrado ou danificado.",e);}
 });}
 @PluginMethod public void listDrafts(PluginCall call){worker.execute(()->{
  try{JSArray items=new JSArray();File dir=new File(getContext().getFilesDir(),"drafts");File[] list=dir.listFiles((d,n)->n.endsWith(".json"));
   if(list!=null)for(File f:list){try{JSONObject d=new JSONObject(new String(new AtomicFile(f).readFully(),"UTF-8"));JSObject row=new JSObject();row.put("id",d.getString("id"));row.put("name",d.optString("name","Projeto"));row.put("updated",d.optLong("updated",0));row.put("thumbnail",d.optString("thumbnail",""));items.put(row);}catch(Exception ignored){}}
   JSObject out=new JSObject();out.put("items",items);call.resolve(out);
  }catch(Exception e){call.reject("Falha ao listar rascunhos.",e);}
 });}
 @PluginMethod public void deleteDraft(PluginCall call){worker.execute(()->{
  try{new AtomicFile(draftFile(call.getString("id"))).delete();call.resolve();}catch(Exception e){call.reject("Falha ao eliminar rascunho.",e);}
 });}
 @Override protected void handleOnDestroy(){worker.shutdown();super.handleOnDestroy();}
}
