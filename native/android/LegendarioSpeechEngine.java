package com.legendario.editor;

import android.content.Context;
import android.media.*;
import java.io.*;
import java.nio.*;
import java.util.concurrent.CancellationException;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.zip.*;
import org.json.*;
import org.vosk.Model;
import org.vosk.Recognizer;

/** Streaming audio decoder + local ASR. No microphone, HTTP, Base64 audio or cloud. */
public final class LegendarioSpeechEngine {
 public interface Progress {void update(double fraction,String stage);}
 private static final String MODEL="vosk-model-small-pt-0.3";
 private static final AtomicBoolean RUNNING=new AtomicBoolean();
 public static boolean isRunning(){return RUNNING.get();}
 public static void check(AtomicBoolean cancelled){if(cancelled.get()||Thread.currentThread().isInterrupted())throw new CancellationException("Análise cancelada.");}
 private static void remove(File file){if(file.isDirectory()){File[] children=file.listFiles();if(children!=null)for(File c:children)remove(c);}file.delete();}
 public static File prepareModel(Context context,AtomicBoolean cancelled)throws Exception{
  File models=new File(context.getFilesDir(),"speech"),ready=new File(models,MODEL);
  if(new File(ready,".complete").isFile())return ready;
  if(!models.isDirectory()&&!models.mkdirs())throw new IOException("Não foi possível preparar o armazenamento do modelo.");
  if(models.getUsableSpace()<100L*1024*1024)throw new IOException("São necessários pelo menos 100 MB livres para preparar o modelo de voz.");
  File temporary=new File(models,"unpack");remove(temporary);
  if(!temporary.mkdirs())throw new IOException("Pasta do modelo indisponível.");
  try(ZipInputStream zip=new ZipInputStream(context.getAssets().open("speech/pt.zip"))){
   ZipEntry entry;long total=0;int files=0;byte[] buffer=new byte[65536];
   while((entry=zip.getNextEntry())!=null){
    check(cancelled);
    File target=new File(temporary,entry.getName()).getCanonicalFile();
    if(!target.getPath().startsWith(temporary.getCanonicalPath()+File.separator)||++files>1000)
     throw new IOException("Arquivo de modelo inválido.");
    if(entry.isDirectory()){if(!target.isDirectory()&&!target.mkdirs())throw new IOException("Falha ao preparar o modelo.");}
    else{
     File parent=target.getParentFile();if(!parent.isDirectory()&&!parent.mkdirs())throw new IOException("Falha ao preparar o modelo.");
     try(OutputStream out=new FileOutputStream(target)){
      int n;while((n=zip.read(buffer))!=-1){check(cancelled);total+=n;if(total>256L*1024*1024)throw new IOException("Modelo acima do limite de segurança.");out.write(buffer,0,n);}
     }
    }
    zip.closeEntry();
   }
   File unpacked=new File(temporary,MODEL);
   if(!new File(unpacked,"final.mdl").isFile())throw new IOException("Modelo de português incompleto.");
   check(cancelled);remove(ready);
   if(!unpacked.renameTo(ready))throw new IOException("Não foi possível finalizar o modelo.");
   if(!new File(ready,".complete").createNewFile())throw new IOException("Não foi possível confirmar o modelo.");
   return ready;
  }finally{remove(temporary);}
 }
 private static void append(JSONArray words,String json)throws JSONException{
  JSONArray result=new JSONObject(json).optJSONArray("result");
  if(result==null)return;
  for(int i=0;i<result.length();i++){
   JSONObject word=result.getJSONObject(i);
   if(words.length()>=15000)throw new IllegalArgumentException("Demasiadas palavras. Divida o vídeo em trechos menores.");
   words.put(new JSONObject().put("text",word.getString("word")).put("start",word.getDouble("start"))
    .put("end",word.getDouble("end")).put("confidence",word.optDouble("conf",0)));
  }
 }
 public static JSONObject transcribe(Context context,File source,AtomicBoolean cancelled,Progress progress)throws Exception{
  MediaExtractor extractor=new MediaExtractor();MediaCodec decoder=null;Recognizer recognizer=null;Model model=null;
  if(!RUNNING.compareAndSet(false,true)){extractor.release();throw new IOException("Já existe uma análise de voz em andamento.");}
  try{
   extractor.setDataSource(source.getAbsolutePath());int track=-1;MediaFormat input=null;
   for(int i=0;i<extractor.getTrackCount();i++){MediaFormat f=extractor.getTrackFormat(i);String mime=f.getString(MediaFormat.KEY_MIME);if(mime!=null&&mime.startsWith("audio/")){track=i;input=f;break;}}
   if(track<0)throw new IOException("O vídeo não contém faixa de áudio. Escolha um vídeo com narração.");
   long durationUs=input.containsKey(MediaFormat.KEY_DURATION)?input.getLong(MediaFormat.KEY_DURATION):0;
   if(durationUs<=0||durationUs>1800_000_000L)throw new IOException("Esta versão analisa vídeos com duração conhecida de até 30 minutos.");
   progress.update(0,"A preparar o modelo de português incluído no aplicativo");
   File folder=prepareModel(context,cancelled);check(cancelled);
   model=new Model(folder.getAbsolutePath());check(cancelled);
   extractor.selectTrack(track);decoder=MediaCodec.createDecoderByType(input.getString(MediaFormat.KEY_MIME));
   input.setInteger(MediaFormat.KEY_PCM_ENCODING,AudioFormat.ENCODING_PCM_16BIT);
   decoder.configure(input,null,null,0);decoder.start();
   int rate=input.getInteger(MediaFormat.KEY_SAMPLE_RATE),channels=input.getInteger(MediaFormat.KEY_CHANNEL_COUNT),encoding=AudioFormat.ENCODING_PCM_16BIT;
   if(rate<8000||rate>192000)throw new IOException("Frequência de áudio não suportada.");
   long samples=0,lastOutput=System.nanoTime(),lastProgress=0;boolean inEnd=false,outEnd=false;
   MediaCodec.BufferInfo info=new MediaCodec.BufferInfo();JSONArray words=new JSONArray();
   while(!outEnd){
    check(cancelled);
    if(!inEnd){
     int index=decoder.dequeueInputBuffer(10000);
     if(index>=0){
      ByteBuffer buffer=decoder.getInputBuffer(index);buffer.clear();int size=extractor.readSampleData(buffer,0);
      if(size<0){decoder.queueInputBuffer(index,0,0,0,MediaCodec.BUFFER_FLAG_END_OF_STREAM);inEnd=true;}
      else{decoder.queueInputBuffer(index,0,size,extractor.getSampleTime(),0);extractor.advance();}
     }
    }
    int index=decoder.dequeueOutputBuffer(info,10000);
    if(index==MediaCodec.INFO_OUTPUT_FORMAT_CHANGED){
     MediaFormat f=decoder.getOutputFormat();rate=f.getInteger(MediaFormat.KEY_SAMPLE_RATE);channels=f.getInteger(MediaFormat.KEY_CHANNEL_COUNT);
     encoding=f.containsKey(MediaFormat.KEY_PCM_ENCODING)?f.getInteger(MediaFormat.KEY_PCM_ENCODING):AudioFormat.ENCODING_PCM_16BIT;
     if(recognizer!=null)throw new IOException("O formato de áudio mudou durante a análise.");
    }else if(index>=0){
     try{
      lastOutput=System.nanoTime();
      if(info.size>0){
       if(channels<1||channels>8||(encoding!=AudioFormat.ENCODING_PCM_16BIT&&encoding!=AudioFormat.ENCODING_PCM_FLOAT))throw new IOException("Formato PCM não suportado.");
       if(recognizer==null){recognizer=new Recognizer(model,(float)rate);recognizer.setWords(true);}
       ByteBuffer buffer=decoder.getOutputBuffer(index).duplicate().order(ByteOrder.LITTLE_ENDIAN);
       buffer.position(info.offset);buffer.limit(info.offset+info.size);
       int bytesPerSample=encoding==AudioFormat.ENCODING_PCM_FLOAT?4:2;
       int frames=info.size/(channels*bytesPerSample);
       long target=Math.max(0,Math.round(info.presentationTimeUs/1_000_000.0*rate));
       // Preserve leading silence and timestamp gaps instead of shifting narration to t=0.
       long gap=target-samples;
       if(gap>rate/50){
        if(gap>rate*1800L)throw new IOException("Salto de tempo inválido na faixa de áudio.");
        short[] silence=new short[4096];
        while(gap>0){check(cancelled);int count=(int)Math.min(gap,silence.length);if(recognizer.acceptWaveForm(silence,count))append(words,recognizer.getResult());samples+=count;gap-=count;}
       }
       int skip=target<samples-rate/50? (int)Math.min(frames,samples-target):0;
       short[] mono=new short[Math.max(0,frames-skip)];
       for(int f=0;f<frames;f++){
        double sum=0;
        for(int c=0;c<channels;c++)sum+=encoding==AudioFormat.ENCODING_PCM_FLOAT?Math.max(-1,Math.min(1,buffer.getFloat()))*32767:buffer.getShort();
        if(f>=skip)mono[f-skip]=(short)Math.max(-32768,Math.min(32767,Math.round(sum/channels)));
       }
       if(mono.length>0){if(recognizer.acceptWaveForm(mono,mono.length))append(words,recognizer.getResult());samples+=mono.length;}
       long now=System.nanoTime();if(now-lastProgress>250_000_000L){progress.update(Math.min(.99,samples/(double)rate/(durationUs/1_000_000.0)),"A reconhecer palavras no áudio, sem internet");lastProgress=now;}
      }
      outEnd=(info.flags&MediaCodec.BUFFER_FLAG_END_OF_STREAM)!=0;
     }finally{decoder.releaseOutputBuffer(index,false);}
    }
    if(System.nanoTime()-lastOutput>120_000_000_000L)throw new IOException("O descodificador deixou de responder.");
   }
   check(cancelled);if(recognizer!=null)append(words,recognizer.getFinalResult());
   progress.update(1,"Áudio analisado. A comparar com o SRT");
   return new JSONObject().put("words",words).put("duration",Math.max(durationUs/1_000_000.0,samples/(double)rate))
    .put("engine","vosk-pt-0.3").put("language","pt");
  }finally{
   try{
    if(decoder!=null){try{decoder.stop();}catch(Exception ignored){}try{decoder.release();}catch(Exception ignored){}}
    extractor.release();if(recognizer!=null)recognizer.close();if(model!=null)model.close();
   }finally{RUNNING.set(false);}
  }
 }
}
