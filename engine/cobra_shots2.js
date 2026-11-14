// ===== Cobra Effect shots 3..32 (times tied to cobra_words.js) =====
const CF=(n,seed,z0,z1,xs,o)=>{const r=prng(seed||7);n=Math.floor(n);for(let i=0;i<n;i++){const X=(r()-.5)*2*xs,Z=z0+r()*(z1-z0),m=r()<.35?'rear':'slither',ph=r()*6,d=r()<.5?-1:1;cobraP(X,Z,Object.assign({k:m==='rear'?.0046:.0072,mode:m,ph,dir:d},o||{}))}};
const hold=(c,a,b)=>cl((c-a)/(b-a));
const stroke3=(txt,px,py,sz,col)=>{x.save();x.translate(px,py);x.font=`900 ${sz}px Inter,Arial,sans-serif`;const w=x.measureText(txt).width;fitSafe('tag:'+txt,w+sz*.3,sz*1.2);x.textAlign='center';x.textBaseline='middle';x.lineJoin='round';x.lineWidth=sz*.16;x.strokeStyle='#120a2a';x.strokeText(txt,0,0);x.fillStyle=col;x.fillText(txt,0,0);x.restore()};
const dark=(a)=>{x.fillStyle=`rgba(10,5,30,${a})`;x.fillRect(0,0,W,H)};

// ---- scene 1 cont.
S(3.35,6.4,(u,t)=>{cam([0,1.5,-1],[0,1.5,1.5],[0,1.2,8],[0,1.2,9],u,60,0,.7);
 cw(MOODS.bazaar,'street',{},()=>{CF(2+hold(T,3.5,6.1)*26,7,3,16,5);P('citizen',-2.2,4,{act:'scared',dir:1,mode:'shock'});P('citizen2',2.2,5.5,{act:'run',dir:-1,mode:'shock'})});
 late(()=>slam('MONTHS LATER',3.94,1.7,'#ffd24a',H*.26,170));late(()=>popIcon('cobra',W*.82,H*.3,1.3,5.2,1.2))});
S(6.4,7.4,(u,t)=>{cam([0,1.4,0],[.3,1.4,.4],[0,1.3,5],[0,1.3,5],u,52,0,.5);
 cw(MOODS.bazaar,'street',{},()=>{CF(26,7,5,16,5);P('you',0,3.6,{act:'shrug',dir:1,mode:'worry'})});late(()=>popIcon('q',W*.72,H*.34,1.8,6.72,.9))});
// ---- scene 2
S(7.4,9.0,(u,t)=>{cam([-6,5.5,-4],[3,3.2,0],[0,1,10],[1,1,10],u,64,0,.4);
 cw(MOODS.bazaar,'street',{},()=>{[[-1.5,6],[1.4,8],[-.2,11],[2.2,13]].forEach(([X,Z],i)=>P(i%2?'citizen2':'citizen',X,Z,{act:'walk',dir:i%2?1:-1,ph:i}))})});
S(9.0,10.7,(u,t)=>{orbit([0,6],5,.5,-.15,1.7,1.5,u,1.3,50,0,.5);
 cw(MOODS.bazaar,'street',{},()=>{P('official',-.8,6,{act:'idle',dir:1,mode:'calm'});P('citizen',1.2,6.5,{act:'idle',dir:-1,mode:'calm'});P('citizen2',2.6,8,{act:'walk',dir:-1})});
 late(()=>slam('DELHI',9.07,1.5,'#ffd24a',H*.19,190));late(()=>stroke3('BRITISH RULE',W*.5,H*.34,100,'#fff'))});
S(10.7,11.5,(u,t)=>{cam([0,1.5,0],[0,1.5,.8],[0,1.2,7],[0,1.2,7],u,60,0,1);
 cw(MOODS.bazaar,'street',{},()=>{CF(26,7,3,15,5);P('citizen',-2,4,{act:'scared',dir:1,mode:'shock'});P('citizen2',1.8,5,{act:'run',dir:-1,mode:'shock'})})});
S(11.5,14.0,(u,t)=>{orbit([0,6],6,-.4,.3,1.4,1.5,u,1.4,50,0,.5);
 cw(MOODS.bazaar,'street',{},()=>{P('official',0,6,{act:'point',dir:1,mode:'smile'});bountyBoard(2.2,1.0,6.4);P('citizen',-2.2,8,{act:'idle',dir:1,look:.3});P('citizen2',-3.2,9,{act:'idle',dir:1});CF(6,3,9,16,5)})});
S(14.0,17.0,(u,t)=>{orbit([0,6],5,.3,-.3,1.5,1.4,u,1.3,48,0,.6);
 cw(MOODS.bazaar,'street',{},()=>{P('citizen',-1.1,6,{act:T>15?'cheer':'raise',dir:1,item:'deadcobra',mode:'smile'});P('official',1.3,6,{act:'hand',dir:-1,item:'sack',mode:'smile'});coinFlow([1,1.3,6],[-1,1.3,6],15.55,6,.6,.12,.13,.5)});
 late(()=>eqBoard(14.2,2.7,'deadcobra','=','coin',null,H*.2))});
// ---- scene 3
const OFFICE=(fn)=>cw(MOODS.office,'room',{w:7,zb:16},fn);
S(17.0,19.9,(u,t)=>{cam([0,1.6,1.5],[0,1.7,2.5],[0,1.3,9],[.4,1.3,9],u,60,0,.5);
 OFFICE(()=>{counterP(0,8);P('official',0,9,{act:'hand',dir:1,mode:'smile'});for(let i=0;i<4;i++)P(i%2?'citizen2':'citizen',-2.2+i*1.5,5.4+i*.5,{act:'raise',dir:1,item:'deadcobra',ph:i,mode:'smile'});
  const r=prng(5),n=Math.floor(hold(T,17.5,19.8)*16);for(let i=0;i<n;i++)cobraP(2.4+r()*2.6,6+r()*3,{k:.0058,mode:'dead',ph:r()*6,dir:r()<.5?-1:1})});
 late(()=>popIcon('check',W*.78,H*.3,1.5,17.51,1.5));late(()=>stroke3('DEAD COBRAS',W*.5,H*.2,110,'#fff'))});
S(19.9,21.15,(u,t)=>{cam([0,1.6,.5],[0,1.6,1.5],[0,1.2,9],[0,1.2,9],u,56,0,.5);
 OFFICE(()=>{counterP(0,8);P('official',0,9,{act:'hand',dir:1,item:'sack',mode:'smile'});P('citizen',-1.6,6.2,{act:'cheer',dir:1,mode:'laugh'});P('citizen2',1.6,6.2,{act:'cheer',dir:-1,mode:'laugh'});coinFlow([0,1.6,8.8],[-1.6,1.8,6.4],20.34,6,.6,.12,.14,.6);coinFlow([0,1.6,8.8],[1.6,1.8,6.4],20.5,6,.6,.12,.14,.6)});
 late(()=>popIcon('coin',W*.8,H*.3,1.5,20.34,1.2))});
S(21.15,23.2,(u,t)=>{cam([0,1.5,2],[0,1.5,3.5],[0,1.5,9],[0,1.5,9],u,54,0,.4);
 OFFICE(()=>{P('official',-1.1,8.5,{act:'cheer',dir:1,mode:'laugh'});P('official',1.2,8.5,{act:'cheer',dir:-1,mode:'laugh',ph:1,hat:'pith'});counterP(0,7.2)})});
S(23.2,27.0,(u,t)=>{orbit([0,6],6,.2,-.4,1.5,1.6,u,1.3,52,0,.6);
 cw(MOODS.bazaar,'street',{},()=>{P('official',-1.4,5,{act:T>24.4?'shrug':'idle',dir:1,mode:T>24.4?'brow':'smile'});CF(24,7,6,16,5)});
 late(()=>slam('PERFECT',23.25,1.0,'#7be495',H*.26,170));late(()=>popIcon('q',W*.78,H*.3,1.6,26.26,0.7))});
// ---- scene 4
S(27.0,29.8,(u,t)=>{cam([0,1.5,0],[0,1.5,2],[0,1.2,8],[0,1.2,8],u,60,0,.6);cw(MOODS.bazaar,'street',{},()=>{CF(26,7,3,16,5);P('official',-2,5,{act:'brow'===1?'':'point',dir:1,mode:'brow'})});
 late(()=>popIcon('cobra',W*.8,H*.3,1.4,27.3,1.5))});
S(29.8,32.0,(u,t)=>{cam([-3,1.5,0],[3,1.5,1],[0,1.3,7],[0,1.3,7],u,56,0,.5);
 cw(MOODS.bazaar,'street',{},()=>{const h=T<31.05;P('catcher',-1.5,6,{act:h?'sneak':'idle',dir:1,item:h?'sticks':null,mode:h?'stern':'smile'});P('citizen',1.5,6,{act:h?'sneak':'sit',dir:-1,item:h?'sticks':null,mode:h?'stern':'smile'});CF(10,9,8,15,4)});
 late(()=>popIcon('no',W*.8,H*.32,1.5,31.05,1.2))});
S(32.0,33.4,(u,t)=>{cam([0,1.6,-2],[0,1.6,-1],[0,1,8],[0,1,8],u,56,0,.5);
 cw(MOODS.farm,'yard',{},()=>{[-2.5,0,2.5].forEach((X,i)=>basketP(X,6,{ph:i}));P('breeder',-1.2,4.6,{act:'carry',dir:1,mode:'smile'})});late(()=>stroke3('FARMING',W*.5,H*.24,160,'#ffd24a'))});
S(33.4,36.8,(u,t)=>{orbit([0,6],8,-.3,.5,1.8,1.6,u,1.0,50,0,.5);
 cw(MOODS.farm,'yard',{},()=>{const n=3+Math.floor(hold(T,33.4,35.6)*8);for(let i=0;i<n;i++)basketP(-4+(i%6)*1.6,4+Math.floor(i/6)*2.2,{ph:i,r:.4});P('breeder',-.5,4.5,{act:'rub',dir:1,mode:'laugh'})});
 late(()=>eqBoard(35.4,1.4,'cobra','=','coin',null,H*.26))});
// ---- scene 5
S(36.8,40.3,(u,t)=>{cam([0,1.5,0],[.3,1.5,.6],[.4,1.6,7],[.4,1.6,7],u,56,0,.4);
 cw(MOODS.bazaar,'street',{},()=>{P('official',-1.4,6.2,{act:'point',dir:1,mode:'worry'});bountyBoard(1.4,1.0,7.6,{cancel:39.09});P('official',-2.6,7,{act:'shrug',dir:1,hat:'pith',ph:2,mode:'worry'})})});
S(40.3,41.3,(u,t)=>{cam([0,1.5,-2],[0,1.5,-1],[0,1.2,6],[0,1.2,6],u,60,0,.8);cw(MOODS.farm,'yard',{},()=>{P('breeder',0,5,{act:'idle',mode:'worry'})});dark(.35);late(()=>slam('THE TWIST',40.4,1.0,'#ffd24a',H*.3,200))});
S(41.3,44.7,(u,t)=>{cam([0,1.6,-2],[0,1.6,-1],[0,1.0,8],[0,1.2,8],u,58,0,.5);
 cw(MOODS.farm,'yard',{},()=>{for(let i=0;i<14;i++)basketP(-5.5+(i%7)*1.8,4+Math.floor(i/7)*2.6,{ph:i,r:.42});P('breeder',-.5,4.2,{act:'slump',dir:1,mode:'worry'})});
 late(()=>popIcon('no',W*.8,H*.3,1.5,43.98,1.4));late(()=>stroke3('WORTHLESS',W*.5,H*.2,130,'#fff'))});
S(44.7,48.35,(u,t)=>{cam([0,1.6,-2],[0,1.6,1],[0,1.1,9],[0,1.1,10],u,60,0,.5);
 cw(MOODS.farm,'yard',{},()=>{P('breeder',-1.2,5,{act:T>46.7?'run':'idle',dir:1,mode:'worry'});P('citizen2',1.2,5,{act:'carry',dir:-1});const k=hold(T,46.6,48);for(let i=0;i<14;i++){const r=i*37%11;cobraP(-4+(i%7)*1.3+k*(r-5)*.5,5+(i%3)*1.5+k*(5+r),{k:.0066,mode:'slither',ph:i,dir:(i%2?1:-1)})}});
 late(()=>popIcon('cobra',W*.8,H*.3,1.4,47.0,1.4))});
// ---- scene 6
S(48.35,51.7,(u,t)=>{cam([0,3.5,-3],[0,3,-1],[0,1,8],[0,1,9],u,60,0,.5);
 cw(MOODS.bazaar,'street',{},()=>{CF(4+hold(T,48.6,51)*24,7,3,16,5)});
 late(()=>{const b=hold(T,48.5,49.2),a=hold(T,50.3,51.2);x.save();x.translate(W*.5,H*.42);fitSafe('bars',W*.5,H*.56);x.fillStyle='rgba(20,10,40,.88)';x.beginPath();x.roundRect(-W*.25,-H*.28,W*.5,H*.56,30);x.fill();x.font='900 60px Inter,Arial';x.textAlign='center';x.fillStyle='#fff';x.fillText('COBRAS IN THE CITY',0,-H*.2);x.fillText('BEFORE',-W*.1,H*.22);x.fillText('AFTER',W*.1,H*.22);x.fillStyle='#7be495';x.fillRect(-W*.15,H*.15-H*.1*b,W*.1,H*.1*b);x.fillStyle='#e04b4b';x.fillRect(W*.05,H*.15-H*.36*a,W*.1,H*.36*a);x.restore()})});
S(51.7,54.5,(u,t)=>{cam([0,1.2,0],[0,2.5,1],[0,.5,6],[0,3.2,6],u,64,0,.8);
 cw(MOODS.bazaar,'street',{},()=>{CF(24,7,3,16,5);cobraP(0,6.5,{k:.0046+ez(hold(T,51.8,53.1))*.01,mode:'rear',open:1})});late(()=>slam('BIGGER',53.08,1.3,'#ff6a5a',H*.25,200))});
// ---- scene 7
S(54.5,56.7,(u,t)=>{cam([0,1.5,0],[0,1.5,1],[0,1.2,5],[0,1.2,5],u,56,0,.4);cw(MOODS.hanoi,'room',{w:5,zb:12},()=>{P('you',-.5,4,{act:'point',dir:1,mode:'worry'})});
 late(()=>{x.save();x.translate(W*.65,H*.4+Math.sin(T*2)*10);fitSafe('lens',300,300);x.strokeStyle='#e9e9f5';x.lineWidth=18;x.beginPath();x.arc(0,0,110,0,7);x.stroke();x.moveTo(78,78);x.lineTo(150,150);x.stroke();x.restore()});late(()=>stroke3('HISTORIANS',W*.5,H*.2,130,'#fff'))});
S(56.7,59.4,(u,t)=>{cam([0,1.5,0],[0,1.5,1],[0,1.2,5],[0,1.2,5],u,56,0,.4);cw(MOODS.hanoi,'room',{w:5,zb:12},()=>{});dark(.35);
 late(()=>{x.save();x.translate(W*.5,H*.45);fitSafe('empty-folder',360,300);icon('folder',0,0,3,1);x.font='900 70px Inter,Arial';x.fillStyle='#ffd24a';x.textAlign='center';x.fillText('DELHI',0,-180);x.restore()});late(()=>slam('NO PROOF',57.6,1.6,'#ff6a5a',H*.72,150))});
S(59.4,60.95,(u,t)=>{cam([0,1.5,0],[0,1.5,1],[0,1.2,8],[0,1.2,8],u,60,0,.6);cw(MOODS.hanoi,'hanoi',{},()=>{P('french',0,6,{act:'idle',dir:1,mode:'calm'})});
 late(()=>slam('HANOI 1902',59.65,1.3,'#ffd24a',H*.25,170));late(()=>popIcon('check',W*.8,H*.45,1.5,60.46,1.3))});
S(60.95,63.8,(u,t)=>{orbit([0,6],5,-.3,.3,1.5,1.4,u,1.2,48,0,.5);
 cw(MOODS.hanoi,'hanoi',{},()=>{P('french',-1,6,{act:'point',dir:1,mode:'smile'});jarTails(.9,5.6,6+Math.floor(hold(T,61.5,63)*5));P('citizen',2.4,7,{act:'hand',dir:-1})});
 late(()=>eqBoard(62.0,1.8,'tail','=','coin',null,H*.26))});
S(63.8,66.9,(u,t)=>{cam([0,1.5,0],[0,1.5,.5],[0,1.0,7],[0,1.0,7],u,56,0,.3);
 cw(MOODS.hanoi,'hanoi',{},()=>{});dark(.3);
 late(()=>{const CUT=65.7,dt=T-CUT,run=T>66.3,rx=run?1600*(T-66.3)*(T-66.3):0,K=4.6;
  x.save();x.translate(W*.5,H*.6);fitSafe('cut-scene',W*.62,H*.55);x.scale(K,K);
  // jar (back wall), tail piece, then jar front
  const jx=-102,jy=22;x.fillStyle='rgba(200,230,240,.28)';x.beginPath();x.roundRect(jx-30,jy-52,60,76,8);x.fill();
  if(T>CUT){const g=Math.min(dt,.75);const py=-22+260*g*g,px=-68-8*g,rot=-.6+g*3;if(py<jy+10){x.save();x.translate(px,py);x.rotate(rot);x.strokeStyle='#e9a3a3';x.lineWidth=5;x.lineCap='round';x.beginPath();x.moveTo(-16,-4);x.quadraticCurveTo(0,8,16,2);x.stroke();x.restore()}}
  x.strokeStyle='rgba(255,255,255,.75)';x.lineWidth=2;x.beginPath();x.roundRect(jx-30,jy-52,60,76,8);x.stroke();x.fillStyle='#8a5a36';x.fillRect(jx-33,jy-58,66,8);
  x.save();x.translate(rx,0);ratBody(T,0,T<CUT,run);x.restore();
  // scissors rising from below to the tail, snip at CUT
  if(T>64.6&&T<66.3){const ap=ez(hold(T,64.6,65.55)),out=T>66.0?ez(hold(T,66.0,66.3)):0,open=T<CUT?.5+.5*Math.sin(T*10):Math.max(0,.4-dt*3);
   x.save();x.translate(-68,lerp(130,30,ap)+out*130);x.scale(.55,.55);x.fillStyle='#c58f63';x.fillRect(-22,40,44,220);scissors(open);x.restore()}
  if(dt>0&&dt<.25){x.strokeStyle='#ffd24a';x.lineWidth=3;for(let i=0;i<6;i++){const an=i*1.05;x.beginPath();x.moveTo(-68+Math.cos(an)*9,-11+Math.sin(an)*9);x.lineTo(-68+Math.cos(an)*(14+dt*40),-11+Math.sin(an)*(14+dt*40));x.stroke()}}
  x.restore()});
 late(()=>stroke3('1 CENT PER TAIL',W*.5,H*.16,96,'#ffd24a'))});
S(66.9,69.25,(u,t)=>{cam([0,3,-1],[0,2.5,1],[0,.5,8],[0,.5,9],u,60,0,.5);
 cw(MOODS.hanoi,'hanoi',{},()=>{const n=3+Math.floor(hold(T,67.2,69)*18),r=prng(11);for(let i=0;i<n;i++)ratP(-3+r()*6,4+r()*8,{k:.0095,dir:r()<.5?-1:1,tail:false,run:true,ph:r()*6})});late(()=>popIcon('rat',W*.8,H*.3,1.4,68.0,1.2))});
// ---- scene 8
S(69.25,71.0,(u,t)=>{cam([0,1.5,0],[0,1.5,1],[0,1.2,8],[0,1.2,8],u,58,0,.5);
 cw(MOODS.dusk,'street',{},()=>{const k=hold(T,70.4,71);[-2,-.7,.7,2].forEach((X,i)=>P(i%2?'citizen2':'citizen',X+k*(X<0?-3:3),6+k*3,{act:T>70.4?'walk':'idle',dir:X<0?-1:1,ph:i}))});late(()=>popIcon('target',W*.5,H*.3,1.9,69.9,1.2))});
S(71.0,73.3,(u,t)=>{orbit([0,7],6,.5,-.3,1.5,1.5,u,1.5,52,0,.6);
 cw(MOODS.dusk,'street',{},()=>{P('official',0,7,{act:'walk',dir:1,item:'coins'});[-2,-1.2,1.2,2].forEach((X,i)=>P(i%2?'citizen':'citizen2',X,8.5+i*.6,{act:'walk',dir:1,ph:i}))});
 late(()=>{x.save();x.translate(W*.5,H*.36+Math.sin(T*3)*8);fitSafe('bigcoin',250,250);coinShape(110);x.restore()});late(()=>slam('REWARD',72.1,1.2,'#ffd24a',H*.17,170))});
S(73.3,74.5,(u,t)=>{orbit([0,6],4,0,1.4,1.6,1.5,u,1.4,56,0,.5);cw(MOODS.dusk,'street',{},()=>{P('you',0,6,{act:'point',dir:1,mode:'calm'})});late(()=>stroke3('LOOK AROUND',W*.5,H*.24,130,'#fff'))});
S(74.5,78.7,(u,t)=>{x.reset();const g=x.createLinearGradient(0,0,W,H);g.addColorStop(0,'#1a0f3a');g.addColorStop(1,'#5a2a6a');x.fillStyle=g;x.fillRect(0,0,W,H);
 late(()=>{const k=back(hold(T,74.5,75.2));x.save();x.translate(W*.5,H*.4);x.scale(k,k);fitSafe('endcard',W*.8,H*.5);x.textAlign='center';x.textBaseline='middle';x.lineJoin='round';
  x.font='900 170px Inter,Arial';x.lineWidth=26;x.strokeStyle='#120a2a';x.strokeText('WHAT\'S YOUR',0,-110);x.fillStyle='#fff';x.fillText('WHAT\'S YOUR',0,-110);x.strokeText('COBRA?',0,90);x.fillStyle='#ffd24a';x.fillText('COBRA?',0,90);x.restore()})});
