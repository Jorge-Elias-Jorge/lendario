export const CAPTION_FONTS=[
 {family:'Manrope',file:'Manrope.ttf',variable:true},
 {family:'Anton',file:'Anton.ttf',variable:false},
 {family:'Bebas Neue',file:'BebasNeue.ttf',variable:false},
 {family:'Barlow Condensed',file:'BarlowCondensed.ttf',variable:false},
 {family:'Libre Baskerville',file:'LibreBaskerville.ttf',variable:true},
 {family:'Space Mono',file:'SpaceMono.ttf',variable:false}
];
let ready:Promise<void>|undefined;
export function loadCaptionFonts(){
 if(typeof document==='undefined'||!document.fonts)return Promise.resolve();
 return ready??=Promise.all(CAPTION_FONTS.map(f=>document.fonts.load(`800 32px "${f.family}"`))).then(()=>undefined);
}
