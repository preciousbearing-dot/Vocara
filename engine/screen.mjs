import fs from 'fs';
import { checkTake, wavToPcm } from '/home/claude/vocara/www/js/wav.js';
const D='/mnt/user-data/attachments/7d123e95-7677-5228-ad60-c2bcdc8ea4ef/';
const j=JSON.parse(fs.readFileSync(D+'69e100b1-stone-age.timings.json'));
const w=new Uint8Array(fs.readFileSync(D+'b61e7f2e-stone-age.wav'));
const head=String.fromCharCode(...w.subarray(0,4));
const {pcm,rate}=wavToPcm(w);
console.log('file header',head,'rate',rate,'dur',(pcm.length/2/rate).toFixed(2),'json',j.durationMs/1000);
const dv=new DataView(pcm.buffer,pcm.byteOffset,pcm.byteLength);
for(const s of j.scenes){
  const a=Math.round((s.startMs/1000+0.1)*rate)*2, b=Math.round((s.endMs/1000-0.1)*rate)*2;
  const clip=pcm.slice(a,b);
  const text=s.text.replace(/\[pause[^\]]*\]/g,'').replace(/\s+/g,' ').trim();
  const r=checkTake(clip,rate,text);
  // peak in first 3 ms and last 130 ms of scene (header click / static burst check)
  const pk=(from,len)=>{let m=0;for(let i=0;i<len;i++){const k=(Math.round(from*rate)+i)*2; if(k+1<pcm.length) m=Math.max(m,Math.abs(dv.getInt16(k,true)));}return (m/32768).toFixed(2)};
  console.log(s.index, r.ok?'ok ':'BAD', r.reason||'-', 'ratio',r.ratio.toFixed(2),'ms/char',r.msPerChar.toFixed(0), 'start3ms',pk(s.startMs/1000,72),'end130ms',pk(s.endMs/1000-0.13,3100));
}
