import {build} from 'esbuild';
import {writeFile,mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
async function bundle(path){
 const result=await build({absWorkingDir:root,entryPoints:[path],bundle:true,format:'esm',platform:'node',write:false});
 return import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
}
const registry=await bundle('src/data/registry.ts'),motion=await bundle('src/core/motion.ts');
const vectors=[];
for(const type of motion.MOTION_TYPES)for(const easing of ['linear','easeOut','easeInOut','back'])for(const loop of [false,true])for(const progress of [0,.17,.5,.9,1,1.37]){
 const animation={id:'fixture',name:type,type,mode:loop?'loop':'in',duration:400,intensity:.8,easing,direction:'up'};
 vectors.push({animation,progress,seed:2.3,loop,expected:motion.sampleMotion(animation,progress,2.3,loop)});
}
const target=root+'native/androidTest/assets/';
await mkdir(target,{recursive:true});
await writeFile(target+'motion-fixtures.json',JSON.stringify(vectors));
await writeFile(target+'caption-catalog.json',JSON.stringify({styles:registry.ALL_STYLES,animations:registry.ALL_ANIMATIONS}));
console.log(`${registry.ALL_STYLES.length} estilos / ${registry.ALL_ANIMATIONS.length} animações / ${vectors.length} vetores de paridade`);
