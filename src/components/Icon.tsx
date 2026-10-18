import React from 'react';
const paths={
 plus:'M12 5v14M5 12h14',close:'m6 6 12 12M18 6 6 18',back:'m14 5-7 7 7 7M7 12h14',
 play:'m9 5 11 7-11 7Z',pause:'M8 5v14M16 5v14',film:'M4 4h16v16H4ZM4 9h16M4 15h16M8 4v16M16 4v16',
 text:'M4 5h16M12 5v15M8 20h8',styles:'M5 4h14v16H5ZM8 8h8M8 12h5M8 16h7',
 motion:'m5 4 14 8-14 8ZM3 8H1M3 12H0M3 16H1',rhythm:'M4 10v4M8 6v12M12 3v18M16 7v10M20 10v4',
 sync:'M4 8a8 8 0 0 1 13-3l3 3M20 3v5h-5M20 16a8 8 0 0 1-13 3l-3-3M4 21v-5h5',
 folder:'M3 6h7l2 2h9v12H3Z',file:'M6 3h8l4 4v14H6ZM14 3v5h4M9 12h6M9 16h6',
 upload:'M12 16V3m-5 5 5-5 5 5M4 15v6h16v-6',download:'M12 3v13m-5-5 5 5 5-5M4 17v4h16v-4',
 save:'M4 3h14l3 3v15H3V3ZM7 3v6h10V3M7 21v-8h10v8',settings:'M4 7h16M4 17h16M9 4v6M16 14v6',
 moon:'M20 14a8 8 0 0 1-10-10 8 8 0 1 0 10 10Z',sun:'M12 3V1M12 23v-2M3 12H1M23 12h-2M5 5 3 3M21 21l-2-2M5 19l-2 2M21 3l-2 2M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0',
 trash:'M4 6h16M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7M14 10v7',
 check:'m5 12 4 4L19 6',chevron:'m9 5 7 7-7 7',left:'m14 5-7 7 7 7',right:'m10 5 7 7-7 7',
 clock:'M12 8v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0',
 search:'M16 16l5 5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0',grid:'M3 3h7v7H3ZM14 3h7v7h-7ZM3 14h7v7H3ZM14 14h7v7h-7Z',
 image:'M3 3h18v18H3Zm0 14 6-7 5 5 3-3 4 5M16 7h.01',lock:'M5 10h14v11H5ZM8 10V6a4 4 0 0 1 8 0v4',
 expand:'M8 3H3v5M16 3h5v5M3 16v5h5M21 16v5h-5',minus:'M5 12h14',
};
export type IconName=keyof typeof paths;
export default function Icon({name,size=20}:{name:IconName;size?:number}){
 return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name]}/></svg>;
}
