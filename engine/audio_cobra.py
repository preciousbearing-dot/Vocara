import numpy as np, scipy.signal as sg, json, sys
from scipy.io import wavfile
SR=48000; TOTAL=78.6; N=int((TOTAL+1.0)*SR)
rng=np.random.default_rng(11)
VOICE='/mnt/user-data/attachments/ebf4de3f-52e0-56c2-a68b-a62648a942a9/c1dacdeb-cobra-effect.wav'
def tt(d): return np.arange(int(d*SR))/SR
def noise(d): return rng.standard_normal(int(d*SR))
def lp(x,fc,o=2): return sg.sosfilt(sg.butter(o,min(fc,SR/2-100),'low',fs=SR,output='sos'),x)
def hp(x,fc,o=2): return sg.sosfilt(sg.butter(o,fc,'high',fs=SR,output='sos'),x)
def bp(x,a,b,o=2): return sg.sosfilt(sg.butter(o,[a,min(b,SR/2-100)],'band',fs=SR,output='sos'),x)
def midi(m): return 440*2**((m-69)/12)
def edge(n,a,r):
    e=np.ones(n); a=int(a*SR); r=int(r*SR)
    if a>0: e[:min(a,n)]=np.linspace(0,1,min(a,n))**1.5
    if r>0: e[-min(r,n):]*=np.linspace(1,0,min(r,n))**1.5
    return e
def reverb(x,wet=.3,rt=1.6,pre=.01):
    n=int(rt*SR); t=np.arange(n)/SR; ir=rng.standard_normal(n)*np.exp(-t*6.9/rt); ir=lp(ir,4500); ir[:int(pre*SR)]=0; ir/=np.sqrt((ir**2).sum())
    y=sg.fftconvolve(x,ir)[:len(x)+n]; out=np.zeros(len(y)); out[:len(x)]+=x*(1-wet); out+=y*wet*1.2; return out
MUS=[np.zeros(N),np.zeros(N)]; SFX=[np.zeros(N),np.zeros(N)]; AMB=[np.zeros(N),np.zeros(N)]
def put(bus,x,t0,g=1.0,pan=0.0):
    i=int(t0*SR)
    if i>=N or i<0: return
    x=x[:N-i]; l=g*np.cos((pan+1)*np.pi/4); r=g*np.sin((pan+1)*np.pi/4)
    bus[0][i:i+len(x)]+=x*l*1.414; bus[1][i:i+len(x)]+=x*r*1.414
# ================= instruments =================
def flute(f,t0,d,g=1,pan=0):
    t=tt(d); vib=1+.006*np.sin(2*np.pi*5.2*t)*np.minimum(1,t/.4); ph=2*np.pi*np.cumsum(f*vib)/SR
    x=np.sin(ph)+.25*np.sin(2*ph)+.08*np.sin(3*ph); x+=bp(noise(d),f*.9,f*3,2)*.07
    x*=edge(len(t),.07,.35); x=reverb(x,.35,1.8); put(MUS,x,t0,g*.30,pan)
def marimba(f,t0,g=1,pan=0):
    t=tt(1.2); x=np.sin(2*np.pi*f*t)*np.exp(-t*5.5)+.35*np.sin(2*np.pi*f*3.98*t)*np.exp(-t*22)+.12*np.sin(2*np.pi*f*9.2*t)*np.exp(-t*45)
    x*=np.minimum(1,t/.002); put(MUS,x,t0,g*.28,pan)
def tom(t0,g=1,f=75,pan=0):
    t=tt(.7); fr=f*(1+1.1*np.exp(-t*35)); ph=2*np.pi*np.cumsum(fr)/SR; x=np.sin(ph)*np.exp(-t*7)+.35*bp(noise(.7),180,900)*np.exp(-t*30)
    x*=np.minimum(1,t/.001); put(MUS,x,t0,g*.55,pan)
def clap(t0,g=1,pan=0):
    t=tt(.25); x=0
    for k in (0,.011,.021): x=x+np.roll(bp(noise(.25),900,3500)*np.exp(-t*50),int(k*SR))
    put(MUS,x*.5,t0,g*.35,pan)
def pad(notes,t0,d,g=1,bright=1000):
    out=[np.zeros(int(d*SR)),np.zeros(int(d*SR))]
    for k in (0,1):
        x=np.zeros(int(d*SR)); tx=tt(d)
        for m in notes: f=midi(m)*(1+(.0035 if k else -.0035)); x+=(2*((f*tx)%1)-1)*.1+np.sin(2*np.pi*f*tx)*.07
        x=lp(x,bright,2)*edge(len(x),min(2.2,d*.4),min(2.4,d*.4)); out[k]=x
    put(MUS,out[0],t0,g,-.4); put(MUS,out[1],t0,g,.4)
def choir(notes,t0,d,g=1):
    for k,pan in ((0,-.35),(1,.35)):
        x=np.zeros(int(d*SR)); tx=tt(d)
        for m in notes:
            f=midi(m)*(1+.003*(k*2-1)); v=1+.007*np.sin(2*np.pi*5.5*tx+m); ph=2*np.pi*np.cumsum(f*v)/SR; x+=(2*((ph/(2*np.pi))%1)-1)*.1
        y=bp(x,300,450)*1.6+bp(x,700,950)*1.0+bp(x,2300,2900)*.25; y*=edge(len(y),min(1.2,d*.3),min(1.8,d*.4)); put(MUS,reverb(y,.3,2.2),t0,g,pan)
def drone(m,t0,d,g=1):
    tx=tt(d); f=midi(m); x=(2*((f*tx)%1)-1)*.25+np.sin(2*np.pi*f*tx)*.4+np.sin(2*np.pi*f*2*tx)*.1; x=lp(x,320)*(1+.2*np.sin(2*np.pi*.23*tx))*edge(len(tx),1.5,2.0); put(MUS,x,t0,g*.55)
# ================= sfx =================
def ding(t0,f,g=1,pan=0,rt=2.2):
    t=tt(rt); x=(np.sin(2*np.pi*f*t)+.4*np.sin(2*np.pi*f*2.76*t)*np.exp(-t*3)+.2*np.sin(2*np.pi*f*5.4*t)*np.exp(-t*8))*np.exp(-t*(2.6)); x*=np.minimum(1,t/.002); put(SFX,reverb(x,.15,.8),t0,g*.22,pan)
def bloop(t0,f=520,g=1,pan=0,up=1.0):
    t=tt(.3); fr=f*(.7+.5*(1-np.exp(-t*30)))**up if up else f; ph=2*np.pi*np.cumsum(f*(.75+.5*(1-np.exp(-t*28))))/SR; x=np.sin(ph)*np.exp(-t*16); x*=np.minimum(1,t/.002); put(SFX,x,t0,g*.3,pan)
def boom(t0,g=1,f=52):
    t=tt(1.6); x=np.sin(2*np.pi*np.cumsum(f*(1+1.2*np.exp(-t*14)))/SR)*np.exp(-t*3.2)+.5*lp(noise(1.6),260)*np.exp(-t*9)+.2*bp(noise(1.6),1200,5000)*np.exp(-t*60)
    x*=np.minimum(1,t/.002); put(SFX,x,t0,g*.75)
def thud(t0,g=1,f=70,pan=0):
    t=tt(.3); x=np.sin(2*np.pi*np.cumsum(f*(1+.6*np.exp(-t*30)))/SR)*np.exp(-t*16)+.5*lp(noise(.3),500)*np.exp(-t*22); put(SFX,x,t0,g*.5,pan)
def step(t0,g=1,pan=0,grass=1):
    t=tt(.22); x=lp(noise(.22),700)*np.exp(-t*30)*.8+(bp(noise(.22),2500,7000)*np.exp(-t*20)*.35 if grass else 0)+np.sin(2*np.pi*95*t)*np.exp(-t*40)*.5; put(SFX,x,t0,g*.35,pan)
def zap(t0,g=1,pan=0):
    d=.45; t=tt(d); x=bp(noise(d),1800,7000)*(1+np.sign(np.sin(2*np.pi*70*t)))*.5*np.exp(-t*9)+np.sin(2*np.pi*np.cumsum(2400*np.exp(-t*8))/SR)*np.exp(-t*12)*.5; put(SFX,x,t0,g*.35,pan)
def sparkle(t0,g=1):
    for i,m in enumerate((96,100,103,108)): ding(t0+i*.055,midi(m),g*.5,rt=1.0)
def squelch(t0,g=1,pan=0):
    t=tt(.3); x=np.sin(2*np.pi*np.cumsum(180*np.exp(-t*8)+120)/SR)*np.exp(-t*12)+lp(noise(.3),900)*np.exp(-t*18)*.5; put(SFX,x*(1+.5*np.sin(2*np.pi*40*t)),t0,g*.45,pan)
def buzzer(t0,g=1):
    for k in range(2):
        t=tt(.28); x=np.sign(np.sin(2*np.pi*np.cumsum(165-35*k-t*60)/SR))*.4; x=lp(x,1800)*edge(len(t),.005,.05); put(SFX,x,t0+k*.34,g*.45)
def wah(t0,notes,g=1):
    tcur=t0
    for i,(m,d) in enumerate(notes):
        t=tt(d); f=midi(m)*(1+.012*np.sin(2*np.pi*5*t)*(i==len(notes)-1)); x=(2*((np.cumsum(f*np.ones(len(t)))/SR)%1)-1)
        sw=400+1400*np.sin(np.pi*np.minimum(1,t/d*1.2))**1.2
        y=np.zeros(len(x))
        for s in range(0,len(x),480):
            sos=sg.butter(2,min(sw[s],SR/2-200),'low',fs=SR,output='sos'); y[s:s+480]=sg.sosfilt(sos,x[s:s+480])  # block approx
        y=lp(x,900)*(.6+.6*np.sin(np.pi*np.minimum(1,t/d)))*edge(len(t),.03,.08); put(SFX,y,tcur,g*.3); tcur+=d
def heartbeat(t0,g=1):
    for dt,f,gg in ((0,62,1),(.16,54,.7)):
        t=tt(.35); x=np.sin(2*np.pi*np.cumsum(f*(1+.8*np.exp(-t*25)))/SR)*np.exp(-t*14)+.25*lp(noise(.35),200)*np.exp(-t*18); put(SFX,x,t0+dt,g*gg*.6)
def slide_whistle(t0,d,f0,f1,g=1):
    t=tt(d); f=f0*(f1/f0)**(t/d); x=np.sin(2*np.pi*np.cumsum(f)/SR)*.5*edge(len(t),.03,.1); put(SFX,x,t0,g*.25)
def gust(t0,d,g=1,pan=0,f0=300,f1=1400):
    n=int(d*SR); x=noise(d); k=np.linspace(0,1,n); fc=f0*(f1/f0)**k; out=np.zeros(n)
    for s in range(0,n,1024):
        sos=sg.butter(2,[max(60,fc[s]*.6),min(fc[s]*1.4,SR/2-200)],'band',fs=SR,output='sos'); out[s:s+1024]=sg.sosfilt(sos,x[s:s+1024]) if s==0 else sg.sosfilt(sos,x[s:s+1024])
    out*=np.sin(np.pi*k)**2.2; out/=abs(out).max()+1e-9; put(SFX,lp(out,3500),t0,g*.32,pan)
def howl(t0,f0=330,d=3.4,g=1,pan=0,far=.5):
    t=tt(d); k=t/d
    c=np.where(k<.3,.78+.75*np.sin(k/.3*np.pi/2)**1.5,np.where(k<.7,1.53-.1*(k-.3)/.4,1.43-.65*((k-.7)/.3)**1.4))
    vib=1+.012*np.sin(2*np.pi*5.4*t)*np.minimum(1,np.maximum(0,(k-.25)*4))+.004*np.sin(2*np.pi*.9*t)
    ph=2*np.pi*np.cumsum(f0*c*vib)/SR; x=sum(np.sin(h*ph)/h**1.1 for h in range(1,13))
    y=lp(x,2200)*.5+bp(x,300,480)*2.0+bp(x,650,900)*1.2+bp(noise(d),1800,4500)*.05
    y*=edge(len(t),.35,1.1)*(1+.08*np.sin(2*np.pi*3.1*t)); y=reverb(y,far,2.6); y/=abs(y).max()+1e-9; put(SFX,y,t0,g*.30,pan)
def trumpet(t0,g=1,pan=0):
    d=2.0; t=tt(d); k=t/d; c=np.where(k<.18,.45+.55*(k/.18)**.7,np.where(k<.5,1+.03*np.sin(40*t),1-.45*((k-.5)/.5)**1.2)); f=330*c
    ph=2*np.pi*np.cumsum(f)/SR; x=sum(np.sin(h*ph)/h**.8 for h in range(1,15))*(1+.5*np.sin(2*np.pi*58*t)); x=bp(x,350,1400)*1.5+bp(x,2200,3200)*.4+lp(noise(d),600)*.1
    x*=edge(len(t),.05,.5); x=reverb(lp(x,3500),.5,2.5); x/=abs(x).max()+1e-9; put(SFX,x,t0,g*.3,pan)
def bird(t0,f=3200,n=4,g=1,pan=0):
    for i in range(n):
        d=.09; t=tt(d); fr=f*(1+.4*np.sin(np.pi*t/d)*(1+.3*i)); x=np.sin(2*np.pi*np.cumsum(fr)/SR)*np.sin(np.pi*t/d)**.7; put(AMB,x,t0+i*.13,g*.1,pan)
def river(t0,d,g=1):
    for pan in (-.5,.5):
        x=bp(noise(d),350,2800)*(.6+.4*lp(noise(d),3,1)*3); x+=bp(noise(d),3500,7000)*.12*(.5+.5*lp(noise(d),2,1)*4)
        x=lp(x,6000)*edge(int(d*SR),2,2); put(AMB,x,t0,g*.18,pan)
    for i in range(int(d*2.2)):
        tb=t0+rng.random()*d; f=700+rng.random()*900; t=tt(.12); x=np.sin(2*np.pi*np.cumsum(f*(1+2.5*t))/SR)*np.exp(-t*35); put(AMB,x,tb,g*.05*(rng.random()+.3),rng.uniform(-.7,.7))
def wind(t0,d,g=1):
    for pan in (-.6,.6):
        x=bp(noise(d),120,700)*(.35+lp(noise(d),.5,1)*6); x=lp(x,900)*edge(int(d*SR),2,2); put(AMB,np.clip(x,-3,3),t0,g*.2,pan)
def crickets(t0,d,g=1):
    for i in range(int(d*3)):
        tb=t0+rng.random()*d; pan=rng.uniform(-.8,.8); f=4300+rng.random()*600
        for j in range(3):
            t=tt(.045); x=np.sin(2*np.pi*f*t)*np.sin(np.pi*t/.045)**2; put(AMB,x,tb+j*.06,g*.04,pan)
def crackle(t0,d,g=1):
    put(AMB,lp(noise(d),380)*edge(int(d*SR),1,1.5)*.5,t0,g*.05)
    for i in range(int(d*14)):
        tb=t0+rng.random()*d; a=rng.random()**2; t=tt(.04); x=hp(noise(.04),1500)*np.exp(-t*rng.uniform(80,220)); put(AMB,x,tb,g*.07*a+g*.01,rng.uniform(-.5,.5))
def scrape(t0,d,rate0,rate1,g=1):
    t=tt(d); ph=2*np.pi*np.cumsum(np.linspace(rate0,rate1,len(t)))/SR; x=bp(noise(d),1200,4200)*np.abs(np.sin(ph))**.8*(1+.3*np.sin(2*np.pi*90*t)); x+=lp(noise(d),500)*np.abs(np.sin(ph))*.4; put(SFX,x*edge(len(t),.05,.1),t0,g*.22)
# ===== cobra-specific sounds =====
def hiss(t0,d=.9,g=1,pan=0):
    n=int(d*SR); x=bp(noise(d),3200,9500,2)*(np.sin(np.pi*np.linspace(0,1,n))**1.4)*(1+.3*np.sin(2*np.pi*13*tt(d))); put(SFX,x,t0,g*.28,pan)
def squeak(t0,g=1,pan=0):
    for k in range(2):
        d=.07; t=tt(d); f=4200+k*700; x=np.sin(2*np.pi*np.cumsum(f*(1+.35*t/d))/SR)*np.sin(np.pi*t/d); put(SFX,x,t0+k*.09,g*.12,pan)
def snip(t0,g=1):
    t=tt(.12); x=hp(noise(.12),2500)*np.exp(-t*60)*.9+np.sin(2*np.pi*3100*t)*np.exp(-t*50)*.5+np.sin(2*np.pi*4700*t)*np.exp(-t*70)*.3; put(SFX,x,t0,g*.5)
def clink(t0,g=1,pan=0):
    f=2300+rng.random()*900; t=tt(.5); x=(np.sin(2*np.pi*f*t)+.5*np.sin(2*np.pi*f*2.4*t)+.3*np.sin(2*np.pi*f*3.9*t))*np.exp(-t*9); x*=np.minimum(1,t/.001); put(SFX,x,t0,g*.16,pan)
def stamp(t0,g=1):
    thud(t0,g*1.5,52); t=tt(.2); put(SFX,hp(noise(.2),1500)*np.exp(-t*40)*.4,t0,g*.4)
def register(t0,g=1):
    thud(t0,g*.6,300); ding(t0+.03,1800,g,0,1.4); ding(t0+.09,2400,g*.8,0,1.4)
def tick(t0,g=1):
    t=tt(.05); put(SFX,np.sin(2*np.pi*1500*t)*np.exp(-t*90)*.8,t0,g*.3)
def patter(t0,d,g=1,pan=0,rate=14):
    for i in range(int(d*rate)):
        tb=t0+i/rate+rng.random()*.03;t=tt(.04);put(SFX,hp(noise(.04),1800)*np.exp(-t*110),tb,g*.07,pan+rng.uniform(-.3,.3))
def murmur(t0,d,g=1):
    for pan in (-.6,.6):
        n=int(d*SR);x=bp(noise(d),220,1100,2)*(.5+.5*lp(noise(d),4,1)*5);x=lp(x,1300)*edge(n,1.5,1.5);put(AMB,np.clip(x,-2,2),t0,g*.12,pan)
    for i in range(int(d*.7)):
        tb=t0+rng.random()*d;f0=180+rng.random()*120;t=tt(.25);fr=f0*(1+.4*np.sin(2*np.pi*3*t));x=lp(sum(np.sin(h*2*np.pi*np.cumsum(fr)/SR)/h for h in range(1,6)),1800)*np.sin(np.pi*t/.25)**1.5;put(AMB,x,tb,g*.03,rng.uniform(-.8,.8))
def hum(t0,d,g=1,f=110):
    t=tt(d);x=(np.sin(2*np.pi*f*t)+.4*np.sin(2*np.pi*f*2*t))*edge(len(t),2,2);put(AMB,x,t0,g*.05)
CUES=[]
def cue(t,what): CUES.append((t,what))
# ===== music helpers =====
BPM=84; beat=60/BPM; bar=4*beat
Dm=[50,53,57,62]; Bb=[46,50,53,58]; Gm=[43,50,55,58]; A7=[45,49,52,55]
def section_arp(t0,t1,chords,g,pattern,oct=12,step=1.0):
    t=t0
    while t<t1-.05:
        ch=chords[((int((t-t0)/bar))//2)%len(chords)];i=int(round((t-t0)/(beat*step)));n=ch[pattern[i%len(pattern)]%len(ch)]+oct
        marimba(midi(n),t,g*(1 if i%4==0 else .65),(-.3 if i%2 else .3));t+=beat*step
def chord_pads(t0,t1,chords,g,bright=900):
    t=t0;k=0
    while t<t1-.3:
        d=min(bar*2,t1-t+1.0);pad(chords[k%len(chords)],t,d+1.2,g,bright);t+=bar*2;k+=1
# ================= the score + effects, tied to the shot list =================
# music
cue(0.0,'music: sly marimba + low pad (curious, slightly mischievous)')
drone(38,0,36.8,1.0); chord_pads(0,36.8,[Dm,Bb,Gm,A7],.8); section_arp(0.8,36.8,[Dm,Bb,Gm,A7],.8,[0,2,3,2,1,3,2,3],12,1.0)
cue(36.8,'music: darker, slower. the plan is falling apart')
drone(31,36.8,12,1.1); chord_pads(36.8,48.4,[Gm,Dm,A7],.9,700); section_arp(36.8,48.4,[Gm,Dm,A7],.6,[0,1,2,1],12,2.0)
cue(48.4,'music: tense low pulse as the cobras take over')
drone(33,48.4,6.5,1.2); chord_pads(48.4,54.6,[Dm,A7],.9,650)
for i in range(int(6/beat*2)): tom(48.4+i*beat/2,.28+.2*i/12,70)
cue(54.6,'music: calm documentary pad + sparse marimba (the honest part)')
chord_pads(54.6,69.3,[Dm,Gm,Bb,A7],.7,900)
for tn,m in ((55.0,74),(56.6,69),(58.2,72),(60.3,74),(62.0,77),(64.3,72),(66.0,69),(67.5,74)): marimba(midi(m),tn,.7,rng.uniform(-.3,.3))
cue(69.3,'music: builds, then ends on an unresolved question')
chord_pads(69.3,78.6,[Bb,Gm,Dm,A7],.9,1100); section_arp(69.4,76.0,[Bb,Gm,Dm,A7],.8,[0,1,2,3,2,1],12,.5)
for tn,m in ((76.2,74),(76.9,77),(77.6,81)): marimba(midi(m),tn,.8)
# ambience
cue(0,'ambience: bazaar crowd murmur + birds (scene 1-3)')
murmur(0,36.8,1.0)
for tb in (1.0,4.5,8.8,12.2,26.0,30.5): bird(tb,3000+rng.random()*700,3,1)
cue(17.0,'ambience: quiet office room tone (shots in the government office)')
hum(17.0,6.3,1.0,95)
cue(32.0,'ambience: dusk crickets + wind in the breeders yard')
crickets(32.0,16.5,1.0); wind(32.0,16.5,.7)
cue(48.4,'ambience: street swells with hissing')
murmur(48.4,6.2,.7)
cue(59.4,'ambience: Hanoi street: soft city hum')
hum(54.6,15.0,1.0,80); murmur(59.4,10.0,.7); bird(61.0,3600,3,1); bird(67.5,3800,4,1)
cue(69.3,'ambience: evening wind')
wind(69.3,9.3,.8)
# effects, per shot
cue(0.15,'cobra hiss as the title appears'); hiss(0.15,.9,1.2); boom(0.05,.6,48)
cue(1.69,'coins clink as they fly to the cobra hunter')
for i in range(5): clink(1.69+.6+i*.12-.1+i*0,1,-.2+.1*i)
for i in range(11): hiss(3.5+i*.28,.7,.4+.05*i,rng.uniform(-.7,.7))
cue(3.94,'impact on MONTHS LATER + rising hiss chorus as cobras fill the street'); thud(3.94,1.2,55)
bloop(5.2,780,.8)
cue(6.72,'two soft marimba notes (a question) on the ?'); marimba(midi(69),6.72,1.0); marimba(midi(66),7.0,.9)
cue(9.07,'low drum hit on DELHI'); tom(9.07,1.0,62)
cue(10.8,'hisses + a gasp-like murmur: cobras everywhere'); [hiss(10.7+i*.15,.6,.7,rng.uniform(-.8,.8)) for i in range(5)]
cue(13.0,'board planted: wooden thud'); thud(12.95,1.0,90)
cue(14.7,'tick on the = ; register ding when the coin appears'); tick(14.7); register(15.0)
for i in range(5): clink(15.55+.6+i*.12,1,.15)
cue(17.51,'ding for the green check'); ding(17.51,1320,1.0)
for i in range(9): thud(17.7+i*.26,.4+.03*i,110,rng.uniform(-.5,.5))
cue(20.34,'coin clinks pouring out'); [clink(20.34+i*.07,1,rng.uniform(-.7,.7)) for i in range(18)]
cue(22.3,'bright marimba run: the officials smile'); [marimba(midi(m),22.3+i*.1,.7) for i,m in enumerate((74,77,81,86))]
cue(23.25,'success chime on PERFECT'); ding(23.25,1568,1.0); ding(23.3,1976,.7)
cue(24.3,'heartbeat tension while he notices'); heartbeat(24.4,.9); heartbeat(25.3,1.0); heartbeat(26.1,1.1)
bloop(26.26,430,.8,0,0)
for i in range(6): hiss(27.2+i*.45,.7,.5,rng.uniform(-.8,.8))
cue(31.05,'buzzer: hunting stops'); buzzer(31.05,.6)
cue(32.0,'thud on FARMING'); thud(32.0,1.1,60)
for i in range(7): hiss(33.6+i*.3,.6,.45,rng.uniform(-.8,.8))
cue(35.4,'tick then cash register for the cobra = coin paycheck'); tick(35.4); register(35.96)
cue(39.09,'stamp thump for CANCELLED'); stamp(39.12,1.0)
cue(40.4,'low boom on THE TWIST'); boom(40.4,.9,44)
cue(43.98,'buzzer on the no sign'); buzzer(43.98,.5)
cue(46.6,'cobras released: crowd of hisses and rustle'); [hiss(46.6+i*.14,.8,.55,rng.uniform(-.9,.9)) for i in range(10)]; patter(46.6,1.8,1.0)
bloop(48.9,500,.7); bloop(50.8,360,.8,0,0)
cue(52.0,'a big hiss as the giant cobra rises, then boom on BIGGER'); hiss(52.0,1.4,1.5); boom(53.08,1.0,46)
cue(56.7,'buzzer: no proof'); buzzer(56.7,.5)
cue(59.65,'drum on HANOI 1902, ding on the green check'); tom(59.65,.9,70); ding(60.46,1320,1.0)
cue(62.0,'tick + coin: tail = 1 cent'); tick(62.0); clink(62.4,1.2)
cue(64.6,'scissors approach: tiny metal ratchet'); [tick(64.7+i*.17,.7) for i in range(5)]
cue(65.7,'SNIP'); snip(65.7,1.2); clink(66.05,.6,-.4)
cue(66.3,'rat squeak and scurry'); squeak(66.3,1.0,.3); patter(66.3,.7,1.2,.5,20)
cue(67.2,'many rats: squeaks and scurrying'); [squeak(67.2+i*.28,.8,rng.uniform(-.8,.8)) for i in range(6)]; patter(67.2,2.0,1.5,0,26)
cue(69.9,'ding as the goal target appears'); ding(69.9,1047,1.0)
cue(70.4,'footsteps leaving the goal'); [step(70.4+i*.3,.6,rng.uniform(-.5,.5),0) for i in range(4)]
cue(71.0,'footsteps following the coin'); [step(71.0+i*.28,.7,rng.uniform(-.7,.7),0) for i in range(7)]
cue(72.1,'drum + coin chime on REWARD'); tom(72.1,1.0,62); clink(72.2,1.5); clink(72.35,1.5)
cue(74.5,'end card: soft chime'); ding(74.5,880,1.0)
# ================= voice + mix =================
sr,v=wavfile.read(VOICE); v=v.astype(np.float64)
if v.ndim>1: v=v.mean(1)
v/=32768.0; v=sg.resample_poly(v,SR//sr,1) if SR%sr==0 else sg.resample_poly(v,SR,sr)
voice=np.zeros(N); voice[:len(v)]=v[:N]
env=np.sqrt(sg.sosfilt(sg.butter(1,10,'low',fs=SR,output='sos'),voice**2)); env=env/(np.percentile(env,95)+1e-9)
duck=1/(1+2.2*np.clip(env,0,1.2)); duck=sg.sosfilt(sg.butter(1,2.5,'low',fs=SR,output='sos'),duck)
fade=np.ones(N); e0=int(TOTAL*SR)-int(1.0*SR); fade[e0:]=np.linspace(1,0,N-e0)**2; fade[int(TOTAL*SR):]=0
duckS=duck**.9
mL=MUS[0]*duckS*.20*fade; mR=MUS[1]*duckS*.20*fade
aL=AMB[0]*(.5+.5*duck)*fade*.8; aR=AMB[1]*(.5+.5*duck)*fade*.8
sL=SFX[0]*(.55+.45*duck)*fade*.7; sR=SFX[1]*(.55+.45*duck)*fade*.7
L=voice+mL+aL*.9+sL*.9; R=voice+mR+aR*.9+sR*.9
L=L[:int(TOTAL*SR)]; R=R[:int(TOTAL*SR)]
pk=max(abs(L).max(),abs(R).max()); g=.89/pk if pk>.89 else 1; print('peak',pk)
out=np.stack([L*g,R*g],1); wavfile.write('mix.wav',SR,(out*32767).astype(np.int16))
rms=lambda x:20*np.log10(np.sqrt(np.mean(x**2))+1e-9)
print('voice',rms(voice),'music',rms(mL),'amb',rms(aL),'sfx',rms(sL))
json.dump(sorted(CUES),open('cues_cobra.json','w'),indent=0)
