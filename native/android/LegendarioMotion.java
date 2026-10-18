package com.legendario.editor;
import java.util.*;
import org.json.*;

/** Deterministic counterpart of src/core/motion.ts; device tests verify shared vectors. */
public final class LegendarioMotion {
 public static final class Frame {public double dx=0,dy=0,sx=1,sy=1,rotate=0,alpha=1,reveal=1,blur=0,tracking=0,glow=1;}
 public static double clamp(double v){return Math.max(0,Math.min(1,v));}
 public static Frame sample(JSONObject a,double progress,double seed,boolean loop){
  Frame f=new Frame();double p=clamp(progress),i=Math.max(0,Math.min(1.5,a.optDouble("intensity",.8))),t=p;
  switch(a.optString("easing","easeOut")){
   case "easeOut":t=1-Math.pow(1-p,3);break;case "easeInOut":t=p*p*(3-2*p);break;
   case "back":t=1+2.70158*Math.pow(p-1,3)+1.70158*Math.pow(p-1,2);break;
  }
  double r=1-t,phase=(loop?progress:p)*Math.PI*2;String direction=a.optString("direction","");
  int sign=direction.equals("left")||direction.equals("up")?-1:1;
  switch(a.optString("type","None")){
   case "None":break;case "Fade":f.alpha=t;break;
   case "Zoom":f.sx=f.sy=1-r*.65*i;f.alpha=t;break;
   case "Pop":f.sx=f.sy=1-r*.5*i+Math.sin(p*Math.PI)*.2*i;break;
   case "Bounce":f.dy=(-r*r*50+Math.abs(Math.sin(t*Math.PI*3))*r*16)*i;f.alpha=clamp(p*4);break;
   case "Slide":if(direction.equals("up")||direction.equals("down"))f.dy=sign*r*65*i;else f.dx=sign*r*65*i;f.alpha=t;break;
   case "Reveal":case "Mask":case "Typewriter":f.reveal=p;break;
   case "Rotate":f.rotate=sign*r*38*i;f.alpha=t;break;
   case "Elastic":f.sx=1-Math.cos(p*14)*Math.pow(1-p,2)*.6*i;f.sy=1+Math.cos(p*14)*Math.pow(1-p,2)*.25*i;break;
   case "Impact":f.sx=f.sy=1+r*.8*i;f.dx=Math.sin(p*40)*r*3*i;f.alpha=clamp(p*5);break;
   case "Pulse":f.sx=f.sy=1+Math.sin(phase)*.12*i;break;
   case "Glow":f.glow=1+(.5+.5*Math.sin(phase))*2*i;break;
   case "Shake":f.dx=Math.sin((loop?progress:p)*36+seed*.7)*7*i*(loop?1:r);f.dy=Math.sin((loop?progress:p)*47+seed)*3*i*(loop?1:r);break;
   case "Glitch":f.dx=(Math.sin((loop?progress:p)*63+seed*2)>0?1:-1)*5*i*(loop?1:r);f.alpha=Math.sin((loop?progress:p)*91+seed)>.8?.55:1;break;
   case "Float":f.dy=Math.sin(phase)*9*i;break;
   case "Wave":f.dy=Math.sin(phase+seed*.65)*12*i;f.rotate=Math.sin(phase+seed*.65)*3*i;break;
   case "Flicker":f.alpha=.45+.55*Math.abs(Math.sin(phase*3+seed));if(!loop&&p==1)f.alpha=1;break;
   case "Flip":f.sx=Math.max(.02,Math.cos(r*Math.PI/2));f.sy=1+r*.15*i;f.alpha=t;break;
   case "Blur":f.blur=Math.max(0,r*12*i);f.alpha=t;break;
   case "Stretch":f.sx=1+r*.9*i;f.sy=1-r*.6*i;f.alpha=t;break;
   case "Swing":f.rotate=Math.sin(phase)*10*i*(loop?1:r);break;
   case "Tracking":f.tracking=r*10*i;f.alpha=t;break;
   case "Orbit":f.dx=Math.sin(phase)*10*i*(loop?1:r);f.dy=Math.cos(phase)*10*i*(loop?1:r);break;
   case "Roll":f.rotate=sign*r*180*i;f.dx=sign*r*60*i;f.alpha=t;break;
   case "Squeeze":f.sx=1-r*.65*i;f.sy=1+r*.4*i;f.alpha=t;break;
   default:throw new IllegalArgumentException("Animação não suportada: "+a.optString("type"));
  }
  f.alpha=clamp(f.alpha);f.sx=Math.max(.02,f.sx);f.sy=Math.max(.02,f.sy);return f;
 }
 public static List<JSONObject> tracks(JSONObject style,int duration){
  List<JSONObject> result=new ArrayList<>();JSONObject tracks=style.optJSONObject("animationTracks");
  if(tracks!=null){Iterator<String> keys=tracks.keys();while(keys.hasNext()){JSONObject a=tracks.optJSONObject(keys.next());if(a!=null)result.add(a);}return result;}
  String type="",mode="in",direction="";
  switch(style.optString("defaultMotion","")){
   case "Saltar":case "Bounce":type="Bounce";break;case "Pular":type="Pop";break;
   case "Cair":type="Slide";direction="up";break;case "Deslizar":type="Slide";direction="right";break;
   case "Aproximar":type="Zoom";break;case "Pulsar":type="Pulse";mode="loop";break;
   case "Girar":type="Rotate";break;case "Tremer":type="Shake";break;case "Revelar":type="Reveal";break;
   case "Elasticidade":type="Elastic";break;case "Flutuar":type="Float";mode="loop";break;
   case "Piscar":type="Flicker";mode="loop";break;case "Neon":type="Glow";mode="loop";break;
   case "Glitch":type="Glitch";mode="loop";break;case "Onda":type="Wave";mode="loop";break;case "Zoom viral":type="Impact";break;
  }
  if(!type.isEmpty())try{result.add(new JSONObject().put("type",type).put("mode",mode).put("direction",direction).put("duration",duration).put("intensity",.8));}catch(JSONException e){throw new IllegalStateException(e);}
  return result;
 }
 public static Frame at(List<JSONObject> tracks,String scope,double elapsed,double span,double wordStart,double charStart,double lineStart,double seed,boolean active){
  Frame f=new Frame();
  for(JSONObject a:tracks){
   String mode=a.optString("mode","in");boolean global=mode.equals("in")||mode.equals("out")||mode.equals("loop");
   if(global&&!scope.equals("block"))continue;
   if(!global&&!mode.equals(scope)&&!(mode.equals("highlight")&&scope.equals("word")&&active))continue;
   double duration=Math.max(.001,Math.min(Math.max(1,a.optDouble("duration",300))/1000,mode.equals("out")?span/2:span));
   double origin=mode.equals("word")||mode.equals("highlight")?wordStart:mode.equals("char")?charStart:mode.equals("line")?lineStart:0;
   double p=mode.equals("out")?(span-elapsed)/duration:mode.equals("loop")?elapsed/duration:(elapsed-origin)/duration;
   if(mode.equals("highlight")&&p<0)continue;
   Frame part=sample(a,p,seed,mode.equals("loop"));if(p<0&&!global)part.alpha=0;
   f.dx+=part.dx;f.dy+=part.dy;f.sx*=part.sx;f.sy*=part.sy;f.rotate+=part.rotate;f.alpha*=part.alpha;
   f.reveal=Math.min(f.reveal,part.reveal);f.blur=Math.max(f.blur,part.blur);f.tracking+=part.tracking;f.glow*=part.glow;
  }
  return f;
 }
}
