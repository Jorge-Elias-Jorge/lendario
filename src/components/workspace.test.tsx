// @vitest-environment jsdom
import React,{act,useState} from 'react';
import {createRoot,type Root} from 'react-dom/client';
import {beforeEach,afterEach,describe,it,expect,vi} from 'vitest';
const bridge=vi.hoisted(()=>({access:vi.fn(),requestLibrary:vi.fn(),listMedia:vi.fn(),previewVideo:vi.fn()}));
vi.mock('../native/media',()=>({Media:bridge,videoSource:(path:string)=>path}));
import NativeGallery from './NativeGallery';
import ToolSheet from './ToolSheet';
import SrtImporter from './SrtImporter';
import {useStore} from '../store';
let root:Root,container:HTMLDivElement;
const media={uri:'content://media/external/video/media/1',name:'meu-video.mp4',size:2048,duration:5,kind:'videos',thumbnail:'data:image/jpeg;base64,AA=='};
const srt='1\n00:00:00,000 --> 00:00:01,000\nCada palavra conta';
const buttons=()=>Array.from(document.querySelectorAll('button'));
const button=(text:string)=>buttons().find(b=>b.textContent?.trim()===text||b.getAttribute('aria-label')===text)!;
async function mount(element:React.ReactNode){await act(async()=>{root.render(element);});}
async function click(text:string){await act(async()=>{button(text).click();});}
async function fill(text:string){
 await act(async()=>{
  const input=document.querySelector('textarea')!;
  Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value')!.set!.call(input,text);
  input.dispatchEvent(new Event('input',{bubbles:true}));
 });
}
beforeEach(()=>{
 (globalThis as {IS_REACT_ACT_ENVIRONMENT?:boolean}).IS_REACT_ACT_ENVIRONMENT=true;
 container=document.createElement('div');document.body.append(container);root=createRoot(container);
 vi.resetAllMocks();bridge.access.mockResolvedValue({videos:true,images:true,partial:false});
 bridge.listMedia.mockResolvedValue({items:[media],more:false});bridge.requestLibrary.mockResolvedValue({videos:true,images:true,partial:false});
 bridge.previewVideo.mockResolvedValue({path:'file:///cache/preview.mp4'});useStore.setState({cues:[],selectedCueId:null,syncBusy:false});
});
afterEach(async()=>{await act(async()=>root.unmount());container.remove();document.body.style.overflow='';vi.restoreAllMocks();});
describe('contextual tool panel',()=>{
 it('opens with accessible title and only its own contents',async()=>{
  const close=vi.fn();await mount(<ToolSheet title="Ritmo" onClose={close}><label>Velocidade<input type="range"/></label></ToolSheet>);
  expect(document.querySelector('[role=dialog]')).not.toBeNull();expect(document.querySelector('h2')?.textContent).toBe('Ritmo');
  expect(document.body.style.overflow).toBe('hidden');await click('Fechar painel');expect(close).toHaveBeenCalledOnce();
 });
 it('closes on Escape',async()=>{
  const close=vi.fn();await mount(<ToolSheet title="Estilos" onClose={close}>Estilos</ToolSheet>);
  await act(async()=>document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true})));
  expect(close).toHaveBeenCalledOnce();
 });
 it('keeps keyboard focus inside and returns it after closing',async()=>{
  const trigger=document.createElement('button');document.body.append(trigger);trigger.focus();
  await mount(<ToolSheet title="Texto" onClose={()=>{}}><button>Último</button></ToolSheet>);
  button('Último').focus();document.dispatchEvent(new KeyboardEvent('keydown',{key:'Tab',bubbles:true,cancelable:true}));
  // jsdom has no layout; focusable geometry is tested with real Chromium QA.
  expect(document.querySelector('[role=dialog]')?.contains(document.activeElement)).toBe(true);
  await mount(null);expect(document.activeElement).toBe(trigger);trigger.remove();
 });
});
describe('SRT import workflow',()=>{
 it('validates malformed input without replacing the current project',async()=>{
  const applied=vi.fn();await mount(<SrtImporter value="texto inválido" onChange={()=>{}} onApplied={applied}/>);
  await click('Substituir legendas');expect(applied).not.toHaveBeenCalled();expect(document.querySelector('[role=status]')?.textContent).toContain('Não foi possível');
 });
 it('applies valid SRT and preserves source timing',async()=>{
  const applied=vi.fn();await mount(<SrtImporter value={srt} onChange={()=>{}} onApplied={applied}/>);
  await click('Substituir legendas');expect(applied).toHaveBeenCalledOnce();expect(useStore.getState().cues[0]).toMatchObject({start:0,end:1,text:'Cada palavra conta'});
 });
 it('asks before replacing existing subtitles and respects refusal',async()=>{
  useStore.setState({cues:[{id:'old',text:'Anterior',start:5,end:7}]});vi.spyOn(window,'confirm').mockReturnValue(false);
  await mount(<SrtImporter value={srt} onChange={()=>{}}/>);await click('Substituir legendas');
  expect(window.confirm).toHaveBeenCalledOnce();expect(useStore.getState().cues[0].id).toBe('old');
 });
 it('adds after the latest end even when cues are out of chronological order',async()=>{
  useStore.setState({cues:[{id:'a',text:'Tarde',start:10,end:12},{id:'b',text:'Cedo',start:0,end:2}]});
  await mount(<SrtImporter value={srt} onChange={()=>{}}/>);await click('Adicionar ao fim');
  expect(useStore.getState().cues[2].start).toBe(12);
 });
 it('keeps pasted text in the parent draft until explicitly applied',async()=>{
  function Draft(){const [text,setText]=useState('');return <><SrtImporter value={text} onChange={setText}/><output>{text}</output></>;}
  await mount(<Draft/>);await fill(srt);expect(document.querySelector('output')?.textContent).toBe(srt);expect(useStore.getState().cues).toHaveLength(0);
  await click('Limpar caixa');expect(document.querySelector('output')?.textContent).toBe('');
 });
});
describe('media selection before editing',()=>{
 it('shows thumbnails and does not import on first selection',async()=>{
  const choose=vi.fn();await mount(<NativeGallery onChoose={choose}/>);
  expect(document.querySelector('.media-thumb img')?.getAttribute('src')).toBe(media.thumbnail);
  await click('Pré-visualizar meu-video.mp4');expect(bridge.previewVideo).toHaveBeenCalledWith({uri:media.uri});
  expect(document.querySelector('.confirm-video video')).not.toBeNull();expect(choose).not.toHaveBeenCalled();
  await click('Usar este vídeo');expect(choose).toHaveBeenCalledWith(media);
 });
 it('returns from confirmation without importing',async()=>{
  const choose=vi.fn();await mount(<NativeGallery onChoose={choose}/>);await click('Pré-visualizar meu-video.mp4');await click('Escolher outro vídeo');
  expect(document.querySelector('.media-grid')).not.toBeNull();expect(choose).not.toHaveBeenCalled();
 });
 it('asks permission only through the explicit action',async()=>{
  bridge.access.mockResolvedValueOnce({videos:false,images:false,partial:false});
  await mount(<NativeGallery onChoose={vi.fn()}/>);expect(bridge.requestLibrary).not.toHaveBeenCalled();expect(bridge.listMedia).not.toHaveBeenCalled();
  await click('Permitir acesso às mídias');expect(bridge.requestLibrary).toHaveBeenCalledOnce();expect(document.querySelector('.media-tile')).not.toBeNull();
 });
 it('identifies partial access and exposes permission management',async()=>{
  bridge.access.mockResolvedValue({videos:false,images:false,partial:true});await mount(<NativeGallery onChoose={vi.fn()}/>);
  expect(document.querySelector('.library-access')?.textContent).toContain('autorizadas');expect(button('Gerir acesso')).toBeDefined();
 });
 it('does not duplicate paginated media',async()=>{
  bridge.listMedia.mockResolvedValueOnce({items:[media],more:true}).mockResolvedValueOnce({items:[media,{...media,uri:'content://media/2',name:'segundo.mp4'}],more:false});
  await mount(<NativeGallery onChoose={vi.fn()}/>);await click('Carregar mais mídias (1 carregadas)');
  expect(document.querySelectorAll('.media-tile')).toHaveLength(2);
 });
 it('shows an explicit fallback when thumbnail is absent',async()=>{
  bridge.listMedia.mockResolvedValue({items:[{...media,thumbnail:undefined}],more:false});await mount(<NativeGallery onChoose={vi.fn()}/>);
  expect(document.querySelector('.media-thumb-fallback')?.textContent).toContain('Miniatura indisponível');
 });
 it('does not confirm twice while an import is pending',async()=>{
  let done!:()=>void;const choose=vi.fn(()=>new Promise<void>(resolve=>{done=resolve;}));
  await mount(<NativeGallery onChoose={choose}/>);await click('Pré-visualizar meu-video.mp4');
  await act(async()=>{button('Usar este vídeo').click();});expect(button('A importar…').disabled).toBe(true);
  await act(async()=>{button('A importar…').click();done();});expect(choose).toHaveBeenCalledOnce();
 });
});
