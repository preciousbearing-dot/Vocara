// ===== pseudo-3D engine on Canvas2D: perspective camera, ground, billboards, fog layers =====
const CAM3={x:0,y:1.6,z:-8,yaw:0,pitch:0,roll:0,fov:62};
let FOC=1500,HY=H/2,CAMSCALE=1;
function setCam(c){Object.assign(CAM3,c);FOC=(H/2)/Math.tan(CAM3.fov*Math.PI/360);HY=H/2+FOC*Math.tan(CAM3.pitch)}
function toCam(X,Y,Z){const dx=X-CAM3.x,dy=Y-CAM3.y,dz=Z-CAM3.z;const cy=Math.cos(CAM3.yaw),sy=Math.sin(CAM3.yaw);
 const x1=dx*cy-dz*sy,z1=dx*sy+dz*cy;const cp=Math.cos(CAM3.pitch),sp=Math.sin(CAM3.pitch);
 return[x1,dy*cp-z1*sp,dy*sp+z1*cp]}
function proj(X,Y,Z){const p=toCam(X,Y,Z);if(p[2]<.25)return null;const s=FOC/p[2];return{x:W/2+p[0]*s,y:H/2-p[1]*s,s,z:p[2]}}
function lookAt(from,to){const dx=to[0]-from[0],dy=to[1]-from[1],dz=to[2]-from[2];return{yaw:Math.atan2(dx,dz),pitch:Math.atan2(dy,Math.hypot(dx,dz))}}
const lerp=(a,b,k)=>a+(b-a)*k;
const lerpA=(a,b,k)=>a.map((v,i)=>lerp(v,b[i],k));
function shot(from,to,at,fov,roll,shake=1){ // camera at 'from' looking at 'at' (+handheld)
 const l=lookAt(from,at);const t=T,sh=shake;
 setCam({x:from[0]+Math.sin(t*1.7)*.025*sh,y:from[1]+Math.sin(t*2.3+1)*.02*sh,z:from[2],yaw:l.yaw+Math.sin(t*1.3)*.004*sh+Math.sin(t*3.1)*.0015*sh,pitch:l.pitch+Math.sin(t*1.9+2)*.004*sh,roll:(roll||0)+Math.sin(t*1.1)*.003*sh,fov});
}
// ---------- moods ----------
const MOODS={
 dawn:{sky:['#4b3d94','#e2788f','#ffc58f'],gnd:['#7b9a55','#5d8744'],fog:'#f4b79a',fa:.55,sun:[.25,.10,'#fff1c4'],tint:'rgba(255,150,90,.10)',leaf:'#3f7d4a',leaf2:'#58a05a',mnt:['#a4809f','#8a6f94'],rock:'#8d8579',dark:0},
 day:{sky:['#2f86d8','#7fc6ee','#e4f4ff'],gnd:['#7ab84e','#4f9a3e'],fog:'#cfe9ff',fa:.45,sun:[-.35,.55,'#fffbe0'],tint:'rgba(255,230,160,.05)',leaf:'#2f8a47',leaf2:'#53b25a',mnt:['#8aa9c8','#7295b8'],rock:'#9a9488',dark:0},
 gold:{sky:['#3a3f8f','#f2828a','#ffd08a'],gnd:['#8aa04c','#5f8541'],fog:'#ffc48e',fa:.5,sun:[.1,.07,'#fff0c0'],tint:'rgba(255,160,70,.14)',leaf:'#3d7a40',leaf2:'#6a9f4d',mnt:['#b88a98','#9a7392'],rock:'#9a8878',dark:0},
 dusk:{sky:['#1c1745','#a43f70','#ff9a62'],gnd:['#587a45','#3f6a44'],fog:'#c0587a',fa:.55,sun:[.3,.03,'#ffb066'],tint:'rgba(180,70,120,.16)',leaf:'#2f5a44',leaf2:'#417a52',mnt:['#6a4a8a','#58407d'],rock:'#6a5f6e',dark:.18},
 night:{sky:['#040616','#0f1a45','#24366f'],gnd:['#1e3f44','#122d38'],fog:'#16254f',fa:.6,sun:[-.4,.5,'#dce6ff'],tint:'rgba(20,40,120,.22)',leaf:'#173c42',leaf2:'#245358',mnt:['#16224f','#101a40'],rock:'#34405e',dark:.45,moon:1,stars:1},
 warm:{sky:['#1a1038','#8a2f5e','#ff8f4d'],gnd:['#4a6a3e','#2e5238'],fog:'#c35a55',fa:.5,sun:[.5,-.3,'#ffb066'],tint:'rgba(255,120,50,.18)',leaf:'#2b4c3b',leaf2:'#3a6a47',mnt:['#5a3a74','#45306a'],rock:'#6a5a60',dark:.25}
};
function moodMix(a,b,k){if(k<=0)return MOODS[a];if(k>=1)return MOODS[b];const A=MOODS[a],B=MOODS[b];const m=(p,q)=>mix(p,q,k);
 return{sky:A.sky.map((v,i)=>m(v,B.sky[i])),gnd:A.gnd.map((v,i)=>m(v,B.gnd[i])),fog:m(A.fog,B.fog),fa:lerp(A.fa,B.fa,k),sun:[lerp(A.sun[0],B.sun[0],k),lerp(A.sun[1],B.sun[1],k),m(A.sun[2],B.sun[2])],tint:k<.5?A.tint:B.tint,leaf:m(A.leaf,B.leaf),leaf2:m(A.leaf2,B.leaf2),mnt:A.mnt.map((v,i)=>m(v,B.mnt[i])),rock:m(A.rock,B.rock),dark:lerp(A.dark,B.dark,k),moon:B.moon&&k>.5?1:0,stars:(A.stars?1-k:0)+(B.stars?k:0)}}
let M=MOODS.day,SPR=[];
const rgba=(hex,a)=>{const p=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16));return`rgba(${p},${a})`};
// ---------- sky ----------
function drawSky(){
 const top=Math.min(HY,H+400);x.save();
 let g=x.createLinearGradient(0,HY-H*1.2,0,HY+40);g.addColorStop(0,M.sky[0]);g.addColorStop(.55,M.sky[1]);g.addColorStop(1,M.sky[2]);x.fillStyle=g;x.fillRect(-W,-H,W*3,H*3);
 if(M.stars){const r=prng(11);for(let i=0;i<150;i++){const az=r()*6.28,el=.05+r()*.9;const dx=((az-CAM3.yaw+9.42)%6.283)-3.14;if(Math.abs(dx)>1.2)continue;const sx=W/2+FOC*Math.tan(dx),sy=HY-FOC*Math.tan(el)*.9;const tw=.5+.5*Math.sin(T*2+i);x.fillStyle=`rgba(255,255,255,${(.3+r()*.6)*tw*M.stars})`;x.beginPath();x.arc(sx,sy,1+r()*2.2,0,7);x.fill()}}
 // sun / moon
 const sdx=M.sun[0]-CAM3.yaw;if(Math.abs(sdx)<1.3){const sx=W/2+FOC*Math.tan(sdx),sy=HY-FOC*Math.tan(M.sun[1]);const R=M.moon?60:90;glow(sx,sy,R*5,M.moon?'200,220,255':'255,220,160',M.moon?.35:.55);x.fillStyle=M.sun[2];x.beginPath();x.arc(sx,sy,R,0,7);x.fill();if(M.moon){x.fillStyle=rgba(M.sky[1],.35);x.beginPath();x.arc(sx+18,sy-8,18,0,7);x.arc(sx-20,sy+22,12,0,7);x.fill()}}
 // clouds
 const r=prng(21);for(let i=0;i<9;i++){const az=r()*6.28+T*.004,el=.12+r()*.35,sc=.7+r()*.9;const dx=((az-CAM3.yaw+9.42)%6.283)-3.14;if(Math.abs(dx)>1.25)continue;const sx=W/2+FOC*Math.tan(dx),sy=HY-FOC*Math.tan(el),w=220*sc*FOC/1500;
  x.fillStyle=M.dark>.3?rgba('#2a3a7a',.35):rgba(mix('#ffffff',M.sky[2],.35),.55);x.beginPath();x.ellipse(sx,sy,w,w*.2,0,0,7);x.ellipse(sx-w*.4,sy+w*.06,w*.55,w*.17,0,0,7);x.ellipse(sx+w*.45,sy+w*.07,w*.6,w*.16,0,0,7);x.fill()}
 // mountains (angular parallax)
 [[0,.16,.0022,3],[1,.09,.004,8]].forEach(([li,hh,fr,sd])=>{x.fillStyle=M.mnt[li];x.beginPath();x.moveTo(-100,HY+60);for(let sx=-100;sx<=W+100;sx+=18){const a=CAM3.yaw+Math.atan((sx-W/2)/FOC);const n=Math.sin(a*7+sd)*.5+Math.sin(a*17+sd*2)*.28+Math.sin(a*41+sd)*.1+.6;x.lineTo(sx,HY-n*hh*FOC*1.0)}x.lineTo(W+100,HY+60);x.fill();
  x.fillStyle=rgba(M.fog,.35+li*.15);x.fillRect(-100,HY-hh*FOC*1.2,W+200,hh*FOC*1.2+60)});
 x.restore()}
// ---------- ground ----------
function poly3(pts,fill){const P=pts.map(p=>toCam(p[0],p[1],p[2])),N=.25,out=[];
 for(let i=0;i<P.length;i++){const a=P[i],b=P[(i+1)%P.length],ai=a[2]>N,bi=b[2]>N;if(ai)out.push(a);if(ai!==bi){const t=(N-a[2])/(b[2]-a[2]);out.push([a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,N])}}
 if(out.length<3)return;x.beginPath();out.forEach((p,i)=>{const sx=W/2+FOC*p[0]/p[2],sy=H/2-FOC*p[1]/p[2];i?x.lineTo(sx,sy):x.moveTo(sx,sy)});x.closePath();x.fillStyle=fill;x.fill()}
function ribbon(path,w,fill,y=0,wob=0){for(let i=0;i<path.length-1;i++){const a=path[i],b=path[i+1];const dx=b[0]-a[0],dz=b[1]-a[1],L=Math.hypot(dx,dz)||1,nx=-dz/L,nz=dx/L;const wa=typeof w==='function'?w(i):w,wb=typeof w==='function'?w(i+1):w;
  poly3([[a[0]+nx*wa,y,a[1]+nz*wa],[b[0]+nx*wb,y,b[1]+nz*wb],[b[0]-nx*wb,y,b[1]-nz*wb],[a[0]-nx*wa,y,a[1]-nz*wa]],fill)}}
function drawGround(o={}){
 const g=x.createLinearGradient(0,HY,0,HY+H*.9);g.addColorStop(0,mix(M.gnd[0],M.fog,.55));g.addColorStop(.35,M.gnd[0]);g.addColorStop(1,M.gnd[1]);x.fillStyle=g;x.fillRect(-W,HY-2,W*3,H*3);
 // alternating grass bands (strong motion cue)
 const cz=CAM3.z,cx=CAM3.x,S=o.band||5;const base=M.gnd[0],alt=mix(M.gnd[0],M.gnd[1],.55);
 const a0=Math.floor((cz-30)/S)*S;
 for(let zz=a0;zz<cz+260;zz+=S){if(Math.round(zz/S)%2)continue;poly3([[cx-400,0,zz],[cx+400,0,zz],[cx+400,0,zz+S],[cx-400,0,zz+S]],rgba(alt,.55))}
 // soft light patches
 const rr=prng(77);for(let i=0;i<40;i++){const X=cx+(rr()-.5)*220,Z=cz+rr()*140,r=2+rr()*7;poly3([[X-r,0,Z-r*.5],[X+r,0,Z-r*.5],[X+r,0,Z+r*.5],[X-r,0,Z+r*.5]],rgba(mix(M.gnd[0],'#ffffff',.12),.18))}
 if(o.paths)o.paths.forEach(p=>ribbon(p.pts,p.w,p.col,.01));
 if(o.river){const R=o.river;ribbon(R.pts,R.w+.9,mix(M.gnd[0],'#c9b27a',.55),.015);ribbon(R.pts,R.w,mix('#2d7fb8',M.fog,.18),.02);
  // flowing highlights
  for(let i=0;i<R.pts.length-1;i++){const a=R.pts[i],b=R.pts[i+1];for(let k=0;k<7;k++){const f=((T*.08+k/7+i*.37)%1),X=lerp(a[0],b[0],f),Z=lerp(a[1],b[1],f)+((k*53+i*17)%100/100-.5)*R.w*1.4,ll=1.2+k%3;poly3([[X,.03,Z],[X+ll,.03,Z+.05],[X+ll,.03,Z+.12],[X,.03,Z+.07]],'rgba(255,255,255,.35)')}}}}
// ---------- sprites ----------
function add(X,Z,fn,Y=0){const p=proj(X,Y,Z);if(!p)return;if(p.x<-p.s*14||p.x>W+p.s*14)return;SPR.push({z:p.z,p,fn,X,Z})}
function addFog(z,a){SPR.push({z,fog:a})}
function flushSprites(){SPR.sort((a,b)=>b.z-a.z);
 SPR.forEach(s=>{if(s.fog!==undefined){const a=s.fog*M.fa;const g=x.createLinearGradient(0,HY-H*.5,0,HY+H*.8);g.addColorStop(0,rgba(M.fog,0));g.addColorStop(.5,rgba(M.fog,a));g.addColorStop(.62,rgba(M.fog,a*.8));g.addColorStop(1,rgba(M.fog,a*.15));x.fillStyle=g;x.fillRect(-W,-H,W*3,H*3);return}
  x.save();x.translate(s.p.x,s.p.y);s.fn(s.p.s,s.p);x.restore()});SPR=[]}
function shadow(s,r,a=.3){const p=Math.max(.06,Math.min(1,CAM3.y/Math.max(1,Math.hypot(0,0)+8)));x.fillStyle=`rgba(10,10,30,${a})`;x.beginPath();x.ellipse(0,0,r*s,r*s*(.16+.1*Math.min(1,CAM3.y/4)),0,0,7);x.fill()}
// props (meter units, scale s px/m). colours from mood.
function tree(X,Z,h,sd,kind){add(X,Z,(s)=>{const r=prng(sd);const sw=Math.sin(T*.9+sd)*.06*h;shadow(s,h*.28,.22);x.save();x.scale(s,s);
  if(kind==='pine'){x.fillStyle='#4a3326';x.fillRect(-.12*h/5,-h*.25,.24*h/5,h*.25);const cols=[mix(M.leaf,'#000000',.15),M.leaf,M.leaf2];for(let i=0;i<4;i++){const yy=-h*.2-i*h*.2,ww=h*.34*(1-i*.2);x.fillStyle=cols[i%3];x.beginPath();x.moveTo(-ww+sw*i*.4,yy);x.lineTo(sw*i*.6+sw,yy-h*.3);x.lineTo(ww+sw*i*.4,yy);x.fill();x.fillStyle='rgba(0,0,0,.14)';x.beginPath();x.moveTo(sw*i*.6+sw,yy-h*.3);x.lineTo(ww+sw*i*.4,yy);x.lineTo(sw*i*.2,yy);x.fill()}}
  else{const tw=.18*h/5;x.fillStyle='#5a3d2b';x.beginPath();x.moveTo(-tw,0);x.quadraticCurveTo(-tw*.5,-h*.3,-tw*.55,-h*.5);x.lineTo(tw*.55,-h*.5);x.quadraticCurveTo(tw*.5,-h*.3,tw,0);x.fill();x.fillStyle='rgba(0,0,0,.18)';x.beginPath();x.moveTo(0,0);x.quadraticCurveTo(tw*.5,-h*.3,tw*.55,-h*.5);x.lineTo(tw,-h*.5);x.quadraticCurveTo(tw*1.1,-h*.3,tw,0);x.fill();
   const blobs=[[0,-.72,.34],[-.25,-.6,.27],[.26,-.62,.28],[-.1,-.9,.26],[.18,-.86,.24]];x.fillStyle=mix(M.leaf,'#000000',.2);blobs.forEach(([bx,by,br])=>{x.beginPath();x.arc(bx*h+sw,by*h,br*h,0,7);x.fill()});x.fillStyle=M.leaf;blobs.forEach(([bx,by,br])=>{x.beginPath();x.arc(bx*h+sw-.02*h,by*h-.02*h,br*h*.88,0,7);x.fill()});x.fillStyle=M.leaf2;blobs.slice(0,3).forEach(([bx,by,br],i)=>{x.beginPath();x.arc(bx*h+sw-.07*h,by*h-.08*h,br*h*.5,0,7);x.fill()})}
  x.restore()})}
function rockP(X,Z,w,sd){add(X,Z,(s)=>{shadow(s,w*.6,.25);x.save();x.scale(s,s);const r=prng(sd);x.fillStyle=mix(M.rock,'#000',.22);x.beginPath();x.moveTo(-w*.5,0);x.lineTo(-w*.42,-w*.55);x.lineTo(-w*.1,-w*.8);x.lineTo(w*.3,-w*.62);x.lineTo(w*.5,0);x.fill();x.fillStyle=M.rock;x.beginPath();x.moveTo(-w*.5,0);x.lineTo(-w*.42,-w*.55);x.lineTo(-w*.1,-w*.8);x.lineTo(w*.05,-w*.3);x.lineTo(-w*.1,0);x.fill();x.fillStyle='rgba(255,255,255,.12)';x.beginPath();x.moveTo(-w*.42,-w*.55);x.lineTo(-w*.1,-w*.8);x.lineTo(-w*.05,-w*.6);x.fill();x.restore()})}
function bush(X,Z,w,sd,berries){add(X,Z,(s)=>{shadow(s,w*.55,.22);x.save();x.scale(s,s);x.fillStyle=mix(M.leaf,'#000',.18);[[-.3,-.3,.32],[0,-.42,.4],[.3,-.3,.32],[.05,-.2,.34]].forEach(([a,b,r])=>{x.beginPath();x.arc(a*w,b*w,r*w,0,7);x.fill()});x.fillStyle=M.leaf2;[[-.3,-.34,.26],[0,-.48,.32],[.3,-.34,.26]].forEach(([a,b,r])=>{x.beginPath();x.arc(a*w-.03*w,b*w-.04*w,r*w,0,7);x.fill()});
  if(berries){const r=prng(sd);for(let i=0;i<7;i++){x.fillStyle=berries;x.beginPath();x.arc((r()-.5)*w*.8,-.15*w-r()*w*.5,.055*w,0,7);x.fill();x.fillStyle='rgba(255,255,255,.55)';x.beginPath();x.arc((r()-.5)*0,0,0,0,7);x.fill()}}x.restore()})}
function reeds(X,Z,n,sd){add(X,Z,(s)=>{const r=prng(sd);x.strokeStyle=mix(M.leaf2,'#c9c27a',.3);x.lineWidth=Math.max(1.5,.04*s);x.lineCap='round';for(let i=0;i<n;i++){const a=(r()-.5)*1.2,hh=(.7+r()*.9)*s,b=(r()-.5)*.9*s,sw=Math.sin(T*1.5+i+sd)*.07*hh;x.beginPath();x.moveTo(b,0);x.quadraticCurveTo(b+a*hh*.3+sw,-hh*.5,b+a*hh*.5+sw*2,-hh);x.stroke()}})}
function tuftP(X,Z,sd){add(X,Z,(s)=>{x.strokeStyle=mix(M.leaf2,M.gnd[0],.2);x.lineWidth=Math.max(1,.03*s);x.lineCap='round';const r=prng(sd);for(let i=0;i<5;i++){const a=(i-2)*.28+(r()-.5)*.1;x.beginPath();x.moveTo((i-2)*.05*s,0);x.lineTo((i-2)*.05*s+Math.sin(a)*.4*s+Math.sin(T*2+sd+i)*.02*s,-Math.cos(a)*.35*s);x.stroke()}})}
function scatter(o){ // deterministic ground clutter around camera so motion always reads
 const CELL=o.cell||5,R=o.r||55,cx=Math.floor(CAM3.x/CELL),cz=Math.floor(CAM3.z/CELL),n=Math.ceil(R/CELL);
 for(let i=-n;i<=n;i++)for(let j=-n;j<=n;j++){const gx=cx+i,gz=cz+j;const h=Math.sin(gx*127.1+gz*311.7)*43758.5453;const f=h-Math.floor(h);if(f>(o.p||.7))continue;const X=gx*CELL+f*CELL*1.3%CELL,Z=gz*CELL+(f*977%1)*CELL;
  if(o.skip&&o.skip(X,Z))continue;const k=(f*1000)%1;if(k<.55)tuftP(X,Z,gx*7+gz);else if(k<.8&&o.stones!==false)rockP(X,Z,.25+k*.5,gx+gz*3);else if(o.flowers)add(X,Z,(s)=>{x.fillStyle=['#ffd24a','#ff7a9a','#fff'][(gx+gz)&1?0:2];x.beginPath();x.arc(0,-.18*s,.07*s,0,7);x.fill();x.strokeStyle=M.leaf2;x.lineWidth=2;x.beginPath();x.moveTo(0,0);x.lineTo(0,-.18*s);x.stroke()})}}
// motes: dust, pollen, embers, fireflies floating through the frame
function motes(n,col,o={}){const R=o.R||9,sp=o.sp||.15,sz=o.sz||.03,up=o.up||0;
 for(let i=0;i<n;i++){const a=(Math.sin(i*12.9898)*43758.5453)%1,b=(Math.sin(i*78.233)*43758.5453)%1,c=(Math.sin(i*37.719)*43758.5453)%1;const fa=Math.abs(a),fb=Math.abs(b),fc=Math.abs(c);
  const X=CAM3.x+((fa*2*R+T*sp*(fb-.3)+i)%(2*R))-R,Y=(o.y0||.3)+((fb*(o.h||5)+T*up*(.5+fc))%(o.h||5)),Z=CAM3.z+((fc*2*R+T*sp*.5)%(2*R))-R*.4;
  const p=proj(X,Y,Z);if(!p||p.x<0||p.x>W||p.y<0||p.y>H)continue;const tw=o.tw?(.5+.5*Math.sin(T*3+i*1.7)):1;x.globalAlpha=(o.a||.6)*tw*Math.min(1,p.z/3);x.fillStyle=col;x.beginPath();x.arc(p.x,p.y,Math.max(1,sz*p.s),0,7);x.fill()}x.globalAlpha=1}
// ---------- puppet (flat noodle-limb character, billboard in the world) ----------
const POSE0={ls:.12,le:.1,rs:-.12,re:.1,lh:0,lk:0,rh:0,rk:0,lean:0,bob:0,crouch:0,tilt:0,mode:'smile'};
function poseFor(act,t,ph){const w=t*7+ph,c=Math.sin(w),p=Object.assign({},POSE0);const br=Math.sin(t*2.2+ph)*.012;p.bob=br;
 if(act==='walk'||act==='run'){const A=act==='run'?.95:.55,sw=act==='run'?1.1:.6,sp=act==='run'?1.55:1;const w2=t*7*sp+ph,c2=Math.sin(w2);p.lh=A*c2;p.rh=-A*c2;p.lk=Math.max(0,-Math.cos(w2))*(act==='run'?1.5:.9);p.rk=Math.max(0,Math.cos(w2))*(act==='run'?1.5:.9);p.ls=-sw*c2;p.rs=sw*c2;p.le=.4+.3*(act==='run');p.re=.4+.3*(act==='run');p.bob=Math.abs(Math.sin(w2))*(act==='run'?.09:.04);p.lean=act==='run'?.22:.05}
 else if(act==='sneak'){p.lh=.25*c;p.rh=-.25*c;p.lk=.7;p.rk=.7;p.crouch=.2;p.lean=.3;p.ls=.5;p.rs=-.5;p.le=.6;p.re=.6}
 else if(act==='scared'){p.ls=-2.6+Math.sin(t*30)*.08;p.rs=2.6-Math.sin(t*30)*.08;p.le=.8;p.re=.8;p.lk=.5+Math.sin(t*28)*.1;p.rk=.5-Math.sin(t*28)*.1;p.crouch=.12;p.mode='shock';p.lean=-.08}
 else if(act==='cheer'){p.ls=-2.9+Math.sin(w*1.3)*.25;p.rs=2.9-Math.sin(w*1.3)*.25;p.le=.2;p.re=.2;p.bob=Math.abs(Math.sin(w))*.09;p.mode='laugh'}
 else if(act==='point'){p.rs=1.55;p.re=0;p.ls=.1;p.mode='smile'}
 else if(act==='shrug'){p.ls=-.9;p.rs=.9;p.le=1.2;p.re=1.2;p.tilt=.12*Math.sin(t*3);p.mode='worry'}
 else if(act==='rub'){const r=Math.sin(t*16);p.ls=-.7+.2*r;p.rs=.7-.2*r;p.le=1.5;p.re=1.5;p.crouch=.4;p.lk=1.3;p.rk=1.3;p.lh=1.1;p.rh=1.1;p.lean=.45;p.mode='brow'}
 else if(act==='sit'){p.lh=1.4;p.rh=1.4;p.lk=1.5;p.rk=1.5;p.crouch=.4;p.ls=.3;p.rs=-.3}
 else if(act==='slump'){p.lean=.5;p.ls=.25;p.rs=-.25;p.le=.2;p.re=.2;p.crouch=.32;p.lk=1.2;p.rk=1.2;p.lh=1.1;p.rh=1.1;p.mode='worry'}
 else if(act==='lie'){}
 else if(act==='talk'){p.rs=-1.0+Math.sin(t*5+ph)*.25;p.re=.9;p.ls=.15;p.mode='smile'}
 else if(act==='give'){p.rs=-1.5;p.re=.1;p.ls=.2;p.mode='smile'}
 else if(act==='drink'){p.crouch=.4;p.lk=1.3;p.rk=1.3;p.lh=1.1;p.rh=1.1;p.ls=-.6;p.rs=.6;p.le=1.8;p.re=1.8;p.lean=.4}
 return p}
const LOOK={skin:'#b87a52',hair:'short',hairCol:'#1a1210',outfit:'#6b8fd6',pants:'#2e3d6a',trim:'#e6edf7',shoe:'#f3f3f3',h:1,dir:1,beard:false,item:null,mode:null,modern:false,hr:.27,fur:false};
function puppet(X,Z,o){o=Object.assign({},LOOK,o);const act=o.act||'idle',t=o.t===undefined?T:o.t;
 add(X,Z,(s)=>{const P=poseFor(act,t,o.ph||0);if(o.mode)P.mode=o.mode;Object.assign(P,o.pose||{});const k=s*o.h,d=o.dir;
  shadow(s,.5*o.h,.3);x.save();x.scale(k*d,k);
  const LW=.095,TH=.38,SH=.38,hipY=-(TH+SH)+P.crouch*0+(act==='sit'||act==='slump'||act==='rub'||act==='drink'?0:0);
  const lie=act==='lie';if(lie){x.rotate(-Math.PI/2*.97);x.translate(.2,-.25)}
  const bob=P.bob;const hy=-(TH+SH)*(1-P.crouch*.9)-bob;
  const limb=(ax,ay,a1,a2,l1,l2,col,w)=>{const x1=ax+Math.sin(a1)*l1,y1=ay+Math.cos(a1)*l1;const a2t=a1-a2;const x2=x1+Math.sin(a2t)*l2,y2=y1+Math.cos(a2t)*l2;x.strokeStyle=col;x.lineWidth=w;x.lineCap='round';x.lineJoin='round';x.beginPath();x.moveTo(ax,ay);x.lineTo(x1,y1);x.lineTo(x2,y2);x.stroke();return[x2,y2]};
  const shy=hy-.5,shx=0; // shoulder height
  // legs (knee bends backward)
  const legCol=o.pants||o.skin;const hipW=.1;
  const legs=[[-hipW,P.lh,P.lk],[hipW,P.rh,P.rk]].map(([hx,a,kb])=>{const e=limb(hx,hy,a,kb,TH,SH,legCol,LW*1.25);const gy=Math.min(0,e[1]);return e});
  legs.forEach(([fx,fy])=>{x.fillStyle=o.shoe||o.skin;x.beginPath();x.ellipse(fx+.04,fy-.01,.085,.05,0,0,7);x.fill()});
  // torso
  const lx=Math.sin(P.lean)*.5;x.save();x.translate(0,hy);x.rotate(P.lean);const tw=.2,tl=.5;
  x.fillStyle=o.outfit;x.beginPath();x.moveTo(-tw,-tl);x.quadraticCurveTo(-tw-.04,-tl*.5,-tw*.78,0);x.lineTo(tw*.78,0);x.quadraticCurveTo(tw+.04,-tl*.5,tw,-tl);x.quadraticCurveTo(0,-tl-.06,-tw,-tl);x.fill();
  x.fillStyle='rgba(0,0,0,.14)';x.beginPath();x.moveTo(tw*.15,-tl);x.lineTo(tw,-tl);x.quadraticCurveTo(tw+.04,-tl*.5,tw*.78,0);x.lineTo(tw*.2,0);x.fill();
  if(o.fur){x.fillStyle=o.outfit;x.beginPath();x.moveTo(-tw*.8,-.02);for(let i=0;i<7;i++){x.lineTo(-tw*.8+i*tw*1.6/6+.02,.1+(i%2)*.07)}x.lineTo(tw*.8,-.02);x.fill();x.strokeStyle=o.trim;x.lineWidth=.035;x.beginPath();x.moveTo(-tw*.5,-tl+.05);x.lineTo(tw*.6,-.08);x.stroke()}
  if(o.modern){x.fillStyle=o.trim;x.fillRect(-.03,-tl+.03,.06,.2);x.fillStyle='rgba(255,255,255,.18)';x.beginPath();x.roundRect(-.12,-.2,.24,.12,.04);x.fill()}
  // arms
  const sh=-tl+.06;const armCol=o.modern?o.outfit:o.skin;
  const hands=[[-tw*.9,P.ls,P.le],[tw*.9,P.rs,P.re]].map(([ax,a,eb],ii)=>{const A1=a;const e=limb(ax,sh,A1,(ii?-eb:eb),.32,.3,armCol,LW);x.fillStyle=o.skin;x.beginPath();x.arc(e[0],e[1],.058,0,7);x.fill();return e});
  if(o.item==='spear'){const hnd=hands[1];x.strokeStyle='#6a4a30';x.lineWidth=.045;x.beginPath();x.moveTo(hnd[0]+.02,hnd[1]+.9);x.lineTo(hnd[0]-.02,hnd[1]-1.25);x.stroke();x.fillStyle='#c9c9d6';x.beginPath();x.moveTo(hnd[0]-.02,hnd[1]-1.6);x.lineTo(hnd[0]-.07,hnd[1]-1.2);x.lineTo(hnd[0]+.03,hnd[1]-1.2);x.fill()}
  if(o.item==='phone'){const hnd=hands[1];x.fillStyle='#10101c';x.beginPath();x.roundRect(hnd[0]-.06,hnd[1]-.16,.12,.2,.025);x.fill();x.fillStyle='#3de0d0';x.beginPath();x.roundRect(hnd[0]-.045,hnd[1]-.14,.09,.15,.015);x.fill()}
  if(o.item==='berry'){const hnd=hands[1];x.fillStyle='#d6203f';x.beginPath();x.arc(hnd[0],hnd[1]-.06,.055,0,7);x.fill();x.fillStyle='rgba(255,255,255,.6)';x.beginPath();x.arc(hnd[0]-.02,hnd[1]-.08,.015,0,7);x.fill()}
  if(o.item==='sticks'){const hnd=hands[0];x.strokeStyle='#7a5a38';x.lineWidth=.04;x.beginPath();x.moveTo(hnd[0]-.2,hnd[1]+.1);x.lineTo(hnd[0]+.25,hnd[1]+.35);x.stroke()}
  if(o.item==='skin'){const hnd=hands[0];x.fillStyle='#b8865a';x.beginPath();x.ellipse(hnd[0],hnd[1]+.08,.1,.14,0,0,7);x.fill()}
  // head
  x.save();x.translate(0,-tl-.1);x.rotate(P.tilt-P.lean*.6);x.translate(0,-o.hr*.82);const f=o.hr/56;x.scale(f,f);
  x.fillStyle=o.skin;x.beginPath();x.arc(0,0,56,0,7);x.fill();x.fillStyle='rgba(0,0,0,.1)';x.beginPath();x.arc(0,0,56,-.9,.9);x.lineTo(20,0);x.fill();
  hair(o.hair,o.hairCol,56);
  if(o.beard){x.fillStyle=o.hairCol;x.beginPath();x.arc(0,18,50,.15,Math.PI-.15);x.lineTo(0,8);x.fill();x.fillStyle=o.skin;x.beginPath();x.ellipse(0,22,16,9,0,0,7);x.fill()}
  x.save();x.translate(o.look*10||0,0);face(f,0,P.mode,((t+(o.ph||0)*1.7)%3.4)<.13||o.eyesClosed);x.restore();x.restore();
  x.restore();x.restore();
  if(o.label)labelAt(o.label,0,-2.2*k/ k)})}
function labelAt(){}
// big props / animals using lib shapes (px units): kk converts to world scale
function sprite(X,Z,kk,fn){add(X,Z,(s)=>{shadow(s,kk*180,.28);x.scale(s*kk,s*kk);fn()})}
function fireP(X,Z,sz=1,a=1){add(X,Z,(s)=>{glow(0,-s*.5,s*3.2*sz,'255,150,60',.35*a);x.save();fire(0,0,s/150*sz,a);x.restore()})}
function smokeP(X,Y,Z,n=8,col='200,200,210'){const p0=proj(X,Y,Z);if(!p0)return;SPR.push({z:p0.z,p:p0,fn:(s)=>{for(let i=0;i<n;i++){const k=((T*.22+i/n)%1);x.fillStyle=`rgba(${col},${(1-k)*.4})`;x.beginPath();x.arc(Math.sin(k*5+i)*.35*s*k,-k*2.4*s,(.12+k*.5)*s,0,7);x.fill()}}})}
// ---------- screen-space post ----------
function post(o={}){
 const g=x.createRadialGradient(W/2,H*.5,H*.25,W/2,H*.5,H*.75);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,`rgba(8,4,24,${.45+M.dark*.35})`);x.fillStyle=g;x.fillRect(0,0,W,H);
 x.fillStyle=M.tint;x.fillRect(0,0,W,H);
 if(M.dark>0){x.fillStyle=`rgba(0,0,30,${M.dark*.28})`;x.fillRect(0,0,W,H)}
 if(o.flash){x.fillStyle=`rgba(255,255,255,${o.flash})`;x.fillRect(0,0,W,H)}
 if(o.speed){x.save();x.globalAlpha=o.speed*.5;x.strokeStyle='#fff';const r=prng(Math.floor(T*24)+3);for(let i=0;i<26;i++){const a=r()*6.283,r0=H*(.28+r()*.2),r1=r0+H*(.15+r()*.4);x.lineWidth=2+r()*4;x.beginPath();x.moveTo(W/2+Math.cos(a)*r0*.8,H/2+Math.sin(a)*r0);x.lineTo(W/2+Math.cos(a)*r1*.8,H/2+Math.sin(a)*r1);x.stroke()}x.restore()}
 }
// ---------- captions (word-by-word, pop in) ----------
const KEY={perfect:'#ffd24a',survive:'#7dff9b',primitive:'#ff5a5a',brains:'#ff9ad5',parasites:'#9dff5a',fire:'#ff9a3a',night:'#8aa8ff',poisonous:'#ff5a5a',berry:'#ff5a7a',last:'#ff5a5a',alone:'#ff5a5a',twist:'#ffd24a',group:'#7dff9b',together:'#ffd24a',trust:'#ffd24a',won:'#ffd24a',fail:'#ff5a5a',thirsty:'#6ad0ff',river:'#6ad0ff',electricity:'#ffd24a',medicine:'#ff7a7a',phone:'#6ad0ff'};
let WORDS=[];
function drawCaption(t){let cur=null;for(let i=0;i<WORDS.length;i++){const w=WORDS[i];const nx=WORDS[i+1];if(t>=w.s&&t<(nx&&nx.s-w.e<.25?nx.s:w.e+.18)){cur=w;break}}
 if(!cur)return;const k=back((t-cur.s)/.16);const raw=cur.w.replace(/[^\w']/g,'').toLowerCase();const col=KEY[raw]||'#ffffff';
 const txt=cur.w.replace(/[.,:?!]+$/,'').toUpperCase();x.save();x.translate(W/2,H*.745);const sc=.82+.18*k;x.scale(sc,sc);x.rotate((cur.i%2?-1:1)*.025*(1-k));
 let fs=150;x.font=`900 ${fs}px Inter,Arial,sans-serif`;const mw=x.measureText(txt).width;if(mw>W-110){fs*=(W-110)/mw;x.font=`900 ${fs}px Inter,Arial,sans-serif`}
 x.textAlign='center';x.textBaseline='middle';x.lineJoin='round';x.lineWidth=fs*.17;x.strokeStyle='#120a2a';x.strokeText(txt,0,8);x.fillStyle='rgba(0,0,0,.35)';x.fillText(txt,0,fs*.07+8);x.fillStyle=col;x.fillText(txt,0,0);x.restore()}
// ---------- screen overlays ----------
function popIcon(kind,px,py,sz,t0,life=1.6){const u=T-t0;if(u<0||u>life)return;const a=Math.min(1,(life-u)/.25);x.save();x.translate(px,py+Math.sin(T*3+px)*8);const sc=back(u/.3)*sz;icon(kind,0,0,sc,a);x.restore()}
function slam(txt,t0,life,col='#fff',y=H*.3,size=200){const u=T-t0;if(u<0||u>life)return;const k=u<.18?1+(1-u/.18)*1.4:1+(u-.18)*.02;const a=u>life-.25?(life-u)/.25:1;x.save();x.globalAlpha=a;x.translate(W/2,y);x.scale(k,k);x.rotate(-.05);x.font=`900 ${size}px Inter,Arial,sans-serif`;x.textAlign='center';x.textBaseline='middle';x.lineJoin='round';x.lineWidth=size*.16;x.strokeStyle='#120a2a';x.strokeText(txt,0,0);x.fillStyle=col;x.fillText(txt,0,0);x.restore()}
function beginFrame(mood,roll){M=mood;x.save();x.clearRect(0,0,W,H);x.translate(W/2,H/2);x.rotate(CAM3.roll);x.translate(-W/2,-H/2);SPR=[]}
function endFrame(){x.restore()}
function treeRing(cx,cz,r0,r1,n,sd,hmin=5,hmax=10,kinds){const r=prng(sd);for(let i=0;i<n;i++){const a=r()*6.283,d=r0+r()*(r1-r0);const tx=cx+Math.cos(a)*d,tz=cz+Math.sin(a)*d;if(Math.abs(tx)<26&&tz>-16&&tz<40)continue;tree(tx,tz,hmin+r()*(hmax-hmin),i+sd*3,kinds?kinds[i%kinds.length]:(r()<.3?'pine':'round'))}}
function fogLayers(){[160,110,75,48,28,14].forEach((d,i)=>addFog(d,[.55,.5,.42,.32,.2,.1][i]))}
