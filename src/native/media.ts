import {Capacitor,registerPlugin} from '@capacitor/core';
import type {Cue} from '../core/srt';
import type {SubtitleStyle} from '../data/styles';
import type {SubtitleAnimation} from '../data/animations';
export interface Access {videos:boolean;images:boolean;partial:boolean}
export interface MediaItem {uri:string;name:string;size:number;duration:number;kind:'videos'|'images';thumbnail?:string}
export interface Draft {id:string;name:string;updated:number;path?:string;thumbnail?:string;missing?:boolean;cues:Cue[];style:SubtitleStyle;animation:SubtitleAnimation;presentation?:'Frase'|'Realce ativo'|'Palavra'|'Blocos';effectMs?:number}
export type DraftRow=Pick<Draft,'id'|'name'|'updated'|'thumbnail'>;
interface NativeMedia {
 access():Promise<Access>;
 requestLibrary():Promise<Access>;
 listMedia(options:{kind:string;offset:number;limit:number}):Promise<{items:MediaItem[];more:boolean}>;
 previewVideo(options:{uri:string}):Promise<{path:string}>;
 importVideo(options:{uri:string}):Promise<{path:string}>;
 saveDraft(options:{draft:Draft}):Promise<void>;
 readDraft(options:{id:string}):Promise<Draft>;
 listDrafts():Promise<{items:DraftRow[]}>;
 deleteDraft(options:{id:string}):Promise<void>;
}
export const nativeAndroid=Capacitor.getPlatform()==='android';
export const Media=registerPlugin<NativeMedia>('LegendarioMedia');
export const videoSource=(path:string)=>Capacitor.convertFileSrc(path);
export async function saveDraft(draft:Draft){if(nativeAndroid)return Media.saveDraft({draft});localStorage.setItem('legendario-draft-'+draft.id,JSON.stringify(draft));}
export async function readDraft(id:string):Promise<Draft>{if(nativeAndroid)return Media.readDraft({id});const raw=localStorage.getItem('legendario-draft-'+id);if(!raw)throw new Error('Rascunho inexistente.');return JSON.parse(raw);}
export async function listDrafts():Promise<DraftRow[]>{if(nativeAndroid)return (await Media.listDrafts()).items;const rows:DraftRow[]=[];for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k?.startsWith('legendario-draft-')){try{rows.push(JSON.parse(localStorage.getItem(k)!))}catch{}}}return rows;}
export async function deleteDraft(id:string){if(nativeAndroid)return Media.deleteDraft({id});localStorage.removeItem('legendario-draft-'+id);}
