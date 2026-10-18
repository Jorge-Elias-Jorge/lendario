package com.legendario.editor;

import android.content.Context;
import android.graphics.Bitmap;
import android.media.MediaMetadataRetriever;
import android.net.Uri;
import android.os.Build;
import android.provider.MediaStore;
import android.util.Base64;
import android.util.Size;
import java.io.ByteArrayOutputStream;

/** MediaStore on 10+, retriever fallback on Android 8/9. Small JPEG payload only. */
public final class LegendarioThumbnail {
 public static String create(Context context,Uri uri,boolean video)throws Exception{
  Bitmap frame=null,scaled=null;
  try{
   if(Build.VERSION.SDK_INT>=29){try{frame=context.getContentResolver().loadThumbnail(uri,new Size(256,256),null);}catch(Exception ignored){}}
   if(frame==null&&video&&Build.VERSION.SDK_INT<29&&"content".equals(uri.getScheme())&&"media".equals(uri.getAuthority())){
    try{frame=MediaStore.Video.Thumbnails.getThumbnail(context.getContentResolver(),android.content.ContentUris.parseId(uri),MediaStore.Video.Thumbnails.MINI_KIND,null);}catch(Exception ignored){}
   }
   if(frame==null&&video){
    MediaMetadataRetriever retriever=new MediaMetadataRetriever();
    try{
     retriever.setDataSource(context,uri);
     if(Build.VERSION.SDK_INT>=27)frame=retriever.getScaledFrameAtTime(1_000_000,MediaMetadataRetriever.OPTION_CLOSEST_SYNC,256,256);
     else frame=retriever.getFrameAtTime(1_000_000,MediaMetadataRetriever.OPTION_CLOSEST_SYNC);
     if(frame==null)frame=retriever.getFrameAtTime(0,MediaMetadataRetriever.OPTION_CLOSEST_SYNC);
    }finally{retriever.release();}
   }
   if(frame==null&&!video&&"content".equals(uri.getScheme())){
    frame=MediaStore.Images.Thumbnails.getThumbnail(context.getContentResolver(),android.content.ContentUris.parseId(uri),MediaStore.Images.Thumbnails.MINI_KIND,null);
   }
   if(frame==null)return null;
   double ratio=Math.min(1,256.0/Math.max(frame.getWidth(),frame.getHeight()));
   scaled=ratio<1?Bitmap.createScaledBitmap(frame,Math.max(1,(int)(frame.getWidth()*ratio)),Math.max(1,(int)(frame.getHeight()*ratio)),true):frame;
   ByteArrayOutputStream bytes=new ByteArrayOutputStream();scaled.compress(Bitmap.CompressFormat.JPEG,72,bytes);
   return "data:image/jpeg;base64,"+Base64.encodeToString(bytes.toByteArray(),Base64.NO_WRAP);
  }finally{if(scaled!=null&&scaled!=frame)scaled.recycle();if(frame!=null)frame.recycle();}
 }
}
