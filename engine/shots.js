// ===== Stone Age test, vertical. Shot list tied to narration (words.js) =====
const FPS=30,VO_END=83.158,DUR_TOTAL=84.4;
const cl=clamp,ez=ease;
const ramp=(t,a,b)=>cl((t-a)/(b-a));
const V=(a,b,k)=>a.map((v,i)=>lerp(v,b[i],k));
const CAST={
 you:{skin:'#a8714a',hair:'short',hairCol:'#15100e',outfit:'#4f7cff',pants:'#2b355f',trim:'#e6edf7',shoe:'#f4f4f4',modern:true,hr:.28},
 elder:{skin:'#86563a',hair:'short',hairCol:'#e8e8f0',outfit:'#7a5a3a',pants:null,shoe:null,fur:true,trim:'#d9b27c',beard:true,hr:.29,h:.95},
 hunter:{skin:'#9a6a44',hair:'wild',hairCol:'#1a1210',outfit:'#a0703c',pants:null,shoe:null,fur:true,trim:'#e8d7a8',beard:true,item:'spear',hr:.29,h:1.05},
 girl:{skin:'#c58f63',hair:'pigtails',hairCol:'#3a2418',outfit:'#c0693f',pants:null,shoe:null,fur:true,trim:'#f0d8a0',h:.72,hr:.3},
 mother:{skin:'#b57a52',hair:'bun',hairCol:'#2a1c14',outfit:'#cf8250',pants:null,shoe:null,fur:true,trim:'#f0d8a0',h:.95},
 boy:{skin:'#a66b45',hair:'short',hairCol:'#20160f',outfit:'#8a6a3a',pants:null,shoe:null,fur:true,trim:'#d9b27c',h:.8,hr:.3}
};
const C=(k,o)=>Object.assign({},CAST[k],o);
const RIVER={pts:[[-90,28],[-40,24],[-5,22],[30,25],[90,30]],w:5};
const PATH=[{pts:[[0,-30],[0,0],[2,10],[0,20]],w:1.2,col:'rgba(214,184,128,.55)'}];
let GRD={};
// whole world props (static layout, drawn per frame by what the camera sees)
function props(o={}){
 treeRing(0,0,15,95,o.trees||160,3,5,11);
 treeRing(0,0,15,22,o.near||10,41,5,8);
 for(let i=0;i<30;i++){const r=prng(i+90);const X=(r()-.5)*70,Z=-10+r()*60;if(Math.abs(X)<5&&Z>-3&&Z<7)continue;rockP(X,Z,.5+r()*1.6,i)}
 if(o.river!==false){for(let i=0;i<30;i++){const r=prng(i+300);reeds(-45+i*3.2+r()*2,20+r()*1.2*(i%2?1:-1)*-1+(i%3),9,i)}}
 scatter({cell:4,r:48,p:.85,flowers:o.flowers});
 if(o.mammoths!==false){[[-34,95,1.0],[-24,102,.8],[-46,110,.9],[40,120,1.1]].forEach(([X,Z,s],i)=>sprite(X,Z,.011*s,()=>mammoth(0,0,1,mix('#5a4636',M.fog,.3),'#efe3c8',T*1.5+i)))}
}
function world(mood,o,fn){beginFrame(mood);drawSky();drawGround(Object.assign({river:RIVER,paths:PATH},o.g||{}));props(o);fn&&fn();fogLayers();flushSprites()}
function leaves(a=1,side=3){x.save();x.globalAlpha=a;const col=mix(M.leaf,'#000000',.55);x.fillStyle=col;
 const r=prng(5);for(let i=0;i<22;i++){const edge=r(),px=side&1&&i%2?-40+r()*200:W+40-r()*200,py=-40+r()*H*.3+(i%3)*80+(r()*H*.5)*(i%4===0?1:0);const sw=Math.sin(T*1.2+i)*.12;x.save();x.translate(px,py);x.rotate((i%2?-.6:.6)+sw+r());x.beginPath();x.ellipse(0,0,50+r()*70,17+r()*18,0,0,7);x.fill();x.restore()}
 x.restore()}
function rays(a=.18,col='255,230,170'){x.save();x.globalAlpha=a;for(let i=0;i<5;i++){const px=120+i*220+Math.sin(T*.4+i)*40;const g=x.createLinearGradient(px,0,px-220,H*.8);g.addColorStop(0,`rgba(${col},.8)`);g.addColorStop(1,`rgba(${col},0)`);x.fillStyle=g;x.beginPath();x.moveTo(px,0);x.lineTo(px+90,0);x.lineTo(px-180,H*.8);x.lineTo(px-300,H*.8);x.fill()}x.restore()}
// 3D floating icon
function float3(kind,X,Y,Z,sz,t0,life=2){const u=T-t0;if(u<0||u>life)return;const a=Math.min(1,(life-u)/.3);add(X,Z,(s)=>{const sc=back(u/.3)*sz*s/25000;x.translate(0,Math.sin(T*3+X)*.05*s);if(kind==='germ')germ(sc,a);else if(kind==='skull')skull(sc,a);else if(kind==='brain'){x.globalAlpha=a;brain(0,0,sc*1.1,'#ff8ab8');x.globalAlpha=1}else if(kind==='hand')hand(sc,a);else if(kind==='play')playI(sc,a);else icon(kind,0,0,sc,a)},Y)}
function germ(s,a){x.save();x.globalAlpha=a;x.scale(s,s);x.fillStyle='#8cff3a';x.strokeStyle='#8cff3a';x.lineWidth=7;x.lineCap='round';for(let i=0;i<10;i++){const an=i/10*6.283+T;x.beginPath();x.moveTo(Math.cos(an)*30,Math.sin(an)*30);x.lineTo(Math.cos(an)*50,Math.sin(an)*50);x.stroke();x.beginPath();x.arc(Math.cos(an)*52,Math.sin(an)*52,6,0,7);x.fill()}x.beginPath();x.arc(0,0,34,0,7);x.fill();x.fillStyle='#10330a';x.beginPath();x.arc(-11,-5,6,0,7);x.arc(11,-5,6,0,7);x.fill();x.fillRect(-12,10,24,5);x.restore()}
function skull(s,a){x.save();x.globalAlpha=a;x.scale(s,s);x.fillStyle='#f4f0e6';x.beginPath();x.arc(0,-8,46,0,7);x.fill();x.fillRect(-26,20,52,30);x.fillStyle='#1a1530';x.beginPath();x.arc(-18,-6,12,0,7);x.arc(18,-6,12,0,7);x.fill();x.fillRect(-4,10,8,10);for(let i=-2;i<=1;i++)x.fillRect(i*12+3,36,3,14);x.restore()}
function hand(s,a){x.save();x.globalAlpha=a;x.scale(s,s);x.fillStyle='#e8b48a';x.beginPath();x.roundRect(-30,-10,60,60,16);x.fill();for(let i=0;i<4;i++){x.beginPath();x.roundRect(-30+i*16,-60+(i%2)*8,14,64,7);x.fill()}x.beginPath();x.roundRect(-52,6,30,15,8);x.fill();x.restore()}
function playI(s,a){x.save();x.globalAlpha=a;x.scale(s,s);x.fillStyle='#ff2e4d';x.beginPath();x.roundRect(-55,-38,110,76,20);x.fill();x.fillStyle='#fff';x.beginPath();x.moveTo(-14,-20);x.lineTo(24,0);x.lineTo(-14,20);x.fill();x.restore()}
function label3(txt,X,Y,Z,col,t0,size=.5){add(X,Z,(s)=>{const u=T-t0;if(u<0)return;const k=back(u/.3);x.scale(k,k);x.font='900 '+(s*size)+'px Inter';x.textAlign='center';x.lineWidth=s*size*.16;x.strokeStyle='#120a2a';x.lineJoin='round';x.strokeText(txt,0,0);x.fillStyle=col;x.fillText(txt,0,0)},Y)}
function head3(X,Z,dy){return[X,1.75+(dy||0),Z]}
function bubble(X,Y,Z,t0,life,fn){const u=T-t0;if(u<0||u>life)return;add(X,Z,(s)=>{const k=back(u/.3)*(u>life-.25?(life-u)/.25:1);x.scale(k,k);x.fillStyle='rgba(255,255,255,.96)';x.beginPath();x.ellipse(0,0,s*.75,s*.55,0,0,7);x.fill();x.beginPath();x.arc(-s*.35,s*.62,s*.09,0,7);x.arc(-s*.5,s*.82,s*.05,0,7);x.fill();fn(s)},Y)}
// camera helpers
function cam(p0,p1,a0,a1,u,fov=62,roll=0,sh=1,e=ez){const k=e(cl(u));shot(V(p0,p1,k),0,V(a0,a1,k),fov,roll,sh)}
function orbit(c,r,an0,an1,h0,h1,u,lookY=1.2,fov=60,roll=0,sh=1){const k=ez(cl(u)),an=lerp(an0,an1,k),h=lerp(h0,h1,k);shot([c[0]+Math.sin(an)*r,h,c[1]-Math.cos(an)*r],0,[c[0],lookY,c[1]],fov,roll,sh)}
const YOU=(X,Z,o)=>puppet(X,Z,C('you',o));
const SH=[];function S(a,b,mood,fn){SH.push({a,b,mood,fn})}
const MD=(a,b,t,t0,t1)=>moodMix(a,b,ramp(t,t0,t1));

// ================= SCENE 0 : waking up =================
S(0,2.0,'dawn',(u,t)=>{ // looking up through the canopy
 cam([0.6,.25,-2.5],[0.2,.6,-2.2],[0,9,1.5],[0,6.5,2],u,70,.05+u*-.06,1.3);
 world(MOODS.dawn,{trees:80,mammoths:false},()=>{tree(-7,3,13,5,'round');tree(7,4,13,6,'round');YOU(0,-.2,{act:'lie',item:'phone',mode:'calm',eyesClosed:u<.5})});
 rays(.3);x.fillStyle=mix(M.leaf,'#000',.6);for(let i=0;i<9;i++){x.beginPath();x.arc(i*150-20+Math.sin(T+i)*10,-30+(i%3)*70,170,0,7);x.fill()}leaves(1);x.fillStyle=`rgba(0,0,0,${1-ramp(t,0,.5)})`;x.fillRect(0,0,W,H);
 slam('STONE AGE',1.0,.95,'#ffe08a',H*.36,190)});
S(2.0,3.65,'dawn',(u,t)=>{ // close on your face: memory
 cam([.2,1.7,-1.6],[.1,1.7,-.95],[0,1.7,0],[0,1.72,0],u,46,0,.6);
 world(MOODS.dawn,{trees:60,mammoths:false},()=>{YOU(0,0,{act:'idle',mode:'smile',item:null,h:1})});
 x.save();x.globalAlpha=.9*ramp(t,.3,.7);glow(W/2,H*.38,520,'255,220,130',.5);x.restore();
 float3('brain',0,2.35,0,170,2.35,1.3)});
S(3.65,7.7,'dawn',(u,t)=>{ // orbit while ideas pop around your head
 orbit([0,0],3.6,-.7,.55,1.5,1.9,u,1.3,56,0,.7);
 world(MOODS.dawn,{trees:90,mammoths:false},()=>{YOU(0,0,{act:'idle',mode:'smile',item:u>.7?'phone':null});
  float3('bolt',-1.0,2.1,0,125,4.1,2.6);float3('cross',1.05,2.35,0,125,5.0,2.2);float3('phone',-.3,2.7,0,60,6.2,1.5)});
 if(T>6.2){const k=ramp(T,6.3,6.5);x.save();x.globalAlpha=k*.3;glow(W/2,H*.4,600,'61,224,208',1);x.restore()}});
S(7.7,10.13,'dawn',(u,t)=>{ // reveal: tiny in a giant world
 cam([3,1.7,-5],[7,9,-18],[0,1.5,0],[-10,3,60],u,64,0,.6);
 world(MOODS.dawn,{trees:150,flowers:true},()=>{YOU(0,0,{act:'idle',mode:u>.5?'worry':'smile',dir:1,item:'phone'});
  if(T>9.1)bubble(0,2.2,0,9.1,.95,(s)=>icon('q',0,s*.1,s/90,1))});
 if(T>9.3){post({flash:Math.max(0,.5-(T-9.3)*2)})}});

// ================= SCENE 1 : the people around you =================
function ring(t,focus){const L=[['elder',-2.6,1.6,1],['hunter',2.6,1.2,-1],['girl',-1.6,-2.2,1],['mother',1.9,-2.3,-1],['boy',3.2,-.4,-1]];
 L.forEach(([k,X,Z,d],i)=>puppet(X,Z,C(k,{act:'idle',dir:d,look:d*.5,ph:i*1.3,mode:k==='hunter'?'brow':'smile',t:t})))}
S(10.13,13.3,'gold',(u,t)=>{
 orbit([0,0],6,-1.2,.9,1.1,1.6,u,1.2,58,0,1);
 world(MOODS.gold,{trees:120,mammoths:false},()=>{YOU(0,0,{act:'idle',mode:'worry',dir:1,look:.4});ring(T);});
 slam('NOT',12.55,1.0,'#ff5a5a',H*.33,200);
 if(T>12.8){const k=ramp(T,12.85,13.0);x.save();x.strokeStyle='#ff5a5a';x.lineWidth=22;x.lineCap='round';x.beginPath();x.moveTo(W*.1,H*.745);x.lineTo(W*.1+W*.8*k,H*.745-30*k);x.stroke();x.restore()}});
S(13.3,15.95,'gold',(u,t)=>{ // brains alike: two faces
 cam([-2.4,1.9,-.6],[-1.6,1.9,-.9],[0,1.6,1.1],[0,1.65,1.1],u,48,.03,.5);
 world(MOODS.gold,{trees:70,mammoths:false},()=>{puppet(-.75,.9,C('elder',{act:'idle',dir:1,look:.8,mode:'calm',h:1.1,hr:.29}));YOU(.75,.9,{act:'idle',dir:-1,look:.8,mode:'calm',h:1.0});
  float3('brain',-.75,2.75,.9,150,14.0,2.2);float3('brain',.75,2.7,.9,150,14.3,2.0)});
 if(T>14.9){const k=back((T-14.9)/.3);x.save();x.translate(W/2,H*.3);x.scale(k,k);x.font='900 190px Inter';x.textAlign='center';x.fillStyle='#ffd24a';x.lineWidth=28;x.strokeStyle='#120a2a';x.lineJoin='round';x.strokeText('=',0,60);x.fillText('=',0,60);x.restore()}});
S(15.95,17.55,'day',(u,t)=>{ // hunter tracks
 cam([-7,1.2,-3],[-1,1.0,-3],[-1,1.1,3],[3,1.0,3],u,58,.04,1.4,x=>x);
 world(MOODS.day,{trees:120,mammoths:false,g:{river:null}},()=>{puppet(-1+u*5,3,C('hunter',{act:'sneak',dir:1,mode:'stern',t:T}));
  for(let i=0;i<14;i++)reeds(-6+i*1.1,1.5+(i%3)*.8,10,i+20)})});
S(17.55,19.3,'day',(u,t)=>{ // girl with water, mother foraging
 cam([5,1.4,-3.6],[-3,1.4,-3.6],[1,1.1,2],[-3,1.1,2],u,60,-.03,1.2,x=>x);
 world(MOODS.day,{trees:120,mammoths:false},()=>{puppet(4-u*9,2,C('girl',{act:'walk',dir:-1,t:T,item:'skin'}));puppet(-.5,3.4,C('mother',{act:'sit',dir:1,t:T,pose:{ls:-.5,rs:.6,le:1,re:1,lean:.4}}));bush(-.5,4.4,1.5,3,'#c82040')})});
S(19.3,21.22,'gold',(u,t)=>{ // crane up: you are lost in the middle of a living camp
 cam([-4,1.6,-7],[-9,13,-17],[0,1.2,0],[0,.5,1],u,62,0,.5);
 world(MOODS.gold,{trees:130,mammoths:false},()=>{YOU(0,0,{act:'shrug',dir:1});
  [['elder',-5,3,1,'talk'],['hunter',6,4,-1,'walk'],['girl',-3.5,-4,1,'walk'],['mother',4.5,-4,-1,'idle'],['boy',2,5.6,-1,'run']].forEach(([k,X,Z,d,a],i)=>puppet(X+Math.sin(T*.5+i)*(a==='walk'||a==='run'?1.8:0),Z,C(k,{act:a,dir:d,ph:i,t:T})));fireP(-1.5,-5,1.2);smokeP(-1.5,1.2,-5)})});

// ================= SCENE 2 : thirsty, the river =================
S(21.22,23.45,'day',(u,t)=>{
 cam([1.6,1.5,-5.2],[1.0,1.6,6],[0,1.3,5],[0,1.2,16],u,62,.02,2.2);
 const wz=-.5+u*13;world(MOODS.day,{trees:110,mammoths:false},()=>{YOU(0,wz,{act:u<.72?'walk':'idle',dir:1,mode:u>.5?'worry':'smile',t:T});});
 slam('DAY 1',21.3,1.1,'#fff',H*.28,230);});
S(23.45,25.3,'day',(u,t)=>{ // low glide over the river
 cam([-6,.7,16.5],[5,.55,17.5],[0,.5,24],[8,.5,24],u,64,0,1.6);
 world(MOODS.day,{trees:90,mammoths:false},()=>{YOU(4,18.5,{act:'idle',dir:-1,look:-.6,mode:'worry',h:.95})});
 motes(30,'rgba(255,255,255,.8)',{R:9,sz:.03,up:.1,a:.5})});
S(25.3,27.0,'day',(u,t)=>{ // lens into the water
 cam([0,1.1,18.5],[0,.6,20.8],[0,0,23],[0,0,23],u,58,0,.8);
 world(MOODS.day,{trees:60,mammoths:false},()=>{});
 const r=ramp(T,25.4,25.8)*430;x.save();x.beginPath();x.arc(W/2,H*.4,r,0,7);x.clip();x.fillStyle='#1d6aa0';x.fillRect(0,0,W,H);
 for(let i=0;i<26;i++){const a=i*2.4,rx=W/2+Math.cos(a*1.7+T*.4)*300*Math.sin(i),ry=H*.4+Math.sin(a+T*.3)*300*Math.cos(i*.7);x.strokeStyle=i%3?'#9dff5a':'#ffd24a';x.lineWidth=9;x.lineCap='round';x.beginPath();for(let j=0;j<=12;j++){const px=rx+j*10,py=ry+Math.sin(j*.8+T*8+i)*12;j?x.lineTo(px,py):x.moveTo(px,py)}x.stroke();x.fillStyle='#ff5a5a';x.beginPath();x.arc(rx,ry,9,0,7);x.fill()}
 x.restore();x.strokeStyle='#fff';x.lineWidth=18;x.beginPath();x.arc(W/2,H*.4,r,0,7);x.stroke();x.lineWidth=28;x.lineCap='round';x.beginPath();x.moveTo(W/2+r*.7,H*.4+r*.7);x.lineTo(W/2+r*1.15,H*.4+r*1.15);x.stroke()});
S(27.0,28.9,'day',(u,t)=>{ // you know germs exist
 cam([-2.3,1.2,13],[-1.5,1.3,13.4],[0,1.0,18.5],[0,1.2,18.5],u,52,-.03,.8);
 world(MOODS.day,{trees:70,mammoths:false},()=>{YOU(0,18.4,{act:'drink',dir:1,mode:'worry',t:T});
  float3('germ',-.9,1.5,18.4,120,27.3,1.6);float3('germ',.8,1.9,18.4,100,27.6,1.3);float3('germ',0,2.5,18.4,140,27.9,1.0)})});
S(28.9,31.72,'day',(u,t)=>{ // can't filter, can't boil
 orbit([0,18.5],3.4,.5,-.5,1.3,1.1,u,.9,56,0,.8);
 world(MOODS.day,{trees:70,mammoths:false},()=>{YOU(0,18.5,{act:'shrug',dir:1,t:T,mode:'worry'});
  if(T>30.1){const k=back((T-30.1)/.3);add(0,18.5,(s)=>{x.translate(s*1.3,-s*2.1);x.scale(k*s/70,k*s/70);x.globalAlpha=.7;icon('pot',0,0,1,1);x.globalAlpha=1;icon('no',0,0,1.15,1)})}})});

// ================= SCENE 3 : fire =================
S(32.09,34.0,'day',(u,t)=>{
 cam([1.8,.45,-1.4],[.9,.5,-1.2],[0,.45,1],[0,.5,1],u,56,.04,1.6);
 world(MOODS.day,{trees:70,mammoths:false},()=>{YOU(0,1,{act:'rub',item:'sticks',dir:1,t:T,pose:{ls:-.7,rs:.75}});smokeP(.45,.15,1.35,5,'210,210,210')});
 motes(20,'rgba(255,255,255,.6)',{R:5,sz:.02,up:.1,a:.5})});
S(34.0,36.0,'day',(u,t)=>{
 orbit([0,1],3,.9,-.3,1.6,2.2,u,1.2,56,0,.8);
 world(MOODS.day,{trees:80,mammoths:false},()=>{YOU(0,1,{act:'rub',item:'sticks',dir:1,t:T,mode:'smile'});
  bubble(0,3.0,1,34.45,1.5,(s)=>{x.fillStyle='#1a1530';x.font='900 '+(s*.34)+'px Inter';x.textAlign='center';x.fillText('1000x',0,s*.1);})})});
S(36.0,40.0,'day',(u,t)=>{ // time-lapse of effort
 const m=moodMix('day','dusk',ramp(t,36.5,40.8));
 cam([3.8,2.4,-3.2],[1.6,1.5,-1.8],[0,.8,1],[0,.6,1],u,58,.02,1.2);
 world(m,{trees:90,mammoths:false},()=>{YOU(0,1,{act:'rub',item:'sticks',dir:1,t:T*(1+u*.8),mode:'brow'});smokeP(.5,.15,1.4,5,'190,190,190');
  if(T>38.7)float3('clock',-1,2.3,1,125,38.7,1.5);
  if(T>37.0)for(let i=0;i<3;i++){const k=((T*1.3+i/3)%1);add(.2,1,(s)=>{x.fillStyle=`rgba(120,200,255,${1-k})`;x.beginPath();x.arc(-.3*s+i*.15*s,-s*(1.9-k*.4),.045*s,0,7);x.fill()},0)}});
 const dim=cl((t-1)*.0);});
S(40.0,41.6,'dusk',(u,t)=>{ // failure: only smoke, you slump
 cam([-1.6,1.1,-1.2],[-.8,.9,-.6],[0,.7,1],[0,.7,1],u,54,-.04,1);
 world(moodMix('dusk','dusk',0),{trees:80,mammoths:false},()=>{YOU(0,1,{act:'slump',dir:1,t:T,mode:'worry'});smokeP(.4,.1,1.4,4,'120,120,130')});
 if(T>40.15){const k=back((T-40.15)/.25);x.save();x.translate(W/2,H*.3);x.scale(k,k);x.rotate(-.1);icon('no',0,0,2.2,1);x.restore()}});
S(41.6,43.4,'dusk',(u,t)=>{ // night is coming: tilt to the ridge, wolf
 const m=moodMix('dusk','night',ramp(t,.1,1.8));
 cam([0,1.5,-1],[0,1.5,-1],[-6,3.0,34],[-8.5,2.1,36],u,60,.0,.8);
 world(m,{trees:100,mammoths:false},()=>{YOU(1.6,3,{act:'slump',dir:1,mode:'worry',t:T});
  sprite(-9,40,.034,()=>wolf(0,0,1,'#2a3066','#ffe28a',-1))})});

// ================= SCENE 4 : food at night =================
S(43.4,45.7,'night',(u,t)=>{
 cam([-8,1.2,-1],[-1,1.1,2],[-3,.8,6],[2,.8,8],u,60,.04,1.6);
 world(MOODS.night,{trees:100,mammoths:false,g:{river:null}},()=>{for(let i=0;i<9;i++)bush(-3+i*1.6,6+(i%2)*1.3,1.5,i,'#ff5a7a');puppet(-5+u*5,2.2,C('you',{act:'walk',dir:1,mode:'worry',t:T,outfit:'#4f7cff'}))});
 motes(26,'rgba(255,240,160,.9)',{R:10,sz:.035,tw:1,a:.9,y0:.3,h:3})});
S(45.7,46.7,'night',(u,t)=>{
 cam([0,1.8,0],[0,1.0,3.5],[-.5,.8,6],[0,.7,7.7],u,52,.0,1.8,x=>x*x);
 world(MOODS.night,{trees:80,mammoths:false,g:{river:null}},()=>{for(let i=0;i<7;i++)bush(-3+i*1.5,7,1.5,i,i===3?'#ff3a3a':'#ff5a7a');float3('skull',.9,1.9,7.1,150,45.9,1.0)});
 motes(20,'rgba(255,240,160,.9)',{R:8,sz:.03,tw:1,a:.9,y0:.3,h:3})});
S(46.7,49.5,'night',(u,t)=>{ // all bushes look the same
 cam([0,1.4,0],[0,11,-5],[0,.6,12],[0,.2,14],u,62,0,.6);
 world(MOODS.night,{trees:100,mammoths:false,g:{river:null}},()=>{let n=0;for(let a=0;a<4;a++)for(let b=0;b<7;b++){const X=-6+b*2,Z=7+a*3.2;bush(X,Z,1.6,a*9+b,'#ff5a7a');if(T>47.2+n*.07)float3('q',X,1.9,Z,70,47.2+n*.07,1.4);n++}});
 motes(20,'rgba(255,240,160,.9)',{R:10,sz:.035,tw:1,a:.9,y0:.3,h:3})});
S(49.5,50.6,'night',(u,t)=>{ // one wrong berry
 cam([.1,1.55,-.8],[.1,1.5,-.35],[0,1.5,0],[0,1.5,0],u*u,40,.0,.5);
 world(MOODS.night,{trees:60,mammoths:false},()=>{YOU(0,0,{act:'idle',item:'berry',pose:{rs:2.3,re:1.9},mode:'worry',dir:1})});
 const hb=Math.sin((T-49.5)*18)>.8?.06:0;x.save();x.globalAlpha=hb*2;x.fillStyle='#ff2e4d';x.fillRect(0,0,W,H);x.restore()});
S(50.6,53.4,'night',(u,t)=>{ // lesson one, last lesson
 cam([-2.8,1.2,-2.5],[-2.0,.9,-1.8],[0,.9,0],[0,.4,0],u,56,u*.08,1.2);
 const dead=T>51.6;world(MOODS.night,{trees:70,mammoths:false},()=>{YOU(0,0,{act:dead?'lie':'idle',dir:1,mode:dead?'dizzy':'worry',item:null,t:T,eyesClosed:false});if(dead)float3('skull',0,1.4,0,130,51.9,1.2)});
 if(T>51.7){x.save();x.globalAlpha=ramp(T,51.7,52.4)*.7;x.fillStyle='#000';x.fillRect(0,0,W,H);x.restore()}
 slam('LESSON 1',51.0,1.6,'#fff',H*.28,170);});

// ================= SCENE 5 : the twist =================
S(53.4,55.0,'dawn',(u,t)=>{
 const k=ramp(t,.2,1.2);cam([5,3,-8],[-1,1.9,-5],[0,1,0],[0,1.2,0],u,66,.1*(1-u),1.8);
 world(MOODS.gold,{trees:100,mammoths:false},()=>{YOU(0,0,{act:'sit',mode:'worry',dir:1,t:T})});
 post({flash:Math.max(0,.9-(T-53.6)*2.2),speed:Math.max(0,.5-(T-53.7))});slam('TWIST',54.1,.95,'#ffd24a',H*.3,230)});
S(55.0,57.1,'gold',(u,t)=>{
 cam([-1.8,1.3,-3],[-.8,1.2,-1.8],[0,1.0,0],[0,1.4,0],u,52,-.03,1);
 world(MOODS.gold,{trees:80,mammoths:false},()=>{YOU(0,0,{act:'sit',mode:'smile',dir:1,t:T});float3('bulb',.2,2.0,0,160,55.4,1.7)})});
S(57.1,59.7,'gold',(u,t)=>{ // can't save you alone
 cam([-1.8,1.4,-3],[-8,16,-26],[0,1.1,0],[0,.5,8],u,60,0,.5);
 world(MOODS.gold,{trees:150,flowers:true},()=>{YOU(0,0,{act:'sit',mode:'worry',dir:1,t:T});if(T<58.1)float3('bulb',.2,2.0,0,160,55.4,3);else{x.globalAlpha=.8}})});
S(59.7,61.5,'gold',(u,t)=>{ // WHY
 orbit([0,0],4.6,-.5,-.1,1.5,2.0,u,1.6,58,0,.8);
 world(MOODS.gold,{trees:100,mammoths:false},()=>{YOU(0,0,{act:'idle',mode:'calm',dir:1});float3('brain',0,2.75,0,150,59.9,2.2);label3('WHY',0,3.5,0,'#ffd24a',60.0,.42)})});
S(61.5,64.03,'gold',(u,t)=>{ // HOW, not the same
 orbit([0,0],4.6,-.1,.5,1.7,2.0,u,1.6,58,0,.8);
 world(MOODS.gold,{trees:100,mammoths:false},()=>{YOU(0,0,{act:'rub',item:'sticks',mode:'brow',dir:1,t:T});float3('brain',-.9,2.45,0,110,59.9,5);label3('WHY',-.9,3.05,0,'#ffd24a',60.0,.3);float3('hand',.9,2.45,0,110,61.7,2.3);label3('HOW',.9,3.05,0,'#7dff9b',61.8,.3)});
 slam('\u2260',61.5,1.3,'#ff5a5a',H*.3,330)});

// ================= SCENE 6 : the group =================
function campRing(t,withYou){const L=[['elder',-2.2,.2,1],['hunter',2.2,.6,-1],['girl',-1.2,-2,1],['mother',1.4,-2.1,-1],['boy',0,2.4,1]];L.forEach(([k,X,Z,d],i)=>puppet(X,Z,C(k,{act:i%2?'talk':'sit',dir:d,ph:i,t:t,item:i===1?null:null})));if(withYou)YOU(-.3,-2.7,{act:'sit',dir:-1,mode:'smile',t:t});fireP(0,0,1.1);smokeP(0,1.2,0,8,'200,190,190')}
S(64.03,66.1,'dusk',(u,t)=>{
 cam([-10,1.8,-14],[-4,1.5,-8],[0,1.2,0],[0,1.2,0],u,60,0,1.4);
 world(MOODS.dusk,{trees:120,mammoths:false,g:{river:null}},()=>{campRing(T,false);});motes(30,'rgba(255,170,80,.9)',{R:7,sz:.03,up:.5,a:.9,tw:1,h:4})});
S(66.1,70.46,'warm',(u,t)=>{
 orbit([0,0],6,-.2,2.6,1.4,2.4,u,1.1,56,0,1);
 world(MOODS.warm,{trees:120,mammoths:false,g:{river:null}},()=>{campRing(T,true);
  float3('bulb',-1.6,2.0,-.2,120,67.8,1.5);float3('hand',.6,2.0,-.2,100,69.0,1.5);float3('bulb',1.2,2.0,.5,110,69.9,1.3)});
 motes(30,'rgba(255,170,80,.9)',{R:7,sz:.03,up:.5,a:.9,tw:1,h:4});
 x.save();glow(W/2,H*.62,700,'255,150,60',.14+.04*Math.sin(T*14));x.restore()});
S(70.46,71.2,'warm',(u,t)=>{cam([2,1.2,-6],[2,1.3,-5],[0,1.2,0],[0,1.4,0],u,60,0,1.2);world(MOODS.warm,{trees:90,mammoths:false,g:{river:null}},()=>{campRing(T,true)});motes(20,'rgba(255,170,80,.9)',{R:7,sz:.03,up:.5,a:.9,tw:1,h:4})});
S(71.2,73.2,'dusk',(u,t)=>{ // that's how humans always won: hunt a mammoth together
 cam([-4,.5,-8],[3,1.0,-6],[0,3,14],[0,3.4,14],u,64,-.03,1.6);
 world(MOODS.dusk,{trees:80,mammoths:false,g:{river:null}},()=>{sprite(0,13,.024,()=>mammoth(0,0,1,mix('#5a4636',M.fog,.1),'#efe3c8',T*3));
  [[-3,7],[0,5.5],[3,7.5],[-1.5,4],[1.5,4.2]].forEach(([X,Z],i)=>puppet(X,Z,C(i%2?'hunter':'elder',{act:'run',dir:i%2?-1:1,t:T,ph:i,item:'spear',mode:'stern'})))})});
S(73.2,75.42,'warm',(u,t)=>{ // together: crane up over the circle
 cam([-5,1.5,-6],[-1,20,-3],[0,1,0],[0,0,0],u,62,0,.4);
 world(MOODS.warm,{trees:120,mammoths:false,g:{river:null}},()=>{campRing(T,true)});
 motes(26,'rgba(255,170,80,.9)',{R:9,sz:.04,up:.5,a:.9,tw:1,h:8})});

// ================= SCENE 7 : the question =================
S(75.42,78.8,'gold',(u,t)=>{
 cam([.3,1.6,-2.4],[.1,1.65,-1.7],[0,1.6,0],[0,1.65,0],u,44,0,.8);
 world(MOODS.gold,{trees:80,mammoths:false},()=>{YOU(0,0,{act:'idle',mode:'calm',dir:1,hr:.3,h:1.05});});motes(26,'rgba(255,230,160,.8)',{R:5,sz:.02,up:.1,a:.7})});
S(78.8,82.55,'gold',(u,t)=>{
 orbit([0,3],4.6,-.7,.4,.9,1.4,u,1.3,62,.0,1);
 world(MOODS.gold,{trees:100,mammoths:false},()=>{YOU(-.8,3,{act:T>81?'give':'idle',mode:'calm',dir:1,t:T});puppet(.8,3,C('hunter',{act:'idle',dir:-1,mode:'stern',t:T,look:-.4}))})});
S(82.55,84.4,'gold',(u,t)=>{
 cam([0,1.5,-.2],[0,1.5,.9],[0,1.5,3],[.3,1.55,3],u,50,0,.5);
 world(MOODS.gold,{trees:80,mammoths:false},()=>{YOU(-.6,3,{act:'give',mode:'calm',dir:1,t:T});puppet(.6,3,C('hunter',{act:'idle',dir:-1,mode:'brow',t:T,look:-.4}))});
 const f=ramp(T,83.4,84.0);x.fillStyle=`rgba(8,4,24,${f})`;x.fillRect(0,0,W,H);
 if(f>0){x.save();x.globalAlpha=ramp(T,83.6,84.1);x.font='900 120px Inter';x.textAlign='center';x.fillStyle='#fff';x.fillText('THESIS',W/2,H/2+30);x.restore()}});

function renderAt(t){x.reset();T=t;const sh=SH.find(s=>t>=s.a&&t<s.b)||SH[SH.length-1];const u=cl((t-sh.a)/(sh.b-sh.a));
 sh.fn(u,t-sh.a);x.setTransform(1,0,0,1,0,0);x.globalAlpha=1;x.shadowBlur=0;post({});
 // a quick white punch at every cut keeps energy
 const dc=t-sh.a;if(dc<.1&&sh.a>0.5){x.fillStyle=`rgba(255,255,255,${(.1-dc)*1.5})`;x.fillRect(0,0,W,H)}
 drawCaption(t)}
