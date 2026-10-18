// Keep existing standalone-browser drafts; sandbox previews use explicit temporary memory.
// Android projects always use private files via the native bridge.
const memory=new Map<string,string>();
let limited=false;
export function browserPersistenceAvailable(){
 if(limited)return false;try{return typeof window.localStorage.getItem==='function';}catch{limited=true;return false;}
}
export const browserStorage={
 getItem(key:string){if(memory.has(key))return memory.get(key)!;try{return window.localStorage.getItem(key);}catch{limited=true;return null;}},
 setItem(key:string,value:string){try{window.localStorage.setItem(key,value);memory.delete(key);}catch{limited=true;memory.set(key,value);}},
 removeItem(key:string){memory.delete(key);try{window.localStorage.removeItem(key);}catch{limited=true;}},
 keys(){try{return [...new Set([...memory.keys(),...Array.from({length:window.localStorage.length},(_,i)=>window.localStorage.key(i)).filter((k):k is string=>!!k)])];}catch{limited=true;return [...memory.keys()];}}
};
