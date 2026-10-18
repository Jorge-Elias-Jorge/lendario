import {describe,it,expect} from 'vitest';
import {timelineDuration,seekTime,compactTime,fixCueOverlaps} from './editorTimeline';
import type {Cue} from './srt';
describe('professional timeline safeguards',()=>{
 it('fits short clips instead of forcing ten blank seconds',()=>expect(timelineDuration([],2)).toBe(2));
 it('shows subtitles beyond the video for timing review',()=>expect(timelineDuration([{id:'a',text:'Fora',start:20,end:25}],2)).toBe(25));
 it('uses a safe empty timeline before metadata',()=>expect(timelineDuration([],NaN)).toBe(10));
 it.each([-10,NaN,Infinity])('does not seek into invalid/negative time %s',value=>expect(seekTime(value,10)).toBe(0));
 it('clamps to video length',()=>expect(seekTime(12,2)).toBe(2));
 it('keeps zero duration safe',()=>expect(seekTime(5,0)).toBe(0));
 it('formats transport labels',()=>{expect(compactTime(125.5)).toBe('02:05');expect(compactTime(-2)).toBe('00:00');});
 it('does not invalidate unchanged acoustic word times',()=>{
  const cue:Cue={id:'a',text:'Fala',start:0,end:1,words:[{text:'Fala',start:0,end:1,confidence:1}]};
  expect(fixCueOverlaps([cue])[0]).toBe(cue);
 });
 it('invalidates changed word times and keeps a reversible original',()=>{
  const first:Cue={id:'a',text:'Uma',start:0,end:2},overlap:Cue={id:'b',text:'Duas',start:1,end:3,words:[{text:'Duas',start:1,end:3,confidence:1}],alignment:{engine:'test',score:1}};
  const result=fixCueOverlaps([overlap,first]);
  expect(result.map(c=>c.start)).toEqual([0,2]);expect(result[1].words).toBeUndefined();expect(result[1].alignment).toBeUndefined();
  expect(result[1].originalTiming?.start).toBe(1);expect(overlap.start).toBe(1);
 });
});
