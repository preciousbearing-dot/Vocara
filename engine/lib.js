// shared drawing kit
const c=document.getElementById('c'),x=c.getContext('2d'),W=1080,H=1920;
const INK='#1a1530';
let T=0; // global time
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const ease=v=>v*v*(3-2*v);
const back=v=>{v=clamp(v);const s=1.70158;return 1+(s+1)*Math.pow(v-1,3)+s*Math.pow(v-1,2)};
const appear=(t0,d=.35)=>back((T-t0)/d);
const fadeIn=(t0,d=.4)=>clamp((T-t0)/d);
const fadeOut=(t1,d=.4)=>1-clamp((T-t1)/d);
function prng(seed){let s=seed;return()=>{s=(s*9301+49297)%233280;return s/233280}}
function grad(y0,y1,stops){const g=x.createLinearGradient(0,y0,0,y1);stops.forEach(([o,cl])=>g.addColorStop(o,cl));x.fillStyle=g;x.fillRect(-300,y0,W+600,y1-y0)}
function mix(a,b,k){const p=s=>[1,3,5].map(i=>parseInt(s.slice(i,i+2),16));const A=p(a),B=p(b);return '#'+A.map((v,i)=>Math.round(v+(B[i]-v)*k).toString(16).padStart(2,'0')).join('')}
function hills(base,amp,col,k,phase,x0=-300,x1=W+300){x.fillStyle=col;x.beginPath();x.moveTo(x0,H+100);const n=44;for(let i=0;i<=n;i++){const px=x0+(x1-x0)*i/n;x.lineTo(px,base-amp*(Math.sin(i*k+phase)*.5+.5)-amp*.4*Math.sin(i*k*2.3+phase*2))}x.lineTo(x1,H+100);x.fill()}
function glow(px,py,r,rgb,a){const g=x.createRadialGradient(px,py,0,px,py,r);g.addColorStop(0,`rgba(${rgb},${a})`);g.addColorStop(1,`rgba(${rgb},0)`);x.fillStyle=g;x.fillRect(px-r,py-r,2*r,2*r)}
function stars(n,ymax,a=1,seed=5){const r=prng(seed);for(let i=0;i<n;i++){const tw=.6+.4*Math.sin(T*2+i);x.fillStyle=`rgba(255,255,255,${(.25+r()*.6)*tw*a})`;x.beginPath();x.arc(-100+r()*(W+200),r()*ymax,.8+r()*1.8,0,7);x.fill()}}
function fern(px,py,s,col,lean=0,sway=0){x.save();x.translate(px,py);x.scale(s,s);const sw=Math.sin(T*1.1+px)*sway;x.strokeStyle='#5b3d2a';x.lineWidth=16;x.lineCap='round';x.beginPath();x.moveTo(0,0);x.quadraticCurveTo(lean*.5+sw*.3,-130,lean+sw,-260);x.stroke();
 x.strokeStyle=col;x.lineWidth=11;for(let i=0;i<9;i++){const a=-Math.PI*(.1+i*.1)-.1;const L=120+(i%2)*30;x.beginPath();x.moveTo(lean+sw,-260);x.quadraticCurveTo(lean+sw+Math.cos(a)*L*.6,-260+Math.sin(a)*L*.9-20,lean+sw+Math.cos(a)*L,-260+Math.sin(a)*L*.6+50+Math.sin(T*1.6+i)*4);x.stroke()}x.restore()}
function rock(px,py,w,h,col){x.fillStyle=col;x.beginPath();x.moveTo(px-w/2,py);x.lineTo(px-w*.35,py-h*.8);x.lineTo(px,py-h);x.lineTo(px+w*.4,py-h*.7);x.lineTo(px+w/2,py);x.closePath();x.fill()}
function tufts(y0,y1,n,col,seed=3){const r=prng(seed);x.strokeStyle=col;x.lineWidth=4;x.lineCap='round';for(let i=0;i<n;i++){const px=-200+r()*(W+400),py=y0+r()*(y1-y0),sw=Math.sin(T*1.5+i)*2;for(let k=-1;k<=1;k++){x.beginPath();x.moveTo(px,py);x.lineTo(px+k*9+sw,py-22-r()*10);x.stroke()}}}
function bird(px,py,s,col,ph=0){const f=Math.sin(T*9+ph)*8*s;x.strokeStyle=col;x.lineWidth=4*s;x.lineCap='round';x.beginPath();x.moveTo(px-18*s,py-f);x.quadraticCurveTo(px-9*s,py-12*s+f,px,py);x.quadraticCurveTo(px+9*s,py-12*s+f,px+18*s,py-f);x.stroke()}
function flock(cx,cy,n,s,col,speed=30,seed=9){const r=prng(seed);for(let i=0;i<n;i++){const ox=r()*500,oy=r()*120;bird(((cx+ox+T*speed)%(W+600))-300,cy+oy+Math.sin(T+i)*10,s*(.8+r()*.5),col,i)}}
function mammoth(px,py,s,col,tusk='#efe3c8',walk=0){x.save();x.translate(px,py);x.scale(s,s);x.fillStyle=col;
 const b=Math.sin(walk)*10;
 [[-95,b],[-55,-b],[55,b],[95,-b]].forEach(([lx,ly])=>{x.fillRect(lx-16+ly*.6,-60,32,70+Math.abs(ly)*.2)});
 x.beginPath();x.ellipse(0,-120,140,85,0,0,7);x.fill();x.beginPath();x.ellipse(-100,-170,80,75,0,0,7);x.fill();x.beginPath();x.ellipse(-20,-190,90,50,0,0,7);x.fill();
 x.strokeStyle=col;x.lineWidth=34;x.lineCap='round';x.beginPath();x.moveTo(-150,-160);x.quadraticCurveTo(-200-Math.sin(walk*.5)*10,-80,-170,-10);x.stroke();
 x.strokeStyle=tusk;x.lineWidth=12;x.beginPath();x.moveTo(-130,-135);x.quadraticCurveTo(-190,-60,-120,-40);x.stroke();
 x.fillStyle=col;x.beginPath();x.moveTo(-135,-40);for(let i=0;i<14;i++)x.lineTo(-135+i*20,-40+(i%2?28:0));x.lineTo(150,-40);x.lineTo(150,-90);x.lineTo(-135,-90);x.fill();
 x.fillStyle=INK;x.beginPath();x.arc(-118,-185,5,0,7);x.fill();x.restore()}
function wolf(px,py,s,col,eye,flip=1){x.save();x.translate(px,py);x.scale(s*flip,s);x.fillStyle=col;
 [[-40,0],[-20,3],[40,0],[58,3]].forEach(([lx,ly])=>x.fillRect(lx-6,ly-50,12,52));
 x.beginPath();x.ellipse(5,-70,70,34,0,0,7);x.fill();
 x.beginPath();x.moveTo(-55,-95);x.quadraticCurveTo(-110,-110,-122,-80);x.lineTo(-100,-68);x.quadraticCurveTo(-75,-50,-55,-55);x.fill();
 x.beginPath();x.moveTo(-72,-100);x.lineTo(-66,-125);x.lineTo(-56,-100);x.fill();
 x.strokeStyle=col;x.lineWidth=16;x.lineCap='round';x.beginPath();x.moveTo(70,-80);x.quadraticCurveTo(110,-95+Math.sin(T*2)*6,120,-60);x.stroke();
 if(eye){const a=.5+.5*Math.sin(T*3);glow(-92,-90,46,'255,220,90',.5*a+.3);x.fillStyle=eye;x.beginPath();x.arc(-92,-90,5,0,7);x.fill()}x.restore()}
function dog(px,py,s,col,flip=1,wag=1){x.save();x.translate(px,py);x.scale(s*flip,s);x.fillStyle=col;
 [[-34,0],[-16,2],[34,0],[50,2]].forEach(([lx,ly])=>x.fillRect(lx-7,ly-46,14,48));
 x.beginPath();x.ellipse(5,-64,60,30,0,0,7);x.fill();x.beginPath();x.arc(-62,-86,26,0,7);x.fill();
 x.beginPath();x.moveTo(-84,-80);x.lineTo(-108,-72);x.lineTo(-86,-62);x.fill();
 x.fillStyle='#6b4a34';x.beginPath();x.ellipse(-70,-102,9,20,.3,0,7);x.fill();
 x.fillStyle=INK;x.beginPath();x.arc(-66,-90,4,0,7);x.arc(-110,-72,4,0,7);x.fill();
 x.strokeStyle=col;x.lineWidth=14;x.lineCap='round';x.beginPath();x.moveTo(62,-72);x.quadraticCurveTo(90,-110+Math.sin(T*12)*wag*14,100,-95+Math.sin(T*12)*wag*18);x.stroke();x.restore()}
function deer(px,py,s,col,flip=1,head=0){x.save();x.translate(px,py);x.scale(s*flip,s);x.fillStyle=col;
 [[-40,0],[-22,0],[34,0],[52,0]].forEach(([lx])=>x.fillRect(lx-5,-90,10,92));
 x.beginPath();x.ellipse(5,-110,66,32,0,0,7);x.fill();
 x.save();x.translate(-52,-120);x.rotate(head*.6);x.beginPath();x.moveTo(0,0);x.lineTo(-26,-70);x.lineTo(-8,-76);x.lineTo(14,-6);x.fill();
 x.beginPath();x.ellipse(-30,-80,20,12,-.5,0,7);x.fill();
 x.strokeStyle='#7a5a3a';x.lineWidth=5;x.beginPath();x.moveTo(-24,-86);x.lineTo(-20,-128);x.lineTo(-8,-140);x.moveTo(-20,-110);x.lineTo(-34,-124);x.stroke();x.fillStyle=INK;x.beginPath();x.arc(-32,-82,3,0,7);x.fill();x.restore();
 x.fillStyle='#f1e6d0';x.beginPath();x.ellipse(60,-118,9,12,0,0,7);x.fill();x.restore()}
function rabbit(px,py,s,col,flip=1,hop=0){x.save();x.translate(px,py-Math.abs(Math.sin(hop))*18*s);x.scale(s*flip,s);x.fillStyle=col;x.beginPath();x.ellipse(0,-26,34,26,0,0,7);x.fill();x.beginPath();x.arc(-28,-40,17,0,7);x.fill();
 x.beginPath();x.ellipse(-30,-72,6,20,.2,0,7);x.ellipse(-20,-70,6,20,.15,0,7);x.fill();x.fillStyle='#fff';x.beginPath();x.arc(36,-28,9,0,7);x.fill();x.fillStyle=INK;x.beginPath();x.arc(-34,-42,3,0,7);x.fill();x.restore()}
function fish(px,py,s,col,rot=0){x.save();x.translate(px,py);x.rotate(rot);x.scale(s,s);x.fillStyle=col;x.beginPath();x.ellipse(0,0,30,13,0,0,7);x.fill();x.beginPath();x.moveTo(24,0);x.lineTo(46,-14);x.lineTo(46,14);x.fill();x.fillStyle='#fff';x.beginPath();x.arc(-16,-3,3,0,7);x.fill();x.restore()}
function hut(px,py,s,col,glowOn=0){x.save();x.translate(px,py);x.scale(s,s);x.fillStyle=col;x.beginPath();x.moveTo(-130,0);x.lineTo(0,-190);x.lineTo(130,0);x.fill();x.fillStyle='rgba(0,0,0,.25)';x.beginPath();x.moveTo(-34,0);x.lineTo(0,-84);x.lineTo(34,0);x.fill();
 x.strokeStyle='rgba(0,0,0,.2)';x.lineWidth=5;for(let i=-3;i<=3;i++){x.beginPath();x.moveTo(i*30,0);x.lineTo(i*8,-170);x.stroke()}if(glowOn)glow(0,-30,120,'255,160,70',glowOn);x.restore()}
// ----- people
function face(f,ey,mode,blink){x.fillStyle=INK;x.strokeStyle=INK;x.lineCap='round';x.lineWidth=6;
 const e=(ex,r)=>{if(blink){x.beginPath();x.moveTo(ex-r,ey);x.lineTo(ex+r,ey);x.stroke()}else{x.beginPath();x.arc(ex,ey,r,0,7);x.fill()}};
 if(mode==='shock'){[-24,24].forEach(ex=>{x.fillStyle='#fff';x.beginPath();x.arc(ex,ey,15,0,7);x.fill();x.lineWidth=4;x.stroke();x.fillStyle=INK;x.beginPath();x.arc(ex,ey,6,0,7);x.fill()});x.lineWidth=6;x.beginPath();x.moveTo(-40,ey-26);x.lineTo(-12,ey-32);x.moveTo(40,ey-26);x.lineTo(12,ey-32);x.stroke();x.beginPath();x.ellipse(0,ey+34,10,15,0,0,7);x.fill()}
 else if(mode==='stern'){e(-22,6);e(22,6);x.beginPath();x.moveTo(-38,ey-14);x.lineTo(-10,ey-6);x.moveTo(38,ey-14);x.lineTo(10,ey-6);x.stroke();x.beginPath();x.moveTo(-14,ey+34);x.lineTo(14,ey+32);x.stroke()}
 else if(mode==='brow'){e(-22,6);e(22,6);x.beginPath();x.moveTo(-38,ey-14);x.lineTo(-10,ey-6);x.moveTo(38,ey-24);x.lineTo(10,ey-16);x.stroke();x.beginPath();x.moveTo(-14,ey+34);x.lineTo(14,ey+30);x.stroke()}
 else if(mode==='worry'){e(-22,7);e(22,7);x.beginPath();x.moveTo(-38,ey-8);x.lineTo(-10,ey-20);x.moveTo(38,ey-8);x.lineTo(10,ey-20);x.stroke();x.beginPath();x.arc(0,ey+42,13,Math.PI*1.15,Math.PI*1.85);x.stroke()}
 else if(mode==='calm'){e(-22,6);e(22,6);x.beginPath();x.arc(0,ey+24,16,Math.PI*.2,Math.PI*.8);x.stroke()}
 else if(mode==='dizzy'){[-24,24].forEach(ex=>{x.lineWidth=4;x.beginPath();for(let a=0;a<12;a+=.3){x.lineTo(ex+Math.cos(a+T*6)*a*1.3,ey+Math.sin(a+T*6)*a*1.3)}x.stroke()});x.lineWidth=6;x.beginPath();x.moveTo(-14,ey+36);x.quadraticCurveTo(0,ey+24,14,ey+36);x.stroke()}
 else if(mode==='laugh'){e(-22,6);e(22,6);x.beginPath();x.arc(0,ey+14,24,0,Math.PI);x.closePath();x.fill()}
 else {e(-22,6);e(22,6);x.beginPath();x.arc(0,ey+20,22,Math.PI*.12,Math.PI*.88);x.stroke()}}
function hair(style,col,r){x.fillStyle=col;
 if(style==='short'){x.beginPath();x.arc(0,-6,r+4,Math.PI*1.05,Math.PI*1.95);x.fill()}
 if(style==='long'){x.beginPath();x.arc(0,-6,r+5,Math.PI*1.02,Math.PI*1.98);x.fill();x.beginPath();x.roundRect(-r-8,-8,22,r*1.7,10);x.fill();x.beginPath();x.roundRect(r-14,-8,22,r*1.7,10);x.fill()}
 if(style==='bun'){x.beginPath();x.arc(0,-6,r+3,Math.PI*1.05,Math.PI*1.95);x.fill();x.beginPath();x.arc(0,-r-14,22,0,7);x.fill()}
 if(style==='wild'){x.beginPath();x.moveTo(-r-6,-10);for(let i=0;i<9;i++){const a=Math.PI*(1+i/8);x.lineTo(Math.cos(a)*(r+(i%2?28:8)),-6+Math.sin(a)*(r+(i%2?28:8)))}x.lineTo(r+6,-10);x.fill()}
 if(style==='pigtails'){x.beginPath();x.arc(0,-6,r+3,Math.PI*1.05,Math.PI*1.95);x.fill();x.beginPath();x.arc(-r-4,6,18,0,7);x.arc(r+4,6,18,0,7);x.fill()}}
function person(px,py,s,o){o=Object.assign({skin:'#c98f63',hair:'short',hairCol:'#2a1c14',outfit:'#8a5a3a',w:110,hr:56,mode:'smile',beard:false,item:null,pose:'down',flip:1,modern:false,sit:false,trim:'#d9b27c',ph:0,armL:null,armR:null,lean:0,eyesClosed:false,look:0},o);
 const br=Math.sin(T*2.2+o.ph)*3,bl=((T+o.ph*1.7)%3.4)<.13||o.eyesClosed;
 x.save();x.translate(px,py);x.scale(s*o.flip,s);
 x.fillStyle='rgba(0,0,0,.28)';x.beginPath();x.ellipse(0,6,o.w*.9,16,0,0,7);x.fill();
 const top=(o.sit?-115:-190)+br*.5,hy=(o.sit?-175:-250)+br;
 const SK=o.modern?'#f2d7b6':o.skin;
 const arm=(sx,t,col)=>{x.strokeStyle=col;x.lineWidth=26;x.lineCap='round';x.beginPath();x.moveTo(sx,top+18);x.lineTo(t[0],t[1]);x.stroke();x.fillStyle=SK;x.beginPath();x.arc(t[0],t[1],15,0,7);x.fill()};
 let L=[-o.w/2-14,top+90],R=[o.w/2+14,top+90];
 if(o.pose==='up'){L=[-o.w/2-45,top-50];R=[o.w/2+45,top-50]}
 if(o.pose==='reach'){L=[-o.w/2-5,top+55];R=[o.w/2+90,top+25]}
 if(o.pose==='point'){R=[o.w/2+110,top+10]}
 if(o.pose==='hold'){L=[-o.w/2-10,top+60];R=[o.w/2+10,top+60]}
 if(o.armL)L=o.armL.map((v,i)=>v+(i?top:0));if(o.armR)R=o.armR.map((v,i)=>v+(i?top:0));
 const legC=o.modern?'#3b5b9d':SK;
 if(o.sit){x.fillStyle=legC;x.beginPath();x.ellipse(-o.w*.3,-24,o.w*.45,24,0,0,7);x.ellipse(o.w*.3,-24,o.w*.45,24,0,0,7);x.fill();
  if(o.modern){x.fillStyle='#fff';x.beginPath();x.ellipse(-o.w*.62,-14,22,13,0,0,7);x.ellipse(o.w*.62,-14,22,13,0,0,7);x.fill()}}
 else{x.strokeStyle=legC;x.lineWidth=o.modern?34:30;x.lineCap='round';x.beginPath();x.moveTo(-o.w*.25,top+40);x.lineTo(-o.w*.28,-14);x.moveTo(o.w*.25,top+40);x.lineTo(o.w*.28,-14);x.stroke();
  if(o.modern){x.fillStyle='#fff';x.beginPath();x.ellipse(-o.w*.3,-2,30,14,0,0,7);x.ellipse(o.w*.3,-2,30,14,0,0,7);x.fill();x.fillStyle='#ff9a3c';x.fillRect(-o.w*.3-30,2,60,4);x.fillRect(o.w*.3-30,2,60,4)}
  else{x.fillStyle='#5a3b28';x.beginPath();x.ellipse(-o.w*.3,0,26,12,0,0,7);x.ellipse(o.w*.3,0,26,12,0,0,7);x.fill()}}
 if(o.item==='spear'){x.strokeStyle='#6b4a2f';x.lineWidth=9;x.beginPath();x.moveTo(o.w/2+30,12);x.lineTo(o.w/2+30,-420);x.stroke();x.fillStyle='#bfc5cf';x.beginPath();x.moveTo(o.w/2+30,-470);x.lineTo(o.w/2+16,-420);x.lineTo(o.w/2+44,-420);x.fill()}
 if(o.modern){x.fillStyle='#c9593a';x.beginPath();x.roundRect(o.w/2-14,top+6,40,o.sit?80:110,14);x.fill()}
 arm(-o.w/2+6,L,o.modern?'#2a9d97':o.skin);
 const th=o.sit?100:140;
 if(o.modern){x.fillStyle='#2fb7b0';x.beginPath();x.roundRect(-o.w/2,top,o.w,th,44);x.fill();
  x.fillStyle='#269a94';x.beginPath();x.roundRect(-o.w*.32,top+th*.55,o.w*.64,th*.32,12);x.fill();
  x.strokeStyle='#fff';x.lineWidth=4;x.beginPath();x.moveTo(-10,top+6);x.lineTo(-12,top+44);x.moveTo(10,top+6);x.lineTo(12,top+44);x.stroke();
  x.strokeStyle='#ff9a3c';x.lineWidth=9;x.beginPath();x.arc(0,top-14,o.w*.46,Math.PI*.12,Math.PI*.88);x.stroke();x.fillStyle='#ff9a3c';x.beginPath();x.roundRect(-o.w*.5,top-12,16,28,6);x.roundRect(o.w*.5-16,top-12,16,28,6);x.fill();
  x.strokeStyle='#c9593a';x.lineWidth=10;x.beginPath();x.moveTo(o.w/2-18,top+4);x.lineTo(o.w/2-30,top+th*.7);x.stroke()}
 else{x.fillStyle=o.outfit;x.beginPath();x.moveTo(-o.w/2,top);x.lineTo(o.w/2,top);x.lineTo(o.w/2+8,top+th);for(let i=0;i<7;i++)x.lineTo(o.w/2+8-(i+1)*(o.w+16)/7,top+th+(i%2?0:20));x.lineTo(-o.w/2-8,top+th);x.closePath();x.fill();
  x.strokeStyle=o.trim;x.lineWidth=7;x.beginPath();x.moveTo(-o.w/2+4,top+6);x.lineTo(o.w/2-4,top+36);x.stroke();
  x.fillStyle=o.trim;for(let i=0;i<5;i++){x.beginPath();x.arc(-o.w/3+i*o.w/6,top+4+(i%2)*8,6,0,7);x.fill()}}
 arm(o.w/2-6,R,o.modern?'#2a9d97':o.skin);
 if(o.modern){x.fillStyle=INK;x.beginPath();x.roundRect(L[0]-10,L[1]-24,20,14,4);x.fill();x.fillStyle='#3de0d0';x.fillRect(L[0]-6,L[1]-21,12,8)}
 if(o.item==='basket'){x.fillStyle='#a8793f';x.beginPath();x.ellipse(R[0],R[1]+6,32,22,0,0,Math.PI);x.fill();x.fillStyle='#c0392b';[-14,0,14].forEach(d=>{x.beginPath();x.arc(R[0]+d,R[1]-6,8,0,7);x.fill()})}
 if(o.item==='stick'){x.strokeStyle='#7a5632';x.lineWidth=7;x.beginPath();x.moveTo(R[0]-6,R[1]+10);x.lineTo(R[0]+4,R[1]-60);x.stroke()}
 x.save();x.translate(o.lean,hy);
 x.fillStyle=o.modern?'#f6ead3':o.skin;x.beginPath();x.arc(0,0,o.hr,0,7);x.fill();
 hair(o.modern?'short':o.hair,o.modern?'#2a1c14':o.hairCol,o.hr);
 if(o.beard){x.fillStyle=o.hairCol;x.beginPath();x.arc(0,10,o.hr-2,Math.PI*.1,Math.PI*.9);x.lineTo(-o.hr*.5,o.hr*.55);x.quadraticCurveTo(0,o.hr*.3,o.hr*.5,o.hr*.55);x.closePath();x.fill()}
 x.save();x.translate(o.look,0);face(0,-4,o.mode,bl);x.restore();
 x.restore();x.restore()}
function fire(px,py,s,a=1){x.save();x.translate(px,py);x.scale(s,s);
 x.strokeStyle='#4a2f1d';x.lineWidth=14;x.lineCap='round';x.beginPath();x.moveTo(-55,5);x.lineTo(50,-12);x.moveTo(55,5);x.lineTo(-50,-12);x.stroke();
 const f=1+.08*Math.sin(T*14)+.05*Math.sin(T*23);
 [['#ff6a1a',1,0],['#ffa733',.72,-6],['#ffe28a',.4,-10]].forEach(([cl,k,dy],j)=>{const kk=k*f*a;x.fillStyle=cl;x.beginPath();x.moveTo(-42*kk,-6);x.quadraticCurveTo(-52*kk-4*Math.sin(T*9+j),-70*kk,-8*kk,-130*kk);x.quadraticCurveTo(2*Math.sin(T*11+j),-80*kk,24*kk,-150*kk);x.quadraticCurveTo(54*kk,-80*kk,42*kk,-6);x.closePath();x.fill()});
 x.restore();const r=prng(Math.floor(T*6)+1);for(let i=0;i<14;i++){const k=((T*.5+i*.137)%1);x.fillStyle=`rgba(255,${170+(i*13)%70},80,${(1-k)*.8*a})`;x.beginPath();x.arc(px+Math.sin(i*7+T)*50*s*k+ (i%5-2)*12*s,py-60*s-k*300*s,1.5+(i%3),0,7);x.fill()}}
const LQ=[];
function label(...args){LQ.push(args)}
function drawLabel(t,px,py,size,col,al='left',a=1,sc=1){if(a<=0)return;x.save();x.globalAlpha=a;x.translate(px,py);x.scale(sc,sc);x.shadowColor='rgba(0,0,0,.5)';x.shadowBlur=28;x.font=`800 ${size}px Inter,Arial,sans-serif`;x.fillStyle=col;x.textAlign=al;x.fillText(t,0,0);x.restore()}
function smoke(px,py,n,col,spd=1){for(let i=0;i<n;i++){const k=((T*.25*spd+i/n)%1);x.fillStyle=`rgba(${col},${(1-k)*.35})`;x.beginPath();x.arc(px+Math.sin(k*6+i)*26*k+k*30,py-k*220,10+k*34,0,7);x.fill()}}
function icon(kind,px,py,s,a=1){x.save();x.globalAlpha=a;x.translate(px,py);x.scale(s,s);
 if(kind==='phone'){x.fillStyle=INK;x.beginPath();x.roundRect(-45,-75,90,150,16);x.fill();x.fillStyle='#3de0d0';x.beginPath();x.roundRect(-35,-60,70,100,8);x.fill()}
 if(kind==='bulb'){x.fillStyle='#ffd24a';x.beginPath();x.arc(0,-10,44,0,7);x.fill();x.fillStyle='#8a8fa8';x.fillRect(-16,30,32,22);glow(0,-10,90,'255,210,80',.35)}
 if(kind==='cross'){x.fillStyle='#e04b4b';x.fillRect(-12,-40,24,80);x.fillRect(-40,-12,80,24)}
 if(kind==='bolt'){x.fillStyle='#ffd24a';x.beginPath();x.moveTo(10,-60);x.lineTo(-30,8);x.lineTo(-2,8);x.lineTo(-12,60);x.lineTo(32,-14);x.lineTo(2,-14);x.closePath();x.fill()}
 if(kind==='pot'){x.fillStyle='#3a3d52';x.beginPath();x.arc(0,0,48,0,Math.PI);x.fill();x.fillRect(-48,-8,96,10);x.strokeStyle='#3a3d52';x.lineWidth=8;x.beginPath();x.arc(0,-8,36,Math.PI,0);x.stroke()}
 if(kind==='no'){x.strokeStyle='#e04b4b';x.lineWidth=14;x.beginPath();x.arc(0,0,60,0,7);x.moveTo(-42,-42);x.lineTo(42,42);x.stroke()}
 if(kind==='q'){x.font='800 120px Inter,Arial';x.fillStyle='#ffd24a';x.textAlign='center';x.fillText('?',0,40)}
 if(kind==='clock'){x.fillStyle='#fff';x.beginPath();x.arc(0,0,52,0,7);x.fill();x.strokeStyle=INK;x.lineWidth=7;x.beginPath();x.arc(0,0,52,0,7);x.stroke();x.beginPath();x.moveTo(0,0);x.lineTo(0,-34);x.moveTo(0,0);const a2=T*5;x.lineTo(Math.cos(a2)*26,Math.sin(a2)*26);x.stroke()}
 x.restore()}
function brain(px,py,s,col){x.save();x.translate(px,py);x.scale(s,s);x.fillStyle=col;x.beginPath();x.arc(-26,0,36,0,7);x.arc(26,0,36,0,7);x.arc(0,-26,36,0,7);x.arc(0,22,32,0,7);x.fill();x.strokeStyle='rgba(0,0,0,.22)';x.lineWidth=5;x.beginPath();x.moveTo(0,-50);x.quadraticCurveTo(-8,0,0,44);x.moveTo(-40,-6);x.quadraticCurveTo(-20,-14,-6,-4);x.moveTo(40,8);x.quadraticCurveTo(20,0,6,10);x.stroke();x.restore()}
function berryBush(px,py,s,cols,seed=1){x.save();x.translate(px,py);x.scale(s,s);x.fillStyle='#2f7a47';[[-50,-30,50],[0,-50,62],[50,-30,50],[-20,-10,44],[28,-8,46]].forEach(([a,b,r])=>{x.beginPath();x.arc(a,b,r,0,7);x.fill()});
 const r=prng(seed);for(let i=0;i<12;i++){x.fillStyle=cols[i%cols.length];x.beginPath();x.arc(-70+r()*140,-70+r()*70,7,0,7);x.fill()}x.restore()}
