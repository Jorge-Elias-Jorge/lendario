import {registerPlugin,type PluginListenerHandle} from '@capacitor/core';
import {nativeAndroid} from './media';
import type {WordTiming} from '../core/srt';
interface SpeechBridge{
 analyze(options:{source:string;requestId:string}):Promise<{words:WordTiming[];duration:number;engine:string;language:string}>;
 cancel():Promise<void>;
 saveSrt(options:{text:string;original:boolean}):Promise<{uri:string}>;
 addListener(name:'speechProgress',callback:(event:{fraction:number;stage:string;requestId:string})=>void):Promise<PluginListenerHandle>;
}
export const Speech=registerPlugin<SpeechBridge>('LegendarioSpeech');
export async function saveSrtFile(text:string,original=false){
 if(nativeAndroid){await Speech.saveSrt({text,original});return;}
 const url=URL.createObjectURL(new Blob([text],{type:'application/x-subrip;charset=utf-8'}));
 const a=document.createElement('a');a.href=url;a.download=original?'LEGENDARIO-original.srt':'LEGENDARIO-sincronizado.srt';a.click();
 setTimeout(()=>URL.revokeObjectURL(url),30000);
}
