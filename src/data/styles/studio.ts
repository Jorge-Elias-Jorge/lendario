import type {SubtitleStyle} from '../styles';
type Look=Partial<SubtitleStyle>&{id:string;name:string};
const font={fontFamily:'Manrope',fontWeight:800,fontSize:46,posY:76,color:'#FFFFFF',highlightColor:'#FFE600',outlineColor:'#101114',outlineWidth:2,maxLines:2,align:'center' as const};
function group(category:string,defaults:Partial<SubtitleStyle>,looks:Look[]):SubtitleStyle[]{
 return looks.map(v=>({...font,...defaults,...v,id:'studio-'+v.id,category,tags:[category,'offline','original']} as SubtitleStyle));
}
export const STUDIO_STYLE_GROUPS:Record<string,SubtitleStyle[]>={
 'Shorts e Reels':group('Shorts e Reels',{fontFamily:'Anton',uppercase:true,presentation:'Realce ativo',defaultMotion:'Pular'},[
  {id:'shorts-impacto',name:'Gancho de impacto',fontSize:58,outlineWidth:4,highlightMode:'scale'},
  {id:'shorts-verde',name:'Palavra verde',highlightColor:'#A4FF43',highlightMode:'color',fontFamily:'Barlow Condensed',fontSize:62},
  {id:'shorts-dupla',name:'Duas palavras fortes',presentation:'Blocos',blockSize:2,color:'#FFE557',fontSize:66,defaultMotion:'Zoom viral'},
  {id:'shorts-unica',name:'Uma palavra gigante',presentation:'Palavra',fontSize:78,color:'#FFFFFF',highlightColor:'#FFFFFF',defaultMotion:'Bounce'},
  {id:'shorts-branco',name:'Branco alto contraste',fontFamily:'Bebas Neue',fontSize:64,outlineWidth:5,shadow:true},
  {id:'shorts-coral',name:'Coral com borda dupla',color:'#FF806C',outlineWidth:4,extrusionDepth:3,extrusionColor:'#461F39'},
  {id:'shorts-faixa',name:'Faixa amarela',color:'#101114',outlineWidth:0,backgroundColor:'#FFE557',backgroundOpacity:1,padding:12,backgroundRadius:2,presentation:'Blocos',blockSize:3},
  {id:'shorts-corte',name:'Corte seco editorial',fontFamily:'Manrope',fontSize:48,highlightColor:'#FF7957',defaultMotion:'Sem animação',futureOpacity:.45}
 ]),
 'Marcadores e destaque':group('Marcadores e destaque',{presentation:'Realce ativo',defaultMotion:'Sem animação',fontSize:48},[
  {id:'marca-amarela',name:'Marca-texto amarelo',highlightMode:'box',highlightBackground:'#FFE65C',highlightColor:'#101114',outlineWidth:0},
  {id:'marca-pilula',name:'Pílula roxa ativa',highlightMode:'pill',highlightBackground:'#7753EC',highlightColor:'#FFFFFF',backgroundRadius:18},
  {id:'marca-sublinhada',name:'Sublinhado elétrico',highlightMode:'underline',highlightColor:'#80F5D0',fontFamily:'Barlow Condensed',fontSize:60},
  {id:'marca-contorno',name:'Contorno na palavra',highlightMode:'outline',highlightColor:'#FFAE5B',outlineWidth:2,fontFamily:'Anton'},
  {id:'marca-zoom',name:'Palavra em primeiro plano',highlightMode:'scale',highlightColor:'#FFFFFF',futureOpacity:.35,fontSize:52},
  {id:'marca-azul',name:'Etiqueta azul',highlightMode:'box',highlightBackground:'#B9E9FF',highlightColor:'#10253A',outlineWidth:0,fontWeight:700},
  {id:'marca-rosa',name:'Pílula rosa editorial',highlightMode:'pill',highlightBackground:'#FFACC8',highlightColor:'#321C29',outlineWidth:0,fontFamily:'Libre Baskerville'},
  {id:'marca-nota',name:'Anotação em verde',highlightMode:'underline',highlightColor:'#B6E45B',color:'#F0EDDE',fontFamily:'Space Mono',fontSize:38}
 ]),
 'Caixas e cartões':group('Caixas e cartões',{backgroundColor:'#13171F',backgroundOpacity:.9,backgroundRadius:12,padding:14,outlineWidth:0,defaultMotion:'Aproximar'},[
  {id:'caixa-classica',name:'Caixa preta clássica',backgroundRadius:0,fontSize:42},
  {id:'caixa-arredondada',name:'Cartão branco arredondado',backgroundColor:'#FFFFFF',color:'#15191E',backgroundOpacity:1,backgroundRadius:20,fontWeight:800},
  {id:'caixa-linhas',name:'Caixa por linha',backgroundMode:'line',backgroundRadius:5,color:'#FFF0C2',fontFamily:'Barlow Condensed',fontSize:54},
  {id:'caixa-legenda',name:'Legenda acessível',fontSize:38,backgroundOpacity:.95,maxLines:3,fontWeight:600,defaultMotion:'Sem animação'},
  {id:'caixa-comentario',name:'Comentário social',backgroundColor:'#F7F4EF',color:'#20232B',backgroundRadius:18,accentBar:'#FF6148',fontSize:40,posY:68},
  {id:'caixa-azul',name:'Cartão informativo azul',backgroundColor:'#153D6F',backgroundRadius:4,accentBar:'#8CDAFF',fontSize:44},
  {id:'caixa-papel',name:'Papel e tinta',backgroundColor:'#F6E7C7',color:'#2D2924',fontFamily:'Libre Baskerville',fontSize:38,backgroundRadius:2,padding:20},
  {id:'caixa-preta-pilula',name:'Pílula de conversa',backgroundRadius:32,padding:18,presentation:'Blocos',blockSize:4,fontSize:42}
 ]),
 'Podcasts e entrevistas':group('Podcasts e entrevistas',{fontFamily:'Manrope',fontSize:44,shadow:true,outlineWidth:1,presentation:'Realce ativo'},[
  {id:'podcast-limpo',name:'Podcast limpo',highlightColor:'#E9C56B',defaultMotion:'Sem animação'},
  {id:'podcast-corte',name:'Corte com palavra pop',highlightMode:'scale',highlightColor:'#A8EB64',fontWeight:800,defaultMotion:'Pular'},
  {id:'podcast-cinza',name:'Conversa com foco',futureOpacity:.3,highlightColor:'#FFFFFF',color:'#D3D8E1',fontSize:42},
  {id:'podcast-contraste',name:'Entrevista em alto contraste',outlineWidth:4,fontFamily:'Barlow Condensed',fontSize:56,highlightColor:'#FFE869'},
  {id:'podcast-faixa',name:'Faixa de entrevista',backgroundColor:'#142030',backgroundOpacity:.92,accentBar:'#DBB778',padding:14,posY:82,align:'left',posX:12},
  {id:'podcast-central',name:'Citação central',fontFamily:'Libre Baskerville',fontSize:40,posY:50,presentation:'Frase',italic:true,defaultMotion:'Revelar'},
  {id:'podcast-minimo',name:'Corte minimalista',fontWeight:600,outlineWidth:0,fontSize:38,color:'#F8F6EF',highlightMode:'underline',highlightColor:'#D5C3F9'},
  {id:'podcast-mono',name:'Transcrição técnica',fontFamily:'Space Mono',fontSize:36,backgroundColor:'#111827',backgroundOpacity:.85,padding:12,highlightColor:'#70ECD6'}
 ]),
 'Cinema e documentário':group('Cinema e documentário',{fontFamily:'Libre Baskerville',fontSize:36,posY:84,shadow:true,outlineWidth:1,defaultMotion:'Revelar'},[
  {id:'cinema-serifa',name:'Serifa de documentário',color:'#F6EFDA',fontWeight:400},
  {id:'cinema-letterbox',name:'Letterbox clássico',backgroundColor:'#080A0D',backgroundOpacity:.88,padding:14,backgroundRadius:0},
  {id:'cinema-dourado',name:'Título dourado',color:'#E8C77C',fontSize:48,posY:50,uppercase:true,letterSpacing:2,presentation:'Blocos',blockSize:3},
  {id:'cinema-sussurro',name:'Sussurro em itálico',italic:true,fontSize:34,fontWeight:400,color:'#E8EBF0'},
  {id:'cinema-condensado',name:'Trailer condensado',fontFamily:'Bebas Neue',fontSize:66,letterSpacing:3,posY:50,defaultMotion:'Aproximar'},
  {id:'cinema-vintage',name:'Memória em sépia',color:'#E8D7B4',extrusionColor:'#4B3C30',extrusionDepth:2,fontSize:38},
  {id:'cinema-negativo',name:'Legenda em negativo',fontFamily:'Manrope',fontSize:36,color:'#131820',outlineColor:'#FFFFFF',outlineWidth:3,shadow:false},
  {id:'cinema-silencioso',name:'Cartela silenciosa',backgroundColor:'#111111',backgroundOpacity:1,padding:22,posY:50,color:'#F3ECDD',maxLines:3,defaultMotion:'Sem animação'}
 ]),
 'Gaming e tecnologia':group('Gaming e tecnologia',{fontFamily:'Barlow Condensed',fontSize:56,uppercase:true,outlineWidth:3,presentation:'Realce ativo'},[
  {id:'game-neon',name:'HUD neon verde',color:'#DEFFE0',highlightColor:'#8BFF69',glow:'#70FF8B',defaultMotion:'Neon'},
  {id:'game-cyber',name:'Cyber ciano',color:'#98F8FF',highlightColor:'#FF7BD4',glow:'#1BE5FF',defaultMotion:'Glitch'},
  {id:'game-impacto',name:'Impacto de vitória',fontFamily:'Anton',color:'#FFE252',extrusionColor:'#AA3F16',extrusionDepth:5,defaultMotion:'Zoom viral',presentation:'Palavra',fontSize:72},
  {id:'game-terminal',name:'Terminal verde',fontFamily:'Space Mono',fontSize:36,color:'#7FE8A6',backgroundColor:'#061A10',backgroundOpacity:.94,padding:14,uppercase:false,defaultMotion:'Revelar'},
  {id:'game-outline',name:'Contorno holográfico',strokeOnly:true,outlineColor:'#87E9FF',highlightColor:'#FFFFFF',outlineWidth:2,glow:'#5DE4FF',defaultMotion:'Pulsar'},
  {id:'game-alerta',name:'Alerta vermelho',backgroundColor:'#B82337',backgroundOpacity:1,padding:12,backgroundRadius:2,accentBar:'#FFE36C',defaultMotion:'Tremer'},
  {id:'game-azul-3d',name:'Extrusão azul',color:'#D6F2FF',extrusionColor:'#3156BD',extrusionDepth:6,outlineColor:'#13275F',defaultMotion:'Pular'},
  {id:'game-roxo',name:'Streamer violeta',color:'#FFFFFF',highlightMode:'pill',highlightBackground:'#8549DB',highlightColor:'#FFFFFF',outlineWidth:1,defaultMotion:'Bounce'}
 ]),
 'Editorial e educação':group('Editorial e educação',{fontFamily:'Manrope',fontSize:42,outlineWidth:0,defaultMotion:'Sem animação'},[
  {id:'editorial-noticia',name:'Notícia em faixa',backgroundColor:'#123E6A',backgroundOpacity:1,accentBar:'#E74143',padding:14,align:'left',posX:12,posY:80},
  {id:'editorial-aula',name:'Aula com marcador',presentation:'Realce ativo',highlightMode:'box',highlightBackground:'#F2D762',highlightColor:'#1B2638'},
  {id:'editorial-topico',name:'Tópico documental',fontFamily:'Bebas Neue',fontSize:62,posY:32,accentBar:'#F0B768',backgroundColor:'#152637',backgroundOpacity:.9,padding:14},
  {id:'editorial-quadro',name:'Quadro de explicação',color:'#F7F1DE',backgroundColor:'#163A30',backgroundOpacity:.95,padding:18,maxLines:3,fontSize:38},
  {id:'editorial-manchete',name:'Manchete serifada',fontFamily:'Libre Baskerville',fontSize:44,fontWeight:700,backgroundColor:'#F1EFE8',color:'#16202B',backgroundOpacity:1,padding:16},
  {id:'editorial-passo',name:'Tutorial passo a passo',presentation:'Blocos',blockSize:5,highlightMode:'underline',highlightColor:'#7AE0D2',backgroundColor:'#182A34',backgroundOpacity:.95,padding:12},
  {id:'editorial-lateral',name:'Anotação lateral',align:'left',posX:10,posY:65,fontSize:38,accentBar:'#F5A26B',backgroundColor:'#19202B',backgroundOpacity:.8,padding:14},
  {id:'editorial-dado',name:'Dado em destaque',fontFamily:'Space Mono',fontSize:48,presentation:'Palavra',color:'#BCE9FA',outlineWidth:1,defaultMotion:'Aproximar'}
 ]),
 'Retro e criativas':group('Retro e criativas',{fontSize:48,outlineWidth:2,uppercase:true,defaultMotion:'Pular'},[
  {id:'retro-quadrinho',name:'Quadrinho de impacto',fontFamily:'Anton',color:'#FFE264',outlineWidth:4,extrusionDepth:4,extrusionColor:'#B8433E',presentation:'Blocos',blockSize:2},
  {id:'retro-jornal',name:'Recorte de jornal',fontFamily:'Libre Baskerville',color:'#252321',backgroundColor:'#EEE4CE',backgroundOpacity:1,padding:12,outlineWidth:0,defaultMotion:'Sem animação'},
  {id:'retro-maquina',name:'Máquina de escrever retrô',fontFamily:'Space Mono',fontSize:38,color:'#E9DEC1',backgroundColor:'#2C2924',backgroundOpacity:.9,padding:14,uppercase:false,defaultMotion:'Revelar'},
  {id:'retro-sombra',name:'Sombra vermelha deslocada',color:'#FFF2D3',extrusionDepth:5,extrusionColor:'#C5463E',fontFamily:'Bebas Neue',fontSize:64},
  {id:'retro-chiclete',name:'Chiclete rosa',color:'#FFB5D6',outlineColor:'#6C234D',outlineWidth:4,extrusionDepth:3,extrusionColor:'#9F3477',defaultMotion:'Elasticidade'},
  {id:'retro-cromo',name:'Cromo estilizado',gradient:'linear-gradient(90deg,#FFFFFF,#89A3B9,#FFFFFF)',extrusionDepth:3,extrusionColor:'#344857',fontFamily:'Anton',defaultMotion:'Girar'},
  {id:'retro-carimbo',name:'Carimbo vermelho',fontFamily:'Barlow Condensed',fontSize:62,color:'#FF6354',backgroundColor:'#281A1A',backgroundOpacity:.92,padding:12,letterSpacing:2,defaultMotion:'Zoom viral'},
  {id:'retro-contorno',name:'Letras vazadas',strokeOnly:true,outlineColor:'#F3D59B',outlineWidth:2,fontFamily:'Bebas Neue',fontSize:70,letterSpacing:3,defaultMotion:'Flutuar'}
 ]),
 'Karaoke progressivo':group('Karaoke progressivo',{presentation:'Realce ativo',highlightMode:'karaoke',futureOpacity:.55,outlineWidth:3,defaultMotion:'Sem animação',fontSize:50},[
  {id:'karaoke-classico',name:'Karaoke amarelo progressivo',highlightColor:'#FFE64F',fontFamily:'Anton'},
  {id:'karaoke-lima',name:'Karaoke lima limpo',highlightColor:'#AEF870',fontFamily:'Manrope',outlineWidth:1},
  {id:'karaoke-neon',name:'Karaoke neon violeta',highlightColor:'#E9A8FF',glow:'#C171EE',fontFamily:'Barlow Condensed',fontSize:60},
  {id:'karaoke-faixa',name:'Karaoke em faixa',backgroundColor:'#151D32',backgroundOpacity:.92,padding:14,backgroundRadius:8,highlightColor:'#80D5FF'},
  {id:'karaoke-serifa',name:'Letra de canção serifada',fontFamily:'Libre Baskerville',fontSize:40,highlightColor:'#F1CF91',color:'#F3F0E8',italic:true,outlineWidth:1},
  {id:'karaoke-pop',name:'Karaoke pop coral',highlightColor:'#FF967E',fontFamily:'Anton',defaultMotion:'Pular'},
  {id:'karaoke-mono',name:'Karaoke monoespaçado',fontFamily:'Space Mono',fontSize:36,highlightColor:'#7CEACF',backgroundColor:'#11282A',backgroundOpacity:.85,padding:12},
  {id:'karaoke-branco',name:'Karaoke branco discreto',color:'#9EA5B2',highlightColor:'#FFFFFF',fontWeight:700,outlineWidth:0,shadow:true,fontSize:42}
 ])
};
