export interface SubtitleStyle {
 id:string;name:string;category:string;
 color:string;highlightColor:string;
 gradient?:string;
 fontSize:number;posY:number;
 fontFamily?:string;fontWeight?:number;
 outlineColor?:string;outlineWidth?:number;
 shadow?:boolean;glow?:string;uppercase?:boolean;defaultMotion?:string;
 align?:'center'|'left'|'right'|'misto';maxLines?:number;
}
export { STYLES, STYLE_GROUPS, STYLE_CATEGORIES } from './styles/index';
