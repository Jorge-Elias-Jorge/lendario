import {describe,it,expect} from 'vitest';
import {alignCues,applyProposals,restoreTimings,timedWords,wordState,normalizeWord,validateTranscript} from './alignment';
import {formatTime,serializeSRT,type Cue,type WordTiming} from './srt';
import {parseSrtText} from '../components/SrtImporter';
import {useStore} from '../store';
const cue=(text='Cada palavra conta',start=20,end=23,id='a'):Cue=>({id,text,start,end});
const spoken=(text='cada palavra conta',start=2):WordTiming[]=>text.split(' ').map((text,i)=>({text,start:start+i*.4,end:start+i*.4+.3,confidence:.98}));
describe('offline acoustic transcript comparison',()=>{
 it('moves an early cue later and a late cue earlier individually',()=>{
  const p=alignCues([cue('Cada palavra conta'),cue('Outra frase completa',1,3,'b')],[...spoken(),...spoken('outra frase completa',10)],30);
  expect(p.map(x=>[x.start,x.status])).toEqual([[2,'ready'],[10,'ready']]);
 });
 it('preserves text, case and punctuation with accent-insensitive matching',()=>{
  const p=alignCues([cue('Olá, ciência incrível!')],spoken('ola ciencia incrivel'),30)[0];
  expect(p.status).toBe('ready');expect(p.words?.map(w=>w.text)).toEqual(['Olá,','ciência','incrível!']);
  expect(normalizeWord('AÇÃO!')).toBe('acao');
 });
 it('does not fabricate missing boundary times',()=>{
  expect(alignCues([cue()],spoken('palavra conta'),30)[0].start).toBeUndefined();
 });
 it('marks missing inner words for review',()=>{
  const p=alignCues([cue('Cada pequena palavra conta')],spoken(),30)[0];
  expect(p.status).toBe('review');expect(p.words).toBeUndefined();
 });
 it('keeps absent or translated text unchanged',()=>{
  const c=cue('These are other words'),p=alignCues([c],spoken(),30);
  expect(p[0].status).toBe('unmatched');expect(applyProposals([c],p,new Set(['a']))).toEqual([c]);
 });
 it('does not treat silence as timestamps',()=>expect(alignCues([cue()],[],30)[0].status).toBe('unmatched'));
 it('requires review for repeated identical phrases',()=>{
  const p=alignCues([cue()],[...spoken(),...spoken('cada palavra conta',10)],30)[0];
  expect(p.status).toBe('review');expect(p.reason).toContain('repetida');
 });
 it('does not trust one-word or two-word common phrases',()=>{
  expect(alignCues([cue('Olá mundo')],spoken('ola mundo'),30)[0].status).toBe('review');
 });
 it('requires review for low ASR scores even on matching text',()=>{
  expect(alignCues([cue()],spoken().map(w=>({...w,confidence:.4})),30)[0].status).toBe('review');
 });
 it('detects dispersed matches across long silence',()=>{
  const words=spoken();words[2]={...words[2],start:15,end:15.5};
  expect(alignCues([cue()],words,30)[0].status).toBe('review');
 });
 it.each([NaN,Infinity,-1])('rejects malformed transcript times %s',value=>{
  expect(()=>validateTranscript([{...spoken()[0],start:value}],30)).toThrow();
 });
 it('rejects backwards and out-of-duration transcript words',()=>{
  expect(()=>validateTranscript([...spoken()].reverse(),30)).toThrow();
  expect(()=>validateTranscript(spoken(),1)).toThrow();
 });
 it('bounds quadratic matching resources',()=>{
  expect(()=>alignCues([cue(Array(4000).fill('palavra').join(' '))],Array.from({length:4000},(_,i)=>({text:'palavra',start:i*.1,end:i*.1+.05,confidence:1})),500)).toThrow('limite');
 });
 it('applies only selected ready cues and keeps the original',()=>{
  const a=cue(),b=cue('Outra frase completa',24,27,'b'),p=alignCues([a,b],[...spoken(),...spoken('outra frase completa',10)],30);
  const result=applyProposals([a,b],p,new Set(['a']));
  expect(result[0].start).toBe(2);expect(result[1]).toBe(b);
  expect(result[0].originalTiming?.start).toBe(20);expect(a.originalTiming).toBeUndefined();
  expect(restoreTimings(result)).toEqual([{...a,words:undefined},b]);
  expect(JSON.parse(JSON.stringify(result))[0].words).toHaveLength(3);
 });
 it('rejects stale proposals after manual text changes',()=>{
  const c=cue(),p=alignCues([c],spoken(),30);
  expect(()=>applyProposals([{...c,text:'alterado'}],p,new Set(['a']))).toThrow('mudaram');
 });
 it('refuses corrections that collide with an unchanged neighbour',()=>{
  const c=cue(),b=cue('não reconhecida',2.2,5,'b'),p=alignCues([c,b],spoken(),30);
  expect(()=>applyProposals([c,b],p,new Set(['a']))).toThrow('sobrepostas');
 });
 it('detects a long enclosing unchanged cue even across another neighbour',()=>{
  const c=cue(),outer=cue('Texto ausente longo',0,30,'outer'),inside=cue('Outro texto ausente',.1,1,'inside');
  const p=alignCues([outer,inside,c],spoken(),30);
  expect(()=>applyProposals([outer,inside,c],p,new Set(['a']))).toThrow('sobrepostas');
 });
 it('never overwrites the earliest original backup on a second analysis',()=>{
  const c=cue(),first=applyProposals([c],alignCues([c],spoken(),30),new Set(['a']));
  const second=applyProposals(first,alignCues(first,spoken('cada palavra conta',5),30),new Set(['a']));
  expect(second[0].originalTiming?.start).toBe(20);
 });
 it('manual editing invalidates word timing without deleting original backup',()=>{
  const c=cue(),result=applyProposals([c],alignCues([c],spoken(),30),new Set(['a']));
  useStore.getState().setCues(result);useStore.getState().updateCue('a',{text:'Novo texto'});
  expect(useStore.getState().cues[0].words).toBeUndefined();expect(useStore.getState().cues[0].originalTiming?.start).toBe(20);
 });
 it('restores timing but never stale words after text edits',()=>{
  const c={...cue(),originalTiming:{start:1,end:4,text:'outro texto',words:spoken('outro texto')}};
  expect(restoreTimings([c])[0].words).toBeUndefined();
 });
 it('preserves SRT overlap and file sequence for comparison',()=>{
  const p=parseSrtText('1\n00:00:05,000 --> 00:00:08,000\nPrimeira\n\n2\n00:00:02,000 --> 00:00:06,000\nSegunda');
  expect(p.map(c=>c.start)).toEqual([5,2]);
 });
 it('serializes corrected or original timestamps without millisecond overflow',()=>{
  expect(formatTime(59.9999)).toBe('00:01:00,000');
  const result=applyProposals([cue()],alignCues([cue()],spoken(),30),new Set(['a']));
  expect(serializeSRT(result)).toContain('00:00:02,000');
  expect(serializeSRT(result,true)).toContain('00:00:20,000');
 });
});
describe('word timestamps in preview/export',()=>{
 const c={...cue('Cada palavra conta',0,10),words:[{text:'Cada',start:0,end:1,confidence:1},{text:'palavra',start:1,end:2,confidence:1},{text:'conta',start:7,end:10,confidence:1}]};
 it('follows actual word boundaries, not equal thirds',()=>{
  expect(wordState(c,1.5).index).toBe(1);expect(wordState(c,6).index).toBe(1);expect(wordState(c,8).index).toBe(2);
  expect(wordState(c,8).progress).toBeCloseTo(1/3);
 });
 it('fallback is explicit for malformed or stale arrays',()=>{
  expect(timedWords({...c,text:'Outro texto'})).toBeUndefined();
  expect(wordState({...c,words:undefined},1.5).index).toBe(0);
  expect(timedWords({...c,words:c.words.map(w=>({...w,end:NaN}))})).toBeUndefined();
 });
});
