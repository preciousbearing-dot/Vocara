// ===== Cobra Effect art kit: hats, cobras, rats, props, icons, street / office / yard sets =====
// Draw units: sprites are drawn through add()/sprite() so scale s = pixels per metre.
const GOLD='#f2b632',GOLD2='#c9871b',SKIN2='#a56b45';
// ---------- hats (head-local coords: head circle radius r at 0,0, up = negative y) ----------
function hatDraw(kind,r,col){
 if(kind==='pith'){x.fillStyle=col||'#f3efe2';x.beginPath();x.ellipse(0,-r*.7,r*1.32,r*.26,0,0,7);x.fill();x.beginPath();x.arc(0,-r*.7,r*.95,Math.PI,0);x.fill();x.fillStyle='rgba(0,0,0,.12)';x.beginPath();x.arc(0,-r*.7,r*.95,Math.PI*1.5,0);x.lineTo(0,-r*.7);x.fill();x.fillStyle='#b8a574';x.fillRect(-r*.95,-r*.78,r*1.9,r*.1)}
 else if(kind==='cone'){x.fillStyle=col||'#d9b66c';x.beginPath();x.moveTo(-r*1.4,-r*.45);x.lineTo(0,-r*1.5);x.lineTo(r*1.4,-r*.45);x.closePath();x.fill();x.strokeStyle='rgba(120,80,30,.45)';x.lineWidth=3;for(let i=-2;i<=2;i++){x.beginPath();x.moveTo(0,-r*1.5);x.lineTo(i*r*.6,-r*.45);x.stroke()}}
 else if(kind==='turban'){x.fillStyle=col||'#c0463c';x.beginPath();x.ellipse(0,-r*.78,r*1.08,r*.62,0,0,7);x.fill();x.strokeStyle='rgba(255,255,255,.28)';x.lineWidth=4;for(let i=-2;i<=2;i++){x.beginPath();x.moveTo(-r*.9,-r*.78+i*r*.2);x.quadraticCurveTo(0,-r*.78+i*r*.2-r*.18,r*.9,-r*.78+i*r*.2);x.stroke()}x.fillStyle=GOLD;x.beginPath();x.arc(0,-r*.55,r*.12,0,7);x.fill()}
 else if(kind==='kepi'){x.fillStyle=col||'#2a3f77';x.beginPath();x.moveTo(-r*.98,-r*.62);x.lineTo(r*.98,-r*.62);x.lineTo(r*.82,-r*1.22);x.lineTo(-r*.82,-r*1.22);x.closePath();x.fill();x.fillStyle='#c0322e';x.fillRect(-r*.98,-r*.7,r*1.96,r*.14);x.fillStyle=GOLD;x.beginPath();x.arc(0,-r*.78,r*.1,0,7);x.fill()}
}
// ---------- cobras (facing +x, y up = negative, ~215 units tall when reared) ----------
function cobraRear(t,ph,col,open){col=col||'#b58a3a';const dk=mix(col,'#000000',.38),lt=mix(col,'#ffffff',.16),bel='#efdfae',sw=Math.sin(t*1.7+ph),o=open===undefined?1:open;
 [[0,-12,78,19],[-5,-32,62,17],[3,-49,48,15]].forEach(([cx,cy,rx,ry],i)=>{x.fillStyle=i%2?col:dk;x.beginPath();x.ellipse(cx,cy,rx,ry,0,0,7);x.fill();x.fillStyle='rgba(255,255,255,.12)';x.beginPath();x.ellipse(cx-6,cy-ry*.35,rx*.8,ry*.35,0,0,7);x.fill()});
 const N=12,pts=[];for(let i=0;i<=N;i++){const u=i/N;pts.push([Math.sin(u*2.6+ph+t*1.2)*10*u+sw*6*u*u,-56-u*128])}
 for(let i=0;i<=N;i++){x.fillStyle=i%2?col:dk;x.beginPath();x.arc(pts[i][0],pts[i][1],19-i*.45,0,7);x.fill()}
 const hx=pts[N][0],hy=pts[N][1]-26,hw=18+38*o;
 const hood=(sc,c)=>{x.fillStyle=c;x.beginPath();x.moveTo(hx-16*sc,hy+84);x.quadraticCurveTo(hx-hw*1.18*sc,hy+34,hx-hw*sc,hy-16);x.quadraticCurveTo(hx-hw*.78*sc,hy-52,hx,hy-52);x.quadraticCurveTo(hx+hw*.78*sc,hy-52,hx+hw*sc,hy-16);x.quadraticCurveTo(hx+hw*1.18*sc,hy+34,hx+16*sc,hy+84);x.closePath();x.fill()};
 hood(1,dk);hood(.86,col);
 x.fillStyle=bel;x.beginPath();x.ellipse(hx,hy+38,9+7*o,32,0,0,7);x.fill();x.strokeStyle=dk;x.lineWidth=3;for(let k=0;k<4;k++){x.beginPath();x.moveTo(hx-8-6*o,hy+22+k*10);x.lineTo(hx+8+6*o,hy+22+k*10);x.stroke()}
 x.fillStyle=lt;x.beginPath();x.ellipse(hx,hy-12,25,21,0,0,7);x.fill();
 [-10,10].forEach(ex=>{x.fillStyle='#ffe066';x.beginPath();x.arc(hx+ex,hy-17,6.5,0,7);x.fill();x.fillStyle='#14100a';x.beginPath();x.ellipse(hx+ex,hy-17,1.8,5.4,0,0,7);x.fill()});
 x.strokeStyle='#14100a';x.lineWidth=3.2;x.beginPath();x.moveTo(hx-19,hy-28);x.lineTo(hx-4,hy-21);x.moveTo(hx+19,hy-28);x.lineTo(hx+4,hy-21);x.stroke();
 x.fillStyle='#14100a';x.beginPath();x.arc(hx-4,hy-6,1.6,0,7);x.arc(hx+4,hy-6,1.6,0,7);x.fill();
 const tf=Math.max(0,Math.sin(t*5+ph));if(tf>.2){x.strokeStyle='#e0334a';x.lineWidth=3.2;x.beginPath();x.moveTo(hx,hy+4);x.lineTo(hx+1,hy+4+14*tf);x.moveTo(hx+1,hy+4+14*tf);x.lineTo(hx-5,hy+4+22*tf);x.moveTo(hx+1,hy+4+14*tf);x.lineTo(hx+7,hy+4+22*tf);x.stroke()}}
function cobraSlither(t,ph,col,len,dead){col=col||'#b58a3a';len=len||240;const dk=mix(col,'#000000',.38),n=22,pts=[];
 for(let i=0;i<=n;i++){const u=i/n;pts.push([-len/2+u*len,-12+(dead?Math.sin(u*3+ph)*6:Math.sin(u*10-t*8+ph)*13*(.35+.65*u))])}
 for(let i=0;i<=n;i++){const u=i/n;x.fillStyle=i%2?col:dk;x.beginPath();x.arc(pts[i][0],pts[i][1],4+u*10,0,7);x.fill()}
 const hx=pts[n][0],hy=pts[n][1];
 if(!dead){x.fillStyle=dk;x.beginPath();x.ellipse(hx-4,hy-6,14,18,0,0,7);x.fill()}
 x.fillStyle=col;x.beginPath();x.ellipse(hx+12,hy,19,11,0,0,7);x.fill();
 if(dead){x.strokeStyle='#14100a';x.lineWidth=3;x.beginPath();x.moveTo(hx+8,hy-8);x.lineTo(hx+16,hy-1);x.moveTo(hx+16,hy-8);x.lineTo(hx+8,hy-1);x.stroke();x.strokeStyle='#e0334a';x.lineWidth=2.5;x.beginPath();x.moveTo(hx+30,hy+3);x.lineTo(hx+42,hy+8);x.stroke()}
 else{x.fillStyle='#ffe066';x.beginPath();x.arc(hx+14,hy-3,4,0,7);x.fill();x.fillStyle='#14100a';x.beginPath();x.ellipse(hx+14,hy-3,1.2,3.4,0,0,7);x.fill();const tf=Math.max(0,Math.sin(t*6+ph));if(tf>.3){x.strokeStyle='#e0334a';x.lineWidth=2.5;x.beginPath();x.moveTo(hx+30,hy+2);x.lineTo(hx+30+12*tf,hy+2);x.stroke()}}}
function cobraDangle(){const col='#b58a3a',dk=mix(col,'#000000',.38),n=18;let hx=0;
 for(let i=0;i<=n;i++){const u=i/n,px=Math.sin(u*3+T*2)*8*u,py=u*170;hx=px;x.fillStyle=i%2?col:dk;x.beginPath();x.arc(px,py,7+u*12,0,7);x.fill()}
 x.fillStyle=col;x.beginPath();x.ellipse(hx,196,20,26,0,0,7);x.fill();x.strokeStyle='#14100a';x.lineWidth=3.5;x.beginPath();[-8,8].forEach(ex=>{x.moveTo(hx+ex-5,190);x.lineTo(hx+ex+5,200);x.moveTo(hx+ex+5,190);x.lineTo(hx+ex-5,200)});x.stroke()}
function cobraP(X,Z,o){o=Object.assign({k:.0075,mode:'rear',dir:1,ph:0,open:1,Y:0,col:null},o);
 add(X,Z,(s)=>{shadow(s,o.k*85,.25);x.save();x.scale(s*o.k*o.dir,s*o.k);
  if(o.mode==='rear')cobraRear(T,o.ph,o.col,o.open);else cobraSlither(T,o.ph,o.col,o.len||240,o.mode==='dead');x.restore()},o.Y)}
// ---------- rats (facing +x, ~100 units long) ----------
function ratBody(t,ph,tail,run){const bob=run?Math.abs(Math.sin(t*14+ph))*4:0;x.save();x.translate(0,-bob);
 if(tail){x.strokeStyle='#e9a3a3';x.lineWidth=5;x.lineCap='round';x.beginPath();x.moveTo(-40,-14);x.quadraticCurveTo(-78,-8+Math.sin(t*8+ph)*10,-96,-34+Math.sin(t*6+ph)*8);x.stroke()}
 else{x.fillStyle='#e9a3a3';x.beginPath();x.arc(-42,-14,5,0,7);x.fill()}
 x.fillStyle='#6d6762';[-22,-8,16,28].forEach((lx,i)=>{const o=run?Math.sin(t*14+ph+i*1.6)*6:0;x.beginPath();x.ellipse(lx+o,-4+bob,7,5,0,0,7);x.fill()});
 x.fillStyle='#8a837c';x.beginPath();x.ellipse(0,-20,44,22,0,0,7);x.fill();x.fillStyle='#a69e96';x.beginPath();x.ellipse(2,-14,34,13,0,0,7);x.fill();
 x.fillStyle='#8a837c';x.beginPath();x.moveTo(30,-36);x.quadraticCurveTo(62,-34,76,-16);x.lineTo(30,-6);x.closePath();x.fill();
 x.fillStyle='#e9a3a3';x.beginPath();x.arc(76,-16,4,0,7);x.fill();x.fillStyle='#e9b0b0';x.beginPath();x.arc(36,-40,10,0,7);x.fill();x.fillStyle='#14100a';x.beginPath();x.arc(54,-24,3.2,0,7);x.fill();
 x.strokeStyle='rgba(30,30,30,.55)';x.lineWidth=1.5;[-3,2].forEach(b=>{x.beginPath();x.moveTo(72,-16);x.lineTo(94,-16+b*3);x.stroke()});x.restore()}
function ratP(X,Z,o){o=Object.assign({k:.0072,dir:1,ph:0,tail:true,run:false,Y:0},o);
 add(X,Z,(s)=>{shadow(s,o.k*60,.22);x.save();x.scale(s*o.k*o.dir,s*o.k);ratBody(T,o.ph,o.tail,o.run);x.restore()},o.Y)}
function ratDangle(tail){x.strokeStyle='#e9a3a3';x.lineWidth=5;x.lineCap='round';x.beginPath();x.moveTo(0,0);x.lineTo(0,64);x.stroke();x.save();x.translate(-14,64+46);x.rotate(Math.PI/2+.12*Math.sin(T*6));ratBody(T,0,false,false);x.restore()}
function tailShape(len){x.strokeStyle='#e9a3a3';x.lineWidth=6;x.lineCap='round';x.beginPath();x.moveTo(-len/2,0);x.quadraticCurveTo(0,-len*.28,len/2,len*.05);x.stroke()}
function tailP(X,Y,Z,rot,k=.006){add(X,Z,(s)=>{x.save();x.rotate(rot);x.scale(s*k,s*k);tailShape(90);x.restore()},Y)}
function scissors(open){const a=.12+open*.5;x.lineCap='round';[1,-1].forEach(sg=>{x.save();x.rotate(sg*a);x.fillStyle='#d9dde6';x.beginPath();x.moveTo(0,0);x.lineTo(-14,-150);x.lineTo(4,-150);x.closePath();x.fill();x.strokeStyle='#e0702c';x.lineWidth=11;x.beginPath();x.moveTo(0,0);x.lineTo(sg*16,52);x.stroke();x.beginPath();x.arc(sg*20,66,16,0,7);x.stroke();x.restore()});x.fillStyle='#5a5f70';x.beginPath();x.arc(0,0,6,0,7);x.fill()}
function scissorsP(X,Y,Z,rot,open,k=.0055){add(X,Z,(s)=>{x.save();x.rotate(rot);x.scale(s*k,s*k);scissors(open);x.restore()},Y)}
// ---------- money ----------
function coinShape(r){x.fillStyle=GOLD2;x.beginPath();x.arc(0,0,r,0,7);x.fill();x.fillStyle=GOLD;x.beginPath();x.arc(0,-r*.04,r*.9,0,7);x.fill();x.strokeStyle=GOLD2;x.lineWidth=r*.1;x.beginPath();x.arc(0,0,r*.62,0,7);x.stroke();x.fillStyle='rgba(255,255,255,.55)';x.beginPath();x.ellipse(-r*.32,-r*.44,r*.2,r*.1,-.6,0,7);x.fill()}
function coinStack(n){for(let i=0;i<n;i++){const y=-i*9;x.fillStyle=GOLD2;x.beginPath();x.ellipse(0,y+4,30,10,0,0,7);x.fill();x.fillStyle=GOLD;x.beginPath();x.ellipse(0,y,30,10,0,0,7);x.fill()}}
function moneySack(){x.fillStyle='#8b6a3d';x.beginPath();x.moveTo(-34,0);x.quadraticCurveTo(-52,-60,-14,-92);x.lineTo(14,-92);x.quadraticCurveTo(52,-60,34,0);x.closePath();x.fill();x.fillStyle='#6f522b';x.fillRect(-16,-96,32,12);x.save();x.translate(0,-40);coinShape(16);x.restore()}
function coinP(X,Y,Z,k=.0016){add(X,Z,(s)=>{x.save();x.scale(s*k*100,s*k*100);coinShape(.25*100/100*1);x.restore()},Y)}
// coins arc from A to B (world coords), staggered; t0 = start time, n coins, flight time dur
function coinFlow(A,B,t0,n,dur=.7,gap=.18,size=.13,arc=1.2){for(let i=0;i<n;i++){const u=(T-t0-i*gap)/dur;if(u<0||u>1)continue;const X=lerp(A[0],B[0],u),Z=lerp(A[2],B[2],u),Y=lerp(A[1],B[1],u)+Math.sin(u*Math.PI)*arc;add(X,Z,(s)=>{x.save();x.scale(s*size,s*size*(.55+.45*Math.abs(Math.cos(u*9+i))));coinShape(1);x.restore()},Y)}}
// ---------- props: sign board, counter, baskets, jar ----------
function bountyBoard(X,Y,Z,o={}){add(X,Z,(s)=>{x.save();x.scale(s/100,s/100);const bw=360,bh=230;
  x.fillStyle='#5a3d2b';x.fillRect(-bw/2-10,-bh-20,20,bh+120);x.fillRect(bw/2-10,-bh-20,20,bh+120);
  x.fillStyle='#e9d4a0';x.beginPath();x.roundRect(-bw/2,-bh-60,bw,bh,16);x.fill();x.strokeStyle='#7a5632';x.lineWidth=10;x.stroke();
  x.font='900 70px Inter,Arial,sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillStyle='#8a2a22';x.fillText('BOUNTY',0,-bh-60+52);
  x.save();x.translate(-92,-bh-60+148);x.scale(.62,.62);KITI.deadcobra();x.restore();x.font='900 60px Inter,Arial';x.fillStyle='#3a2a1a';x.fillText('=',0,-bh-60+148);x.save();x.translate(92,-bh-60+148);x.scale(.62,.62);KITI.coin();x.restore();
  if(o.cancel){const k=back((T-o.cancel)/.25);if(T>=o.cancel){x.save();x.translate(0,-bh-60+bh/2);x.scale(k,k);x.rotate(-.22);x.strokeStyle='#d62828';x.lineWidth=12;x.strokeRect(-150,-46,300,92);x.font='900 62px Inter,Arial';x.fillStyle='#d62828';x.fillText('CANCELLED',0,4);x.restore()}}
  focusReg('bounty-board',bw,bh);x.restore()},Y)}
function counterP(X,Z,w=3.2){add(X,Z,(s)=>{x.save();x.scale(s,s);x.fillStyle='#4e3220';x.fillRect(-w/2,-1.05,w,1.05);x.fillStyle='#8a5a36';x.fillRect(-w/2-.1,-1.15,w+.2,.14);x.fillStyle='rgba(0,0,0,.2)';for(let i=1;i<4;i++)x.fillRect(-w/2+i*w/4-.02,-1.0,.04,.95);x.restore()})}
function basketP(X,Z,o={}){o=Object.assign({r:.45,ph:0,cobra:true,lid:0},o);add(X,Z,(s)=>{shadow(s,o.r*1.1,.25);x.save();x.scale(s,s);
  if(o.cobra&&o.lid<1){x.save();x.translate(0,-.5);x.scale(.0036,.0036);cobraRear(T,o.ph,null,.7);x.restore()}
  x.fillStyle='#b4814a';x.beginPath();x.moveTo(-o.r,-.62);x.quadraticCurveTo(-o.r*1.1,-.2,-o.r*.8,0);x.lineTo(o.r*.8,0);x.quadraticCurveTo(o.r*1.1,-.2,o.r,-.62);x.closePath();x.fill();
  x.strokeStyle='rgba(90,58,28,.5)';x.lineWidth=.025;for(let i=1;i<5;i++){x.beginPath();x.moveTo(-o.r*1.05,-.62+i*.12);x.lineTo(o.r*1.05,-.62+i*.12);x.stroke()}
  x.fillStyle='#d0a066';x.beginPath();x.ellipse(0,-.62,o.r,.08,0,0,7);x.fill();x.restore()})}
function jarTails(X,Z,n,Y=0){add(X,Z,(s)=>{x.save();x.scale(s/100,s/100);x.fillStyle='rgba(200,230,240,.35)';x.beginPath();x.roundRect(-45,-140,90,140,14);x.fill();x.strokeStyle='rgba(255,255,255,.7)';x.lineWidth=4;x.stroke();
  for(let i=0;i<n;i++){x.save();x.translate(-26+(i*17)%52,-18-Math.floor(i/3)*8-(i%3)*3);x.rotate(-.6+((i*37)%10)/8);x.scale(.5,.5);tailShape(70);x.restore()}
  x.fillStyle='#8a5a36';x.fillRect(-48,-150,96,14);focusReg('tail-jar',96,150);x.restore()},Y)}
// ---------- icons (units ~ +-60) ----------
const KITI={
 coin(){coinShape(50)},
 cobra(){x.scale(.45,.45);x.translate(0,131);cobraRear(T,0,null,1)},
 deadcobra(){x.scale(.46,.46);x.translate(-60,10);cobraSlither(0,0,null,240,true)},
 rat(){x.scale(.62,.62);x.translate(-14,28);ratBody(0,0,true,false)},
 tail(){x.scale(.8,.8);tailShape(110)},
 check(){x.fillStyle='#2fbf71';x.beginPath();x.arc(0,0,54,0,7);x.fill();x.strokeStyle='#fff';x.lineWidth=15;x.lineCap='round';x.lineJoin='round';x.beginPath();x.moveTo(-26,2);x.lineTo(-8,22);x.lineTo(28,-20);x.stroke()},
 x2(){x.fillStyle='#e04b4b';x.beginPath();x.arc(0,0,54,0,7);x.fill();x.strokeStyle='#fff';x.lineWidth=15;x.lineCap='round';x.beginPath();x.moveTo(-24,-24);x.lineTo(24,24);x.moveTo(24,-24);x.lineTo(-24,24);x.stroke()},
 target(){[[56,'#fff'],[44,'#e04b4b'],[32,'#fff'],[20,'#e04b4b'],[8,'#fff']].forEach(([r,c])=>{x.fillStyle=c;x.beginPath();x.arc(0,0,r,0,7);x.fill()})},
 folder(){x.fillStyle='#d9a441';x.beginPath();x.roundRect(-56,-38,112,84,8);x.fill();x.fillStyle='#e9c06a';x.beginPath();x.roundRect(-56,-48,52,18,6);x.fill()}
};
const _icon0=icon;
icon=function(kind,px,py,s,a=1){if(!KITI[kind])return _icon0(kind,px,py,s,a);x.save();x.globalAlpha=a;x.translate(px,py);x.scale(s,s);KITI[kind]();x.restore()};
// equation board: [icon] sign [icon or text]   e.g. dead cobra = coin
function eqBoard(t0,life,k1,sign,k2,txt2,y){const u=T-t0;if(u<0||u>life)return;const a=Math.min(1,(life-u)/.25)*Math.min(1,u/.12);x.save();x.globalAlpha=a;
 const bw=W*(LAND?.42:.8),bh=LAND?H*.26:H*.16;x.translate(W/2,y||H*(LAND?.3:.25));const k=back(u/.35);x.scale(k,k);fitSafe('eq:'+k1,bw,bh);
 x.fillStyle='rgba(20,10,40,.82)';x.beginPath();x.roundRect(-bw/2,-bh/2,bw,bh,bh*.18);x.fill();x.strokeStyle=GOLD;x.lineWidth=6;x.stroke();
 const ic=bh*.5/70;icon(k1,-bw*.28,0,ic,1);x.font=`900 ${bh*.46}px Inter,Arial,sans-serif`;x.fillStyle='#fff';x.textAlign='center';x.textBaseline='middle';x.fillText(sign,0,4);
 if(k2)icon(k2,bw*.28,0,ic,1);else x.fillText(txt2,bw*.28,4);x.restore()}
// ---------- sets ----------
const WALLCOL=['#e8b47c','#d98c5f','#f0cf8f','#c9704f','#e6c38a','#b5835a','#d9a066','#efd9a8'];
const HANCOL=['#e3c26b','#d8b9a0','#c9d3b0','#e8d9a8','#cfa888','#b9c4a2','#e0c58a','#d4b48a'];
const STREETC={};
function genBlocks(key,sd){if(STREETC[key])return STREETC[key];const out=[],r=prng(sd);let z=-60;while(z<300){const len=5+Math.floor(r()*6);out.push({z0:z,z1:z+len,h:(key[0]==='h'?7:9)+r()*(key[0]==='h'?4:7),ci:Math.floor(r()*8),f:r()});z+=len}STREETC[key]=out;return out}
function wallBlock(side,Xw,b,kind){const X=side*Xw,z0=b.z0,z1=b.z1,h=b.h,cols=kind==='hanoi'?HANCOL:WALLCOL,col=mix(cols[(b.ci+(side>0?3:0))%8],M.fog,.08);
 poly3([[X,0,z0],[X,0,z1],[X,h,z1],[X,h,z0]],col);poly3([[X,0,z0],[X,0,z1],[X,.7,z1],[X,.7,z0]],mix(col,'#000000',.18));poly3([[X,0,z0],[X,0,z0+.12],[X,h,z0+.12],[X,h,z0]],'rgba(0,0,0,.22)');
 const lit=M.dark>.04||b.f>.97,floors=Math.floor(h/3.3);
 for(let f=1;f<floors;f++){const y0=f*3.3+.5,y1=y0+1.8;for(let z=z0+.8;z<z1-1.4;z+=2.4){poly3([[X,y0,z],[X,y0,z+1.1],[X,y1,z+1.1],[X,y1,z]],lit?'#ffcf7a':'#3b2b24');
   if(kind==='hanoi'){poly3([[X,y0,z-.45],[X,y0,z],[X,y1,z],[X,y1,z-.45]],'#3f6b50');poly3([[X,y0,z+1.1],[X,y0,z+1.55],[X,y1,z+1.55],[X,y1,z+1.1]],'#3f6b50')}
   else poly3([[X,y1,z-.1],[X,y1,z+1.2],[X,y1+.25,z+1.2],[X,y1+.25,z-.1]],'rgba(255,255,255,.3)')}}
 const zd=z0+(z1-z0)*.35;poly3([[X,0,zd],[X,0,zd+1.6],[X,2.5,zd+1.6],[X,2.5,zd]],'#2b1d17');
 const sg=['#d94a3a','#f2c14e','#3a8f6a','#2f6fb5'][(b.ci+1)%4];poly3([[X,2.7,z0+.5],[X,2.7,z1-.5],[X,3.5,z1-.5],[X,3.5,z0+.5]],sg);poly3([[X,2.62,z0+.5],[X,2.62,z1-.5],[X,2.7,z1-.5],[X,2.7,z0+.5]],'rgba(0,0,0,.25)');
 if(kind==='hanoi')poly3([[X,h,z0],[X,h,z1],[X-side*.9,h+1.1,z1],[X-side*.9,h+1.1,z0]],'#8a4a36');else poly3([[X,h,z0],[X,h,z1],[X-side*.25,h+.5,z1],[X-side*.25,h+.5,z0]],mix(col,'#ffffff',.18))}
function streetKit(o={}){const kind=o.kind||'delhi',half=o.half||(kind==='hanoi'?5:6.5),cz=CAM3.z,blocks=genBlocks((kind==='hanoi'?'h':'d')+'1',kind==='hanoi'?91:17);
 [-1,1].forEach(sd=>{blocks.filter(b=>b.z1>cz-10&&b.z0<cz+150).sort((a,b)=>b.z0-a.z0).forEach(b=>wallBlock(sd,half,b,kind))});
 // road shading + stalls + trees (static layout)
 poly3([[-half+1.4,.005,cz-10],[half-1.4,.005,cz-10],[half-1.4,.005,cz+150],[-half+1.4,.005,cz+150]],rgba(kind==='hanoi'?'#5a5a44':'#9a6f45',.28));
 const r=prng(33);for(let i=0;i<24;i++){const Z=-50+i*9.6+r()*3,sd=i%2?1:-1;if(Z<cz-6||Z>cz+110)continue;if(kind==='delhi'&&(i%3))stallP(sd*(half-1.3),Z,i);else if(Z>cz+5)tree(sd*(half-.9),Z,4+r()*2,i+5,'round')}}
function stallP(X,Z,sd){add(X,Z,(s)=>{x.save();x.scale(s,s);const aw=['#d94a3a','#f2c14e','#3a8f6a','#2f6fb5'][sd%4];
 x.fillStyle='#5a3d2b';x.fillRect(-1.25,-2.4,.1,2.4);x.fillRect(1.15,-2.4,.1,2.4);x.fillStyle='#8a5a36';x.fillRect(-1.2,-.95,2.4,.12);x.fillRect(-1.1,-.85,.1,.85);x.fillRect(1.0,-.85,.1,.85);
 for(let i=0;i<5;i++){x.fillStyle=['#e0553c','#f0b429','#7fb04a','#c96b8f','#e8892a'][(i+sd)%5];x.beginPath();x.arc(-1+i*.5,-1.0,.22,Math.PI,0);x.fill()}
 for(let i=0;i<8;i++){x.fillStyle=i%2?'#f4efe1':aw;x.beginPath();x.moveTo(-1.4+i*.35,-2.55);x.lineTo(-1.4+(i+1)*.35,-2.55);x.lineTo(-1.5+(i+1)*.375,-2.0);x.lineTo(-1.5+i*.375,-2.0);x.fill()}x.restore()})}
function roomKit(o={}){const W2=o.w||7,zb=o.zb||16,H3=o.h||5;
 poly3([[-W2,0,zb],[W2,0,zb],[W2,H3,zb],[-W2,H3,zb]],'#82573a');poly3([[-W2,0,zb],[W2,0,zb],[W2,1.3,zb],[-W2,1.3,zb]],'#5e3d27');
 [-4.2,0,4.2].forEach(wx=>{poly3([[wx-1,1.8,zb],[wx+1,1.8,zb],[wx+1,4.2,zb],[wx-1,4.2,zb]],'#f6cf8a');poly3([[wx-.05,1.8,zb],[wx+.05,1.8,zb],[wx+.05,4.2,zb],[wx-.05,4.2,zb]],'#5e3d27');poly3([[wx-1,3.0,zb],[wx+1,3.0,zb],[wx+1,3.1,zb],[wx-1,3.1,zb]],'#5e3d27')});
 [-1,1].forEach(sd=>{poly3([[sd*W2,0,0],[sd*W2,0,zb],[sd*W2,H3,zb],[sd*W2,H3,0]],'#6d4630');poly3([[sd*W2,0,0],[sd*W2,0,zb],[sd*W2,1.3,zb],[sd*W2,1.3,0]],'#4e3220');for(let z=2;z<zb;z+=3.2)poly3([[sd*W2,H3-.4,z],[sd*W2,H3-.4,z+.25],[sd*W2,H3,z+.25],[sd*W2,H3,z]],'#3a2416')});
 poly3([[-W2,H3,0],[W2,H3,0],[W2,H3,zb],[-W2,H3,zb]],'#3a2416');for(let z=1;z<zb;z+=3.2)poly3([[-W2,H3-.01,z],[W2,H3-.01,z],[W2,H3-.01,z+.3],[-W2,H3-.01,z+.3]],'#2b1a10')}
function yardKit(o={}){const W2=o.w||9,zb=o.zb||20,H3=3.6;
 poly3([[-W2,0,zb],[W2,0,zb],[W2,H3,zb],[-W2,H3,zb]],'#b98b5a');poly3([[-W2,0,zb],[W2,0,zb],[W2,.8,zb],[-W2,.8,zb]],'#8f6a42');
 [-1,1].forEach(sd=>{poly3([[sd*W2,0,-6],[sd*W2,0,zb],[sd*W2,H3,zb],[sd*W2,H3,-6]],'#c49a66');poly3([[sd*W2,0,-6],[sd*W2,0,zb],[sd*W2,.8,zb],[sd*W2,.8,-6]],'#8f6a42');for(let z=-4;z<zb;z+=3.4)poly3([[sd*W2,1.4,z],[sd*W2,1.4,z+1.2],[sd*W2,2.5,z+1.2],[sd*W2,2.5,z]],'#4a3224')});
 for(let i=0;i<7;i++)poly3([[-W2+i*(2*W2/7),H3,zb],[-W2+(i+1)*(2*W2/7),H3,zb],[-W2+(i+1)*(2*W2/7),H3+.5,zb],[-W2+i*(2*W2/7),H3+.5,zb]],i%2?'#a97b4a':'#c49a66')}
// rays of light through windows (screen space)
function lightRays(a=.18,col='255,230,170'){x.save();x.globalAlpha=a;for(let i=0;i<4;i++){const px=W*(.18+i*.22)+Math.sin(T*.4+i)*30;const g=x.createLinearGradient(px,0,px-W*.12,H*.85);g.addColorStop(0,`rgba(${col},.8)`);g.addColorStop(1,`rgba(${col},0)`);x.fillStyle=g;x.beginPath();x.moveTo(px,0);x.lineTo(px+W*.05,0);x.lineTo(px-W*.1,H*.85);x.lineTo(px-W*.2,H*.85);x.fill()}x.restore()}
