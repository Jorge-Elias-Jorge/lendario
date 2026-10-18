import {beforeEach,describe,expect,it} from 'vitest';
import {STYLES} from '../data/styles';
import {ANIMATIONS,type SubtitleAnimation} from '../data/animations';
import {MOTION_TYPES,sampleMotion,motionAt,tracksFor} from './motion';
import {useStore} from '../store';
import {CAPTION_FONTS} from '../data/fonts';
import {readFileSync} from 'node:fs';
const timing={elapsed:.5,remaining:2.5,span:3,wordStart:1,wordDuration:.5,charStart:1.2,lineStart:1.5,seed:0,active:false};
beforeEach(()=>useStore.setState({style:STYLES[0],presentation:STYLES[0].presentation??'Frase',effectMs:300}));
describe('catálogo e renderização',()=>{
 it('mantém identificadores únicos e fontes locais disponíveis',()=>{
  expect(STYLES.length).toBeGreaterThan(100);expect(ANIMATIONS.length).toBeGreaterThan(90);
  expect(new Set(STYLES.map(s=>s.id)).size).toBe(STYLES.length);
  expect(new Set(ANIMATIONS.map(a=>a.id)).size).toBe(ANIMATIONS.length);
  for(const f of CAPTION_FONTS){expect(readFileSync('public/fonts/'+f.file).length).toBeGreaterThan(30000);expect(readFileSync('public/fonts/'+f.file.replace('.ttf','-OFL.txt'),'utf8')).toContain('SIL OPEN FONT LICENSE');}
 });
 it.each(ANIMATIONS)('$name tem implementação finita, determinística e sem escalas negativas',a=>{
  expect(MOTION_TYPES).toContain(a.type);
  for(const p of [-1,0,.25,.5,1,4.7]){
   const f=sampleMotion(a,p,3,a.mode==='loop');
   expect(Object.values(f).every(Number.isFinite)).toBe(true);
   expect(f.alpha).toBeGreaterThanOrEqual(0);expect(f.alpha).toBeLessThanOrEqual(1);
   expect(f.sx).toBeGreaterThan(0);expect(f.sy).toBeGreaterThan(0);
   expect(sampleMotion(a,p,3,a.mode==='loop')).toEqual(f);
  }
 });
 it('não congela os ciclos depois do primeiro período',()=>{
  const a=ANIMATIONS.find(a=>a.type==='Float'&&a.mode==='loop')!;
  expect(sampleMotion(a,1.1,0,true).dy).not.toBeCloseTo(sampleMotion(a,1.3,0,true).dy);
 });
 it('saída é identidade no meio e desaparece no fim',()=>{
  const a:SubtitleAnimation={id:'out',name:'out',type:'Fade',mode:'out',duration:300,intensity:1};
  expect(motionAt([a],'block',timing).alpha).toBe(1);
  expect(motionAt([a],'block',{...timing,remaining:.01}).alpha).toBeLessThan(.11);
 });
 it('guarda sete camadas sem converter tudo num movimento legado',()=>{
  const s=useStore.getState();s.setStyle({...STYLES[0],animationTracks:{},defaultMotion:'Sem animação'});
  for(const mode of ['in','out','loop','word','char','line','highlight'] as const){
   const a=ANIMATIONS.find(a=>a.mode===mode)!;useStore.getState().setAnimation(a);
  }
  expect(tracksFor(useStore.getState().style)).toHaveLength(7);
  useStore.getState().patchAnimation('out',{duration:880});
  expect(useStore.getState().style.animationTracks?.out?.duration).toBe(880);
  useStore.getState().patchAnimation('char',null);
  expect(tracksFor(useStore.getState().style)).toHaveLength(6);
 });
 it('letra e palavra não aparecem antes do respetivo tempo estimado',()=>{
  for(const mode of ['word','char','line'] as const){
   const a=ANIMATIONS.find(a=>a.mode===mode)!;
   expect(motionAt([a],mode,timing).alpha).toBe(0);
  }
 });
 it('não perde o modo de apresentação ao personalizar um estilo',()=>{
  useStore.getState().setPresentation('Blocos');
  useStore.getState().setStyle({...useStore.getState().style,posX:38,blockSize:5});
  expect(useStore.getState().presentation).toBe('Blocos');expect(useStore.getState().style.posX).toBe(38);
 });
 it('recupera movimentos antigos e respeita limpeza explícita',()=>{
  expect(tracksFor({...STYLES[0],defaultMotion:'Pular',animationTracks:undefined})[0].type).toBe('Pop');
  expect(tracksFor({...STYLES[0],defaultMotion:'Pular',animationTracks:{}})).toHaveLength(0);
 });
});
