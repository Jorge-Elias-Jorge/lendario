export function wrapText(text:string,maxLines=2,maxChars=24):string[]{
 const words=text.trim().split(/\s+/).filter(Boolean);
 if(!words.length)return[''];
 const target=Math.max(1,Math.ceil(words.join(' ').length/Math.max(1,maxLines)));
 const lines:string[]=[];let current='';
 for(const word of words){
  const candidate=current?current+' '+word:word;
  if(candidate.length>target&&current&&lines.length<maxLines-1){lines.push(current);current=word;}
  else current=candidate;
 }
 if(current)lines.push(current);
 while(lines.length>maxLines){const extra=lines.pop()!;lines[lines.length-1]+=' '+extra;}
 return lines;
}
