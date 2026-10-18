// @vitest-environment jsdom
import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import type {Cue} from '../core/srt';
import type {SubtitleStyle} from '../data/styles';

const bridge=vi.hoisted(()=>({
 render:vi.fn(),cancel:vi.fn(),addListener:vi.fn(),remove:vi.fn(),save:vi.fn(),discard:vi.fn()
}));
vi.mock('@capacitor/core',()=>({
 Capacitor:{getPlatform:()=> 'android'},
 registerPlugin:(name:string)=>name==='LegendarioRender'?bridge: {save:bridge.save,discard:bridge.discard}
}));
import {exportVideo} from './exporter';
const source='file:///data/user/0/com.legendario.editor/files/imports/video.mp4';
const cues:Cue[]=[{id:'test',start:0,end:2,text:'Teste offline'}];
const style:SubtitleStyle={id:'test',name:'Teste',category:'Teste',color:'#FFFFFF',highlightColor:'#FFFF00',fontSize:44,posY:78};
const rendered={path:'file:///cache/exports/LEGENDARIO-test.mp4',mime:'video/mp4',bytes:12345};
async function click(label:string){
 await vi.waitFor(()=>expect([...document.querySelectorAll('button')].some(b=>b.textContent===label)).toBe(true));
 const button=[...document.querySelectorAll('button')].find(b=>b.textContent===label)!;
 button.click();
}
beforeEach(()=>{
 vi.resetAllMocks();
 bridge.addListener.mockResolvedValue({remove:bridge.remove});
 bridge.remove.mockResolvedValue(undefined);
 bridge.render.mockResolvedValue(rendered);
 bridge.save.mockResolvedValue({uri:'content://media/video/1',bytes:12345,location:'Movies/Legendario'});
 bridge.discard.mockResolvedValue(undefined);
 bridge.cancel.mockResolvedValue(undefined);
});
afterEach(()=>{document.body.innerHTML='';});
describe('exportação Android offline',()=>{
 it('envia objetos, caminho e qualidade; não lê vídeos para JavaScript',async()=>{
  const fetch=vi.spyOn(globalThis,'fetch');
  const reader=vi.spyOn(FileReader.prototype,'readAsDataURL');
  const result=exportVideo(source,cues,style,undefined,{quality:'ultra',presentation:'Realce ativo',effectMs:450});
  await click('Concluir');
  await expect(result).resolves.toMatchObject({kind:'native',bytes:12345});
  expect(bridge.render).toHaveBeenCalledWith({source,cues,style,quality:'ultra',presentation:'Realce ativo',effectMs:450});
  expect(bridge.save).toHaveBeenCalledWith({path:rendered.path});
  expect(bridge.discard).toHaveBeenCalledWith({path:rendered.path});
  expect(bridge.remove).toHaveBeenCalledOnce();
  expect(fetch).not.toHaveBeenCalled();expect(reader).not.toHaveBeenCalled();
  fetch.mockRestore();reader.mockRestore();
 });
 it('repete apenas a gravação depois de falha, sem renderizar novamente',async()=>{
  bridge.save.mockRejectedValueOnce(new Error('Espaço insuficiente'));
  const result=exportVideo(source,cues,style);
  await click('Tentar guardar novamente');await click('Concluir');await result;
  expect(bridge.save).toHaveBeenCalledTimes(2);expect(bridge.render).toHaveBeenCalledOnce();
 });
 it('não anuncia sucesso quando a cópia fica incompleta',async()=>{
  bridge.save.mockResolvedValueOnce({uri:'content://test',bytes:2,location:'Movies'});
  const result=exportVideo(source,cues,style);
  const assertion=expect(result).rejects.toThrow('descartada');
  await click('Descartar vídeo gerado');await click('Concluir');await assertion;
  expect(bridge.discard).toHaveBeenCalledOnce();
 });
 it('liberta listener e bloqueio após erro do motor',async()=>{
  bridge.render.mockRejectedValueOnce(new Error('Codec indisponível'));
  const result=exportVideo(source,cues,style);
  const assertion=expect(result).rejects.toThrow('Codec indisponível');
  await click('Concluir');await assertion;
  expect(bridge.remove).toHaveBeenCalledOnce();expect(bridge.save).not.toHaveBeenCalled();
  const retry=exportVideo(source,cues,style);await click('Concluir');await retry;
 });
 it('rejeita origem remota sem invocar o motor',async()=>{
  const result=exportVideo('https://example.com/movie.mp4',cues,style);
  const assertion=expect(result).rejects.toThrow('biblioteca local');
  await click('Concluir');await assertion;expect(bridge.render).not.toHaveBeenCalled();
 });
 it('cancela o trabalho nativo e não tenta guardar',async()=>{
  bridge.render.mockImplementation(()=>new Promise((_resolve,reject)=>{
   bridge.cancel.mockImplementation(async()=>{reject(new Error('Exportação cancelada.'));});
  }));
  const result=exportVideo(source,cues,style);
  const assertion=expect(result).rejects.toThrow('cancelada');
  await vi.waitFor(()=>expect(bridge.render).toHaveBeenCalledOnce());
  await click('Cancelar exportação');await click('Concluir');await assertion;
  expect(bridge.cancel).toHaveBeenCalledOnce();expect(bridge.save).not.toHaveBeenCalled();
 });
 it('impede duas exportações simultâneas',async()=>{
  const result=exportVideo(source,cues,style);
  await expect(exportVideo(source,cues,style)).rejects.toThrow('andamento');
  await click('Concluir');await result;
 });
});
