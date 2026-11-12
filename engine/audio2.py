import numpy as np, scipy.signal as sg, json, sys
from scipy.io import wavfile
SR=48000; TOTAL=84.4; N=int((TOTAL+1.0)*SR)
rng=np.random.default_rng(11)
VOICE='VOICE.wav'
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
# ================= cue list (also printed for the user) =================
CUES=[]
def cue(t,what): CUES.append((t,what))
# ---- ambience beds
wind(0,10.2,.9); [bird(t,3000+rng.random()*900,int(3+rng.random()*3),1,rng.uniform(-.8,.8)) for t in (0.6,2.2,3.7,5.1,6.4,8.3)]
cue(0.6,'dawn birds (scene 1 opening)')
wind(10,11.2,.6); [bird(t,2600+rng.random()*1000,4,.8,rng.uniform(-.8,.8)) for t in (11.0,13.5,17.0,19.2)]
river(23.2,9.5,1.0); cue(23.2,'river bed fades in as camera reaches the water')
wind(21,11,.4)
crickets(40.2,3.5,.5); cue(40.5,'first crickets as the light dies')
crickets(43.2,10.4,1.0); wind(43.2,10.4,.5); cue(43.4,'night bed: crickets + low wind')
[bird(t,3400+rng.random()*800,5,1,rng.uniform(-.8,.8)) for t in (53.9,55.6,57.6,60.3,62.4)]; wind(53.4,10.7,.4); cue(53.9,'morning birds return with the twist')
crackle(63.4,12.4,1.0); cue(63.8,'fire crackle under the whole camp scene')
wind(75.4,9,.5); [bird(t,2800+rng.random()*700,3,.5,rng.uniform(-.8,.8)) for t in (76.0,79.5)]
# ---- events
boom(1.0,.9); cue(1.0,'low impact on "STONE AGE" slam')
zap(4.1); cue(4.1,'electric zap: electricity icon')
ding(5.0,1046,1); cue(5.0,'bell ding: medicine cross')
ding(6.25,1568,.8); ding(6.4,2093,.7,rt=1.4); cue(6.25,'two-tone phone notification: phone icon')
gust(7.7,2.0,.7,0,200,900); cue(7.7,'soft wind rush as the camera pulls back and rises (not a swoosh)')
trumpet(9.0,.8,.3); cue(9.0,'distant mammoth trumpet on "Right?"')
for k in (0,1): bloop(9.25+k*.18,540+k*140,.7)
boom(12.55,.7,60); cue(12.55,'thump on "NOT" slam')
ding(14.0,660,.6,rt=1.5); ding(14.3,740,.55,rt=1.5); cue(14.0,'two matching brain tones')
ding(14.95,988,.8); cue(14.95,'"=" click')
for k,t in enumerate(np.arange(16.0,17.5,.5)): step(t,.4,-.3,1)
cue(16.0,'hunter creeping through reeds')
for i,t in enumerate(np.arange(17.6,19.2,.45)): step(t,.35,.4-.8*i/3.5)
cue(17.6,'girl\'s footsteps, panning with her')
gust(19.3,1.9,.55,0,220,700)
for i,t in enumerate(np.arange(21.3,22.9,.449)): step(t,.7,0)
cue(21.3,'your footsteps toward the river')
boom(21.3,.8,55); cue(21.3,'impact on "DAY 1"')
bloop(22.45,300,.5,up=0)
ding(25.4,1760,.7,rt=1.4); [ding(25.6+i*.18,midi(100+i%3*2),.25,rt=.7) for i in range(6)]; cue(25.4,'lens ping + shimmer: magnifier reveals parasites')
for k,t in enumerate((27.3,27.6,27.9)): squelch(t,.8,(k-1)*.5)
cue(27.3,'wet squelches as germs pop out')
buzzer(30.1); cue(30.1,'"uh-uh" buzzer: pot crossed out')
scrape(32.2,1.8,15.7,16.5,.9); cue(32.2,'stick-on-wood friction as you rub')
scrape(34.0,2.0,15.7,16.5,.8)
for i in range(18): step(34.45+i*.084,.0)  # placeholder (silent)
for i in range(14): bloop(34.5+i*.1,900+i*50,.15,0,up=0)
cue(34.5,'counter ticks up to 1000x')
scrape(36.0,4.0,15.7,32,.9); cue(36.0,'rubbing speeds up through the time-lapse')
for i in range(10): tick=np.sin(2*np.pi*3000*tt(.03))*np.exp(-tt(.03)*160); put(SFX,tick,38.7+i*.14,.2)
cue(38.7,'clock ticking, fast')
wah(40.2,[(58,.38),(57,.38),(56,.38),(55,.9)],.9); cue(40.2,'sad muted "wah-wah-wah-waah" at the failed fire')
howl(41.9,300,3.6,1.0,-.6,.55); howl(42.8,360,3.2,.6,.5,.7); cue(41.9,'wolf howl, then a second wolf answering from the other side')
for k in range(4): step(43.5+k*.45,.4,-.5+k*.2,1)
cue(43.5,'your steps in the grass at night')
ding(45.9,311,.6,rt=2.5); bloop(45.95,150,.5,up=0); cue(45.9,'low skull sting: poisonous plant')
for n in range(28): bloop(47.2+n*.07,[523,587,659,784,880][n%5],.12,rng.uniform(-.8,.8),up=0)
cue(47.2,'rapid question-mark bloops across the berry field')
for k in range(8): heartbeat(49.5+k*.37,.8+.1*k);
cue(49.5,'heartbeat as the berry rises')
slide_whistle(51.0,.5,700,300,.6); thud(51.7,1.2,60); thud(51.75,.8,45); cue(51.7,'body hits the ground')
ding(51.9,233,.7,rt=3); cue(51.9,'low skull sting')
boom(52.0,.0)
gust(53.3,1.0,.9,0,500,2600); boom(53.5,1.0,58); cue(53.4,'whip-cut punch into the twist (this is the only real swoosh)')
boom(54.1,.7,70); cue(54.1,'hit on "TWIST"')
ding(55.4,2093,.9,rt=2.5); sparkle(55.45,.6); cue(55.4,'bright "ting" + sparkle: idea bulb lights')
t=tt(1.0); bz=np.sin(2*np.pi*np.cumsum(520*np.exp(-t*2.2))/SR)*.4*np.exp(-t*2); put(SFX,bz*(np.sin(2*np.pi*13*t)>0),58.1,.5); cue(58.1,'bulb flickers out')
gust(57.3,2.2,.5,0,200,600)
ding(59.9,698,.8,rt=2); cue(59.9,'brain tone: WHY')
ding(61.7,880,.8,rt=2); cue(61.7,'hand tone: HOW')
boom(61.5,.8,66); cue(61.5,'thump on the "not equal" sign')
for k in range(5): step(71.3+k*.17,.7,-.3+k*.15,1)
for k in range(5): step(71.4+k*.17,.5,.3-k*.1,1)
cue(71.2,'hunters running in step')
trumpet(71.6,.9,.1); cue(71.6,'mammoth bellow as the group faces it')
boom(73.2,1.0,48); cue(73.2,'big hit on "Together"')
bloop(81.6,420,.5,up=0)
ding(82.8,740,.7,rt=3.5); cue(82.8,'single unresolved bell on "Could you?"')
boom(83.7,.5,50); cue(83.7,'soft low hit with the THESIS tag')
# ================= music =================
BPM=84; beat=60/BPM; bar=4*beat
Dm=[50,53,57,62]; Bb=[46,50,53,58]; Gm=[43,50,55,58]; A7=[45,49,52,55]
Fm=[53,57,60,65]; C=[48,55,60,64]; Dm2=[50,57,62,65]
PENT=[62,65,67,69,72,74,77]
def section_arp(t0,t1,chords,g,pattern,oct=12,step=1.0,pan=True):
    b=int(t0/bar)
    t=t0
    while t<t1-.05:
        ch=chords[((int(t/bar))//2)%len(chords)]
        i=int(round((t-t0)/(beat*step)))
        n=ch[pattern[i%len(pattern)]%len(ch)]+oct
        marimba(midi(n),t,g*(1 if i%4==0 else .65),(-.3 if i%2 else .3))
        t+=beat*step
def chord_pads(t0,t1,chords,g,bright=900):
    t=t0; k=0
    while t<t1-.3:
        d=min(bar*2,t1-t+1.0); pad(chords[k%len(chords)],t,d+1.2,g,bright); t+=bar*2; k+=1
def drums(t0,t1,pattern,g,f=75):
    t=t0;i=0
    while t<t1-.02:
        a=pattern[i%len(pattern)]
        if a>0: tom(t,g*a,f*(1.25 if a<.5 else 1),(.2 if i%2 else -.2))
        t+=beat/2; i+=1
# A 0-10.1 awe
drone(38,.0,10.6,1.0); pad([50,57,62,65],.5,9.8,.9,700);
for tn,m,d in ((1.0,74,2.0),(3.1,69,1.6),(4.9,72,1.6),(6.6,77,1.0),(8.0,74,2.2)): flute(midi(m),tn,d,.9)
cue(0,'music: low drone + lone flute, quiet awe')
# B 10.1-21.2 curiosity
chord_pads(10.0,21.4,[Dm,Bb,Gm,A7],.8); section_arp(10.1,21.2,[Dm,Bb,Gm,A7],.8,[0,2,3,2,1,3,2,3]); drums(10.1,21.2,[.7,0,0,0,.5,0,0,0],.7)
flute(midi(74),12.7,1.5,.6); flute(midi(72),15.9,1.4,.6); flute(midi(69),19.5,1.8,.7)
# C 21.2-32.1 journey/thirst
chord_pads(21.2,32.3,[Gm,Dm,Bb,A7],.7); section_arp(21.2,32.1,[Gm,Dm,Bb,A7],.7,[0,1,2,1],12,2.0); drums(21.2,32.1,[.55,0,0,0,0,0,0,0],.7)
# D 32.1-40 rising tension
chord_pads(32.1,40.0,[Dm,Dm,Gm,A7],.7,800); section_arp(32.1,40.0,[Dm,A7],.9,[0,2,1,3,0,3,1,2],24,.5); drums(32.1,40.0,[.9,.4,.6,.4],.8,80)
for t,gg in ((36.0,.3),(38.0,.5),(39.2,.8)): drums(t,40.0,[.8,.5,.6,.5],gg,80) if False else None
# fail: silence under wah, then low drone + howl bed
drone(38,40.0,5.0,.9); pad([38,45,50],41.0,6,.7,500); cue(41.0,'music thins to a dark drone as night falls')
# E 43.4-53.3 night dread
drone(37,43.2,10.0,1.0); pad([38,39,45,50],43.4,8.0,.75,420)
for tn,m in ((44.2,86),(46.9,85),(48.4,81)): marimba(midi(m),tn,.5,rng.uniform(-.6,.6))
for tn,m in ((45.0,64),(47.5,63),(49.1,64)): flute(midi(m),tn,1.4,.35)
# F 53.4-64 twist: hope
pad([53,57,60,65],53.4,10.8,1.0,1500); chord_pads(53.4,64.2,[Fm and [53,57,60,64],C,[50,57,62,65],[46,53,58,62]],.8,1600)
section_arp(54.1,64.1,[[53,57,60,64],C,[50,57,62,65],[46,53,58,62]],.9,[0,1,2,3,2,1,3,2],12,1.0)
drums(55.0,64.0,[.6,0,0,0,.4,0,0,0],.7)
for tn,m,d in ((55.0,72,1.6),(57.4,69,1.4),(59.9,74,1.6),(62.0,72,1.8)): flute(midi(m),tn,d,.8)
# G 64-75.4 group power
chord_pads(64.0,75.6,[Dm,Bb,Gm,A7],1.0,1100); drums(64.0,66.1,[.7,0,.4,0],.8,70)
drums(66.1,72.5,[1,.5,.7,.5,.9,.5,.7,.6],1.0,72)
for i in range(int((72.5-66.1)/(beat*2))): clap(66.1+beat+i*beat*2,.7)
choir([50,57,62,65],66.1,4.4,.9); choir([46,53,58,62],70.5,2.8,.9)
for i in range(16): tom(72.5+i*.045,.5+i*.03,90+i*3)
choir([50,57,62,66,69,74],73.2,3.6,1.5); cue(66.1,'music: hand drums + claps + choir swell as you join the group')
section_arp(66.1,73.0,[Dm,Bb,Gm,A7],.8,[0,2,3,2,1,3,2,3],24,.5)
# H 75.4-84.4 question
pad([50,57,62,64],75.0,9.0,.9,900)
for tn,m in ((76.0,74),(77.4,69),(78.9,72),(80.0,67),(81.4,69),(82.8,62)): marimba(midi(m),tn,.8,rng.uniform(-.3,.3));
flute(midi(74),79.2,3.4,.6)
# ================= voice + mix =================
sr,v=wavfile.read(VOICE); v=v.astype(np.float64)
if v.ndim>1: v=v.mean(1)
v/=32768.0; v=sg.resample_poly(v,SR//sr,1) if SR%sr==0 else sg.resample_poly(v,SR,sr)
voice=np.zeros(N); voice[:len(v)]=v[:N]
env=np.sqrt(sg.sosfilt(sg.butter(1,10,'low',fs=SR,output='sos'),voice**2)); env=env/(np.percentile(env,95)+1e-9)
duck=1/(1+2.2*np.clip(env,0,1.2)); duck=sg.sosfilt(sg.butter(1,2.5,'low',fs=SR,output='sos'),duck)
fade=np.ones(N); e0=int(TOTAL*SR)-int(1.0*SR); fade[e0:]=np.linspace(1,0,N-e0)**2; fade[int(TOTAL*SR):]=0
# silence the score while you collapse
m=np.ones(N); a,b=int(51.55*SR),int(53.4*SR); m[a:b]=np.linspace(1,0,b-a)**2*0+0.0; m[b:b+int(.4*SR)]=np.linspace(0,1,int(.4*SR))
duckS=duck**.9
mL=MUS[0]*duckS*.20*fade*m; mR=MUS[1]*duckS*.20*fade*m
aL=AMB[0]*(.5+.5*duck)*fade*.8; aR=AMB[1]*(.5+.5*duck)*fade*.8
sL=SFX[0]*(.55+.45*duck)*fade*.7; sR=SFX[1]*(.55+.45*duck)*fade*.7
L=voice+mL+aL*.9+sL*.9; R=voice+mR+aR*.9+sR*.9
L=L[:int(TOTAL*SR)]; R=R[:int(TOTAL*SR)]
pk=max(abs(L).max(),abs(R).max()); g=.89/pk if pk>.89 else 1; print('peak',pk)
out=np.stack([L*g,R*g],1); wavfile.write('mix.wav',SR,(out*32767).astype(np.int16))
rms=lambda x:20*np.log10(np.sqrt(np.mean(x**2))+1e-9)
print('voice',rms(voice),'music',rms(mL),'amb',rms(aL),'sfx',rms(sL))
json.dump(sorted(CUES),open('cues.json','w'),indent=0)
