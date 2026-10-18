package com.legendario.editor;

import android.content.Context;
import android.graphics.*;
import androidx.media3.common.VideoFrameProcessingException;
import androidx.media3.common.util.Size;
import androidx.media3.common.util.UnstableApi;
import androidx.media3.effect.BitmapOverlay;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.*;
import org.json.*;
import com.legendario.editor.LegendarioMotion.Frame;

/** Offline typography, layout and seven animation scopes, matching the Canvas preview. */
@UnstableApi
public final class LegendarioCaptionOverlay extends BitmapOverlay {
 private final List<JSONObject> cues=new ArrayList<>();
 private final JSONObject style;
 private final String presentation;
 private final List<JSONObject> tracks;
 private final Typeface typeface;
 private Bitmap bitmap;
 private float scale,fontSize,tracking,lineHeight;
 private double elapsed,span,wordProgress;
 private int active,totalWords,totalChars;
 private Canvas canvas;
 private final Paint paint=new Paint(Paint.ANTI_ALIAS_FLAG|Paint.SUBPIXEL_TEXT_FLAG),shape=new Paint(Paint.ANTI_ALIAS_FLAG);
 private static final Map<String,Typeface> fontCache=new ConcurrentHashMap<>();
 private static final Map<String,String> fonts=new HashMap<>();
 static{
  fonts.put("Manrope","Manrope.ttf");fonts.put("Anton","Anton.ttf");fonts.put("Bebas Neue","BebasNeue.ttf");
  fonts.put("Barlow Condensed","BarlowCondensed.ttf");fonts.put("Libre Baskerville","LibreBaskerville.ttf");fonts.put("Space Mono","SpaceMono.ttf");
 }
 private static final class Word{
  String text;int index,charIndex;
  Word(String t,int i,int c){text=t;index=i;charIndex=c;}
 }
 public LegendarioCaptionOverlay(JSONArray array,JSONObject style,String presentation,int effectMs)throws JSONException{this(array,style,presentation,effectMs,null);}
 public LegendarioCaptionOverlay(JSONArray array,JSONObject style,String presentation,int effectMs,Context context)throws JSONException{
  this.style=style;this.presentation=presentation;this.tracks=LegendarioMotion.tracks(style,effectMs);
  String family=style.optString("fontFamily","Manrope");int weight=style.optInt("fontWeight",800);String key=family+"-"+weight;
  Typeface face=fontCache.get(key);
  if(face==null){
   if(context!=null&&fonts.containsKey(family)){
    Typeface.Builder builder=new Typeface.Builder(context.getAssets(),"public/fonts/"+fonts.get(family)).setWeight(weight);
    if(family.equals("Manrope")||family.equals("Libre Baskerville"))builder.setFontVariationSettings("'wght' "+weight);
    face=builder.build();
   }else face=Typeface.create(family,weight>=600?Typeface.BOLD:Typeface.NORMAL);
   if(face==null)throw new IllegalArgumentException("Fonte offline indisponível: "+family);
   if(context!=null)fontCache.put(key,face);
  }
  typeface=face;
  for(int i=0;i<array.length();i++){
   JSONObject cue=array.getJSONObject(i);double start=cue.getDouble("start"),end=cue.getDouble("end");
   if(!Double.isFinite(start)||!Double.isFinite(end)||start<0||end<=start)throw new IllegalArgumentException("Tempos inválidos.");
   if(!cue.getString("text").trim().isEmpty())cues.add(cue);
  }
  cues.sort(Comparator.comparingDouble(cue->cue.optDouble("start")));
 }
 @Override public void configure(Size size){
  if(bitmap!=null)bitmap.recycle();bitmap=Bitmap.createBitmap(size.getWidth(),size.getHeight(),Bitmap.Config.ARGB_8888);
  canvas=new Canvas(bitmap);scale=size.getWidth()/720f;
 }
 private int color(String key,int fallback){try{return Color.parseColor(style.optString(key));}catch(Exception e){return fallback;}}
 private float value(String key,double fallback){return(float)style.optDouble(key,fallback);}
 private float width(String text){return paint.measureText(text)+Math.max(0,text.codePointCount(0,text.length())-1)*tracking;}
 private Frame frame(String scope,Word word,int offset,int line,int lines){
  return LegendarioMotion.at(tracks,scope,elapsed,span,word.index/(double)totalWords*span,(word.charIndex+offset)/(double)totalChars*span,line/(double)lines*span,word.index+offset*.37,word.index==active);
 }
 private void apply(Frame f){canvas.translate((float)f.dx*scale,(float)f.dy*scale);canvas.rotate((float)f.rotate);canvas.scale((float)f.sx,(float)f.sy);}
 private void clip(Frame f,float x,float y,float w,float h){if(f.reveal<1)canvas.clipRect(x,y,x+w*(float)f.reveal,y+h);}
 private int withAlpha(int color,double alpha){return(color&0xffffff)|((int)(Color.alpha(color)*LegendarioMotion.clamp(alpha))<<24);}
 private void rect(float x,float y,float w,float h,float radius,int color,double alpha,boolean stroke){
  shape.setShader(null);shape.setColor(withAlpha(color,alpha));shape.setStyle(stroke?Paint.Style.STROKE:Paint.Style.FILL);shape.setStrokeWidth(2*scale);
  float r=Math.max(0,Math.min(radius,Math.min(w/2,h/2)));canvas.drawRoundRect(x,y,x+w,y+h,r,r,shape);
 }
 private void box(float x,float y,float w,float h,double alpha){
  float p=value("padding",10)*scale;
  rect(x-p,y-p,w+p*2,h+p*2,value("backgroundRadius",0)*scale,color("backgroundColor",Color.BLACK),alpha*value("backgroundOpacity",.9),false);
  if(style.has("accentBar"))rect(x-p,y-p,4*scale,h+p*2,0,color("accentBar",Color.WHITE),alpha,false);
 }
 private void glyph(String text,float x,float y,int fill,double alpha,Frame f){
  paint.setShader(null);paint.clearShadowLayer();paint.setMaskFilter(f.blur>.01?new BlurMaskFilter((float)f.blur*scale,BlurMaskFilter.Blur.NORMAL):null);
  paint.setStrokeJoin(Paint.Join.ROUND);paint.setTextAlign(Paint.Align.LEFT);
  if(style.has("glow")||f.glow>1.001){int c=color("glow",color("highlightColor",Color.WHITE));paint.setShadowLayer(fontSize*.18f*(float)f.glow,0,0,withAlpha(c,alpha));}
  else if(style.optBoolean("shadow"))paint.setShadowLayer(4*scale,2*scale,2*scale,withAlpha(Color.BLACK,alpha*.8));
  paint.setStyle(Paint.Style.FILL);paint.setColor(withAlpha(color("extrusionColor",Color.rgb(21,32,43)),alpha));
  for(int d=Math.min(8,style.optInt("extrusionDepth",0));d>0;d--)canvas.drawText(text,x+d*scale,y+d*scale,paint);
  float outline=value("outlineWidth",0)*2*scale;
  if(outline>0||style.optBoolean("strokeOnly")){
   paint.setStyle(Paint.Style.STROKE);paint.setStrokeWidth(outline>0?outline:2*scale);paint.setColor(withAlpha(color("outlineColor",Color.rgb(16,17,20)),alpha));canvas.drawText(text,x,y,paint);
  }
  if(!style.optBoolean("strokeOnly")){
   paint.setStyle(Paint.Style.FILL);paint.setColor(withAlpha(fill,alpha));
   if(style.has("gradient")&&fill==color("color",Color.WHITE)){
    Matcher m=Pattern.compile("#[0-9a-fA-F]{6}").matcher(style.optString("gradient"));List<Integer> stops=new ArrayList<>();
    while(m.find())stops.add(Color.parseColor(m.group()));
    if(stops.size()>1)paint.setShader(new LinearGradient(x,y,x+Math.max(1,paint.measureText(text)),y,stops.get(0),stops.get(stops.size()-1),Shader.TileMode.CLAMP));
   }
   canvas.drawText(text,x,y,paint);
  }
  paint.setShader(null);paint.setMaskFilter(null);paint.clearShadowLayer();
 }
 private void wordGlyph(Word word,float w,int color,double alpha,Frame wf,int line,int lines){
  boolean chars=false;for(JSONObject a:tracks)if(a.optString("mode").equals("char"))chars=true;
  float spacing=tracking+(float)wf.tracking*scale;
  if(!chars&&spacing==0){glyph(word.text,-w/2,fontSize*.34f,color,alpha,wf);return;}
  int[] points=word.text.codePoints().toArray();float total=paint.measureText(word.text)+Math.max(0,points.length-1)*spacing,cx=-total/2;
  for(int i=0;i<points.length;i++){
   String text=new String(Character.toChars(points[i]));float cw=paint.measureText(text);Frame cf=frame("char",word,i,line,lines);
   cf.glow*=wf.glow;cf.blur=Math.max(cf.blur,wf.blur);canvas.save();canvas.translate(cx+cw/2,0);apply(cf);clip(cf,-cw/2,-lineHeight/2,cw,lineHeight);
   glyph(text,-cw/2,fontSize*.34f,color,alpha*cf.alpha,cf);canvas.restore();cx+=cw+spacing;
  }
 }
 @Override public Bitmap getBitmap(long timeUs){
  bitmap.eraseColor(Color.TRANSPARENT);double time=timeUs/1_000_000.0;JSONObject cue=null;
  for(JSONObject c:cues){if(c.optDouble("start")>time)break;if(time<c.optDouble("end"))cue=c;}
  if(cue==null)return bitmap;
  elapsed=time-cue.optDouble("start");span=cue.optDouble("end")-cue.optDouble("start");
  String text=cue.optString("text").trim();if(style.optBoolean("uppercase"))text=text.toUpperCase(Locale.ROOT);
  List<Word> all=new ArrayList<>();int chars=0,index=0;
  for(String word:text.split("\\s+")){all.add(new Word(word,index++,chars));chars+=word.codePointCount(0,word.length());}
  totalWords=all.size();totalChars=Math.max(1,chars);active=Math.min(totalWords-1,(int)(elapsed/span*totalWords));wordProgress=LegendarioMotion.clamp(elapsed/span*totalWords-active);
  List<Word> words=all;
  if(presentation.equals("Palavra"))words=all.subList(active,active+1);
  if(presentation.equals("Blocos")){int n=Math.max(1,Math.min(8,style.optInt("blockSize",3))),first=active/n*n;words=all.subList(first,Math.min(all.size(),first+n));}
  Frame block=frame("block",all.get(0),0,0,1);fontSize=value("fontSize",44)*scale;tracking=(value("letterSpacing",0)+(float)block.tracking)*scale;
  paint.setTypeface(typeface);paint.setTextSkewX(style.optBoolean("italic")?-.2f:0);
  List<List<Word>> lines=new ArrayList<>();List<Float> widths=new ArrayList<>();
  for(int attempt=0;attempt<22;attempt++){
   paint.setTextSize(fontSize);float space=paint.measureText(" ");lines.clear();widths.clear();List<Word> line=new ArrayList<>();float lw=0,max=0;
   for(Word word:words){float ww=width(word.text);if(!line.isEmpty()&&lw+space+ww>bitmap.getWidth()*.86f){lines.add(line);widths.add(lw);max=Math.max(max,lw);line=new ArrayList<>();lw=0;}if(!line.isEmpty())lw+=space;line.add(word);lw+=ww;}
   if(!line.isEmpty()){lines.add(line);widths.add(lw);max=Math.max(max,lw);}
   if((lines.size()<=Math.max(1,style.optInt("maxLines",2))&&max<=bitmap.getWidth()*.86f)||fontSize<=12*scale)break;
   fontSize*=.92f;
  }
  lineHeight=fontSize*value("lineHeight",1.25);float padding=value("padding",10)*scale;String align=style.optString("align","center");
  float anchor=bitmap.getWidth()*value("posX",align.equals("left")?10:align.equals("right")?90:50)/100,left=Float.POSITIVE_INFINITY,right=Float.NEGATIVE_INFINITY;
  for(float w:widths){float l=align.equals("left")?0:align.equals("right")?-w:-w/2;left=Math.min(left,l);right=Math.max(right,l+w);}
  float top=-lineHeight*lines.size()/2;
  canvas.save();canvas.translate(anchor,bitmap.getHeight()*value("posY",78)/100);apply(block);clip(block,left-padding,top-padding,right-left+padding*2,-top*2+padding*2);
  boolean lineBox=style.optString("backgroundMode","block").equals("line");
  if(style.has("backgroundColor")&&!lineBox)box(left,top,right-left,-top*2,block.alpha);
  float space=paint.measureText(" ");
  for(int li=0;li<lines.size();li++){
   List<Word> line=lines.get(li);float lw=widths.get(li),lineLeft=align.equals("left")?0:align.equals("right")?-lw:-lw/2;Frame lf=frame("line",line.get(0),0,li,lines.size());
   canvas.save();canvas.translate(lineLeft+lw/2,(li-(lines.size()-1)/2f)*lineHeight);apply(lf);clip(lf,-lw/2-padding,-lineHeight/2-padding,lw+padding*2,lineHeight+padding*2);
   if(style.has("backgroundColor")&&lineBox)box(-lw/2,-lineHeight/2,lw,lineHeight,block.alpha*lf.alpha);
   float x=-lw/2;
   for(Word word:line){
    float w=width(word.text);Frame wf=frame("word",word,0,li,lines.size());wf.glow*=block.glow*lf.glow;wf.blur=Math.max(wf.blur,Math.max(block.blur,lf.blur));
    boolean hi=presentation.equals("Realce ativo"),on=word.index==active;String mode=style.optString("highlightMode","color");
    double alpha=block.alpha*lf.alpha*wf.alpha*(hi&&word.index>active?value("futureOpacity",1):1);
    canvas.save();canvas.translate(x+w/2,0);apply(wf);if(hi&&on&&mode.equals("scale"))canvas.scale(1.13f,1.13f);
    clip(wf,-w/2-padding,-lineHeight/2-padding,w+padding*2,lineHeight+padding*2);
    if(hi&&on&&(mode.equals("box")||mode.equals("pill")))rect(-w/2-6*scale,-fontSize*.6f,w+12*scale,fontSize*1.2f,mode.equals("pill")?fontSize*.6f:3*scale,color("highlightBackground",color("highlightColor",Color.YELLOW)),alpha,false);
    int fill=hi&&on&&!mode.equals("karaoke")&&!mode.equals("outline")?color("highlightColor",Color.YELLOW):color("color",Color.WHITE);
    wordGlyph(word,w,fill,alpha,wf,li,lines.size());
    if(hi&&mode.equals("karaoke")&&word.index<=active){canvas.save();canvas.clipRect(-w/2-padding,-lineHeight/2-padding,-w/2-padding+(w+padding*2)*(float)(word.index<active?1:wordProgress),lineHeight/2+padding);wordGlyph(word,w,color("highlightColor",Color.YELLOW),alpha,wf,li,lines.size());canvas.restore();}
    if(hi&&on&&mode.equals("outline"))rect(-w/2-5*scale,-fontSize*.6f,w+10*scale,fontSize*1.2f,4*scale,color("highlightColor",Color.YELLOW),alpha,true);
    if(hi&&on&&mode.equals("underline"))rect(-w/2,fontSize*.54f,w,fontSize*.065f,0,color("highlightColor",Color.YELLOW),alpha,false);
    canvas.restore();x+=w+space;
   }
   canvas.restore();
  }
  canvas.restore();return bitmap;
 }
 @Override public void release()throws VideoFrameProcessingException{super.release();if(bitmap!=null){bitmap.recycle();bitmap=null;canvas=null;}}
}
