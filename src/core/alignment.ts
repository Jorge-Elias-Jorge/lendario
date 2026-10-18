import type {Cue,WordTiming} from './srt';

export type SpokenWord=WordTiming;
export interface SyncProposal{
 id:string;original:Cue;start?:number;end?:number;words?:WordTiming[];
 score:number;coverage:number;status:'ready'|'review'|'unmatched';reason:string;
}
export const SYNC_ENGINE='vosk-pt-0.3/lcs-v1';
export const normalizeWord=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt').replace(/[^\p{L}\p{N}]/gu,'');
export const textWords=(s:string)=>s.trim().split(/\s+/).filter(Boolean);

/** Fail closed on foreign/malformed transcripts, never infer timestamps from silence. */
export function validateTranscript(words:SpokenWord[],duration:number):SpokenWord[]{
 if(!Number.isFinite(duration)||duration<=0)throw new Error('Duração do áudio inválida.');
 if(words.length>15000)throw new Error('Áudio demasiado longo para esta versão. Divida o vídeo.');
 let previous=0;
 return words.map(w=>{
  if(typeof w.text!=='string'||!normalizeWord(w.text)||!Number.isFinite(w.start)||!Number.isFinite(w.end)
   ||w.start<0||w.end<=w.start||w.start<previous-.001||w.end>duration+.1
   ||!Number.isFinite(w.confidence)||w.confidence<0||w.confidence>1)
   throw new Error('O reconhecimento devolveu tempos ou palavras inválidos. Nenhuma alteração foi aplicada.');
  previous=w.end;return {...w};
 });
}

/**
 * Monotonic text matching, not forced phoneme alignment. Old timestamps do not
 * constrain the search. Exact normalized matches only; no fabricated word times.
 * Runs in a Worker. 12M-cell ceiling bounds memory/CPU on Android 8.
 */
export function alignCues(cues:Cue[],spoken:SpokenWord[],duration:number):SyncProposal[]{
 const audio=validateTranscript(spoken,duration),heard=audio.map(w=>normalizeWord(w.text));
 const source=cues.flatMap((c,ci)=>textWords(c.text).map((text,wi)=>({ci,wi,text,key:normalizeWord(text)})));
 const m=source.length,n=audio.length;
 if(m>10000||(m+1)*(n+1)>12000000)throw new Error('Este projeto excede o limite da primeira versão. Divida o vídeo em trechos menores.');
 const trace=new Uint8Array((m+1)*(n+1));
 let previous=new Uint16Array(n+1),row=new Uint16Array(n+1);
 for(let i=1;i<=m;i++){
  for(let j=1;j<=n;j++){
   if(source[i-1].key&&source[i-1].key===heard[j-1]){
    row[j]=previous[j-1]+1;trace[i*(n+1)+j]=1;
   }else if(previous[j]>=row[j-1]){row[j]=previous[j];trace[i*(n+1)+j]=2;}
   else{row[j]=row[j-1];trace[i*(n+1)+j]=3;}
  }
  [row,previous]=[previous,row];row.fill(0);
 }
 const mapping=new Map<number,number>();let i=m,j=n;
 while(i>0&&j>0){
  const step=trace[i*(n+1)+j];
  if(step===1){mapping.set(i-1,j-1);i--;j--;}else if(step===2)i--;else j--;
 }
 let offset=0;
 const proposals=cues.map(c=>{
  const tokens=textWords(c.text),found:{wi:number;ai:number}[]=[];
  tokens.forEach((_,wi)=>{const ai=mapping.get(offset+wi);if(ai!==undefined)found.push({wi,ai});});
  offset+=tokens.length;
  const coverage=tokens.length?found.length/tokens.length:0;
  const score=found.length?coverage*found.reduce((sum,p)=>sum+audio[p.ai].confidence,0)/found.length:0;
  const base:SyncProposal={id:c.id,original:c,score,coverage,status:'unmatched',reason:'Texto não localizado de forma suficiente no áudio.'};
  if(!found.length||coverage<.6||found[0].wi!==0||found[found.length-1].wi!==tokens.length-1)return base;
  const first=audio[found[0].ai],last=audio[found[found.length-1].ai];
  base.start=first.start;base.end=last.end;base.status='review';
  base.reason='Há palavras ausentes ou reconhecimento incerto. Reveja antes de aplicar.';
  if(last.end-first.start>Math.max(15,tokens.length*.9)||found.some((p,k)=>k>0&&audio[p.ai].start-audio[found[k-1].ai].end>2.5)){
   base.reason='Pausa longa ou trecho disperso. Confirme se corresponde à mesma frase.';return base;
  }
  // Repeated exact phrases are ambiguous regardless of an ASR confidence of 1.
  const keys=tokens.map(normalizeWord);let occurrences=0;
  for(let a=0;a<=heard.length-keys.length;a++)if(keys.every((key,k)=>key&&key===heard[a+k]))occurrences++;
  if(occurrences>1){base.reason='Frase repetida no áudio. A ocorrência correta precisa de revisão.';return base;}
  if(tokens.length<3){base.reason='Legenda muito curta para confirmar sem contexto. Reveja a posição.';return base;}
  if(coverage===1&&score>=.85&&found.every(p=>audio[p.ai].confidence>=.65)
   &&found[found.length-1].ai-found[0].ai<tokens.length+2){
   base.status='ready';base.reason='Todas as palavras localizadas em ordem. Confirme ouvindo a prévia.';
   base.words=found.map(p=>({...audio[p.ai],text:tokens[p.wi]}));
  }
  return base;
 });
 // Do not offer mutually conflicting corrections.
 let previousEnd=0;
 for(const p of proposals){
  if(p.start===undefined||p.end===undefined)continue;
  if(p.start<previousEnd-.001){p.status='review';p.reason='A proposta sobrepõe outra legenda. Ajuste manualmente.';}
  previousEnd=Math.max(previousEnd,p.end);
 }
 return proposals;
}

export function applyProposals(current:Cue[],proposals:SyncProposal[],selected:Set<string>):Cue[]{
 const byId=new Map(proposals.map(p=>[p.id,p]));
 const result=current.map(c=>{
  const p=byId.get(c.id);
  if(!selected.has(c.id)||!p||p.status!=='ready'||p.start===undefined||p.end===undefined)return c;
  if(JSON.stringify(c)!==JSON.stringify(p.original))throw new Error('As legendas mudaram após a análise. Analise novamente.');
  return {...c,start:p.start,end:p.end,words:p.words,alignment:{engine:SYNC_ENGINE,score:p.score},
   originalTiming:c.originalTiming??{start:c.start,end:c.end,text:c.text,words:c.words}};
 });
 const ordered=[...result].sort((a,b)=>a.start-b.start);
 const changed=new Set(result.filter((c,i)=>c!==current[i]).map(c=>c.id));
 let maxEnd=0,maxChangedEnd=0;
 for(const c of ordered){
  if((changed.has(c.id)&&maxEnd>c.start+.001)||(!changed.has(c.id)&&maxChangedEnd>c.start+.001))
   throw new Error('A seleção criaria legendas sobrepostas. Reveja as legendas vizinhas ou aplique outro conjunto.');
  maxEnd=Math.max(maxEnd,c.end);
  if(changed.has(c.id))maxChangedEnd=Math.max(maxChangedEnd,c.end);
 }
 return result;
}

export function restoreTimings(cues:Cue[]):Cue[]{
 return cues.map(c=>{
  if(!c.originalTiming)return c;
  const {originalTiming:o,alignment:_,words:__,...rest}=c;
  return {...rest,start:o.start,end:o.end,words:o.text===c.text?o.words:undefined};
 });
}

/** A full, valid word sequence is required. Stale/partial arrays use legacy timing. */
export function timedWords(cue:Cue):WordTiming[]|undefined{
 const tokens=textWords(cue.text),words=cue.words;
 if(!words||words.length!==tokens.length)return;
 let end=cue.start;
 for(let i=0;i<words.length;i++){
  const w=words[i];
  if(normalizeWord(w.text)!==normalizeWord(tokens[i])||!Number.isFinite(w.start)||!Number.isFinite(w.end)
   ||w.start<end-.001||w.end<=w.start||w.start<cue.start-.001||w.end>cue.end+.001)return;
  end=w.end;
 }
 return words;
}
export function wordState(cue:Cue,time:number){
 const count=textWords(cue.text).length,words=timedWords(cue),span=Math.max(.001,cue.end-cue.start);
 if(!words){const index=Math.min(count-1,Math.max(0,Math.floor((time-cue.start)/span*count)));return{index,progress:Math.min(1,Math.max(0,(time-cue.start)/span*count-index)),words};}
 let index=0;
 for(let i=0;i<words.length;i++){if(time<words[i].start)break;index=i;}
 const w=words[index];
 return {index,progress:Math.min(1,Math.max(0,(time-w.start)/(w.end-w.start))),words};
}
