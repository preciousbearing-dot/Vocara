// ===== The Cobra Effect, 16:9 (1920x1080). Shot list tied to the aligned narration (cobra_words.js) =====
const FPS=30,VO_END=77.63,DUR_TOTAL=78.6;
const cl=clamp,ez=ease,ramp=(t,a,b)=>cl((t-a)/(b-a)),V=(a,b,k)=>a.map((v,i)=>lerp(v,b[i],k));
const CAST={
 official:{skin:'#e3b48f',hair:'short',hairCol:'#4a3524',outfit:'#f1ece0',pants:'#d8d0ba',trim:'#b8a574',shoe:'#4a3326',hat:'pith',hr:.28,h:1.02},
 citizen:{skin:'#a5693f',hair:'short',hairCol:'#15100e',outfit:'#e08a3c',pants:'#efe6d0',trim:'#7a4a22',shoe:'#7a4a22',hat:'turban',hatCol:'#c0463c',hr:.28},
 citizen2:{skin:'#8f5a38',hair:'short',hairCol:'#15100e',outfit:'#3f8f6a',pants:'#efe6d0',trim:'#2a5a44',shoe:'#5a3a22',hr:.28},
 breeder:{skin:'#94603a',hair:'short',hairCol:'#e8e8f0',outfit:'#8a5a3a',pants:'#efe6d0',trim:'#d9b27c',shoe:'#5a3a22',hat:'turban',hatCol:'#2f5f9f',beard:true,hr:.29},
 french:{skin:'#e8bd98',hair:'short',hairCol:'#2a1c14',outfit:'#2a3f77',pants:'#d8d0ba',trim:'#c0322e',shoe:'#2a2018',hat:'kepi',hr:.28,h:1.03},
 catcher:{skin:'#c58f63',hair:'short',hairCol:'#15100e',outfit:'#8a7a5a',pants:'#3a3d52',trim:'#d9c78a',shoe:'#3a2a1c',hat:'cone',hr:.28},
 you:{skin:'#a8714a',hair:'short',hairCol:'#15100e',outfit:'#4f7cff',pants:'#2b355f',trim:'#e6edf7',shoe:'#f4f4f4',modern:true,hr:.28}
};
const C=(k,o)=>Object.assign({},CAST[k],o);
const P=(k,X,Z,o)=>puppet(X,Z,C(k,Object.assign({t:T},o)));
const SH=[];function S(a,b,fn){SH.push({a,b,fn})}
function cam(p0,p1,a0,a1,u,fov=62,roll=0,sh=1,e=ez){const k=e(cl(u));shot(V(p0,p1,k),0,V(a0,a1,k),fov,roll,sh)}
function orbit(c,r,an0,an1,h0,h1,u,lookY=1.2,fov=60,roll=0,sh=1){const k=ez(cl(u)),an=lerp(an0,an1,k),h=lerp(h0,h1,k);shot([c[0]+Math.sin(an)*r,h,c[1]-Math.cos(an)*r],0,[c[0],lookY,c[1]],fov,roll,sh)}
function cw(mood,kind,o,fn){o=o||{};beginFrame(mood);drawSky();drawGround(Object.assign({band:o.band||6},o.g||{}));
 if(kind==='street')streetKit(o);else if(kind==='hanoi')streetKit(Object.assign({kind:'hanoi'},o));else if(kind==='room')roomKit(o);else if(kind==='yard')yardKit(o);
 fn&&fn();fogLayers();flushSprites()}
// cover title block (static, no pop, so frame 0 is a finished thumbnail-quality frame)
function coverTitle(){x.save();x.translate(W*.30,H*.40);fitSafe('cover-title',W*.46,H*.52);x.textAlign='center';x.textBaseline='middle';x.lineJoin='round';
 const L=[['THE',104,'#ffffff',-190],['COBRA',250,'#ffd24a',-30],['EFFECT',250,'#ffffff',170]];L.forEach(([tx,sz,col,yy])=>{x.font=`900 ${sz}px Inter,Arial,sans-serif`;x.lineWidth=sz*.16;x.strokeStyle='#120a2a';x.strokeText(tx,0,yy);x.fillStyle='rgba(0,0,0,.35)';x.fillText(tx,0,yy+sz*.06);x.fillStyle=col;x.fillText(tx,0,yy)});x.restore()}

// ================= SCENE 1 : the hook =================
S(0,1.15,(u,t)=>{ // COVER: designed first frame, rearing cobra + title (no fade from black)
 cam([0,1.0,0],[.1,1.0,.5],[-.4,1.15,3.5],[-.2,1.15,3.5],u,56,0,.5);
 cw(MOODS.bazaar,'street',{},()=>{cobraP(1.25,3.5,{k:.0088,mode:'rear',open:1,ph:0});
  [[-2.4,6,0],[2.8,8,2],[-1.0,9,4]].forEach(([X,Z,ph])=>cobraP(X,Z,{k:.008,mode:'slither',ph,dir:ph%4?1:-1}))});
 late(coverTitle)});
S(1.15,3.35,(u,t)=>{ // you pay people for every dead one: coins for a dead cobra
 orbit([0,4.5],5.2,-.45,.3,1.5,1.45,u,1.2,48,0,.6);
 cw(MOODS.bazaar,'street',{},()=>{
  P('official',-1.2,4.5,{act:'hand',dir:1,item:'sack',mode:'smile'});
  P('citizen',1.1,4.5,{act:T>2.7?'raise':'idle',dir:-1,item:'deadcobra',mode:'smile',look:-.4});
  coinFlow([-.8,1.3,4.5],[.8,1.3,4.5],1.69,5,.6,.12,.13,.5);
  cobraP(-2.4,6.5,{k:.008,mode:'slither',ph:1,dir:1});cobraP(2.6,7.5,{k:.008,mode:'rear',ph:2})})});

let LATE=[];function late(f){LATE.push(f)}
function renderAt(t){x.reset();T=t;LATE=[];OVL=[];const sh=SH.find(s=>t>=s.a&&t<s.b)||SH[SH.length-1];const u=cl((t-sh.a)/(sh.b-sh.a));
 sh.fn(u,t-sh.a);x.setTransform(1,0,0,1,0,0);x.globalAlpha=1;x.shadowBlur=0;post({});LATE.forEach(f=>f());
 const dc=t-sh.a;if(dc<.1&&sh.a>0.5){x.fillStyle=`rgba(255,255,255,${(.1-dc)*1.5})`;x.fillRect(0,0,W,H)}
 drawCaption(t)}
