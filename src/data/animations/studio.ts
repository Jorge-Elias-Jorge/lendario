import type {SubtitleAnimation,AnimationMode} from './types';
type Recipe=[string,string,string,SubtitleAnimation['direction']?];
const recipes:Record<string,{mode:AnimationMode;duration:number;items:Recipe[]}>={
 'Entrada avançada':{mode:'in',duration:380,items:[
  ['corte','Corte imediato','None'],['subir','Subida limpa','Slide','down'],['descer','Queda limpa','Slide','up'],
  ['esquerda','Deslize lateral esquerdo','Slide','left'],['direita','Deslize lateral direito','Slide','right'],
  ['flip','Virar cartão','Flip'],['desfocar','Foco gradual','Blur'],['espacar','Letras a aproximar','Tracking'],
  ['esticar','Esticar horizontal','Stretch'],['comprimir','Apertar e abrir','Squeeze'],['rolar','Rolar para dentro','Roll','left'],
  ['orbita','Órbita de entrada','Orbit'],['balanco','Balanço de entrada','Swing'],['maquina','Máquina de escrever','Typewriter']
 ]},
 'Saída avançada':{mode:'out',duration:300,items:[
  ['desfocar','Dissolver em desfoque','Blur'],['flip','Virar e sair','Flip'],['rolar','Rolar para fora','Roll','right'],
  ['subir','Sair pelo topo','Slide','up'],['descer','Sair pela base','Slide','down'],
  ['esquerda','Sair à esquerda','Slide','left'],['direita','Sair à direita','Slide','right'],
  ['estreitar','Estreitar e desaparecer','Squeeze'],['espacar','Dispersar letras','Tracking'],['encolher','Encolher ao sair','Zoom'],
  ['cortina','Fechar cortina','Mask'],['elastica','Saída elástica','Elastic']
 ]},
 'Movimento contínuo':{mode:'loop',duration:1200,items:[
  ['onda','Onda contínua','Wave'],['respirar','Respiração suave','Pulse'],['neon','Neon oscilante','Glow'],
  ['suspenso','Suspenso no ar','Float'],['orbita','Órbita suave','Orbit'],['balanco','Pêndulo','Swing'],
  ['interferencia','Interferência digital','Glitch'],['vibrar','Vibração contínua','Shake'],['lampada','Lâmpada intermitente','Flicker']
 ]},
 'Palavra avançada':{mode:'word',duration:240,items:[
  ['subir','Cada palavra sobe','Slide','down'],['flip','Cada palavra vira','Flip'],['foco','Foco por palavra','Blur'],
  ['revelar','Revelar cada palavra','Reveal'],['esticar','Palavra esticada','Stretch'],['rolar','Palavra rolante','Roll'],
  ['comprimir','Palavra comprimida','Squeeze'],['esquerda','Palavra desliza à esquerda','Slide','left'],['fade','Fade por palavra','Fade']
 ]},
 'Letras':{mode:'char',duration:180,items:[
  ['digitar','Digitação letra a letra','Typewriter'],['pop','Pop por letra','Pop'],['salto','Salto por letra','Bounce'],
  ['virar','Letras que viram','Flip'],['onda','Onda de letras','Wave'],['foco','Foco por letra','Blur'],
  ['cair','Chuva de letras','Slide','up'],['girar','Rotação de letras','Rotate'],['elastica','Letras elásticas','Elastic']
 ]},
 'Linhas':{mode:'line',duration:350,items:[
  ['subir','Subida por linha','Slide','down'],['revelar','Revelação por linha','Reveal'],['fade','Fade por linha','Fade'],
  ['zoom','Zoom por linha','Zoom'],['foco','Foco por linha','Blur'],['saltar','Bounce por linha','Bounce'],['flip','Virar cada linha','Flip']
 ]},
 'Ênfase avançada':{mode:'highlight',duration:220,items:[
  ['pulse','Pulso na palavra ativa','Pulse'],['glow','Luz na palavra ativa','Glow'],['shake','Ênfase vibrante','Shake'],
  ['flip','Virar palavra ativa','Flip'],['impact','Impacto na palavra ativa','Impact'],['stretch','Alargar palavra ativa','Stretch']
 ]}
};
export const STUDIO_ANIMATION_GROUPS:Record<string,SubtitleAnimation[]>=Object.fromEntries(
 Object.entries(recipes).map(([category,group])=>[category,group.items.map(([key,name,type,direction])=>({
  id:`studio-${group.mode}-${key}`,name,type,direction,mode:group.mode,duration:group.duration,intensity:.7,easing:'easeOut' as const
 }))])
);
