import type {SubtitleAnimation,AnimationMode} from './animations';
export type Presentation='Frase'|'Realce ativo'|'Palavra'|'Blocos';
export interface SubtitleStyle {
 id:string;name:string;category:string;
 color:string;highlightColor:string;
 gradient?:string;
 fontSize:number;posY:number;
 fontFamily?:string;fontWeight?:number;
 outlineColor?:string;outlineWidth?:number;
 shadow?:boolean;glow?:string;uppercase?:boolean;defaultMotion?:string;
 align?:'center'|'left'|'right'|'misto';maxLines?:number;
 posX?:number;presentation?:Presentation;blockSize?:number;
 backgroundColor?:string;backgroundOpacity?:number;backgroundRadius?:number;
 backgroundMode?:'line'|'block';padding?:number;
 highlightMode?:'color'|'karaoke'|'box'|'pill'|'underline'|'outline'|'scale';
 highlightBackground?:string;futureOpacity?:number;
 letterSpacing?:number;italic?:boolean;strokeOnly?:boolean;
 extrusionDepth?:number;extrusionColor?:string;accentBar?:string;lineHeight?:number;
 animationTracks?:Partial<Record<AnimationMode,SubtitleAnimation>>;
 tags?:string[];
}
export { STYLES, STYLE_GROUPS, STYLE_CATEGORIES } from './styles/index';
