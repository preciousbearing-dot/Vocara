"""Snap Vocara's estimated word timings to the real voiced audio.
usage: python3 warp_words.py <voice.wav> <name.timings.json>   -> writes words.js (WORDS=[{w,s,e,i}])
The [pause] tags in each scene are matched to the largest silent gaps inside that scene; words are
spread across each voiced stretch proportionally. Scene starts/ends come from the timings file."""
import json,re,sys,numpy as np,scipy.io.wavfile as wf
wav,tj=sys.argv[1],sys.argv[2]
d=json.load(open(tj)); sr,y=wf.read(wav); y=y.astype(float)
if y.ndim>1:y=y.mean(1)
y/=abs(y).max(); hop=int(sr*.01)
env=np.array([np.sqrt((y[i:i+hop*2]**2).mean()) for i in range(0,len(y)-hop*2,hop)])
voiced=env>max(env.max()*.03,.004); out=[]
for s in d['scenes']:
    a=int(s['startMs']/10); e=min(int(s['endMs']/10),len(voiced)); seg=voiced[a:e]
    iv=[];st=None
    for i,v in enumerate(seg):
        if v and st is None: st=i
        if not v and st is not None: iv.append([st,i]); st=None
    if st is not None: iv.append([st,len(seg)])
    m=[iv[0]]
    for q in iv[1:]:
        if q[0]-m[-1][1]<15: m[-1][1]=q[1]
        else: m.append(q)
    npz=len(re.findall(r'\[pause',s['text']))
    gaps=sorted(((m[i+1][0]-m[i][1],i) for i in range(len(m)-1)),reverse=True)[:npz]
    bidx=sorted(i for g,i in gaps); parts=[]; cs=m[0][0]
    for i in bidx: parts.append((cs,m[i][1])); cs=m[i+1][0]
    parts.append((cs,m[-1][1]))
    texts=re.split(r'\[pause[^\]]*\]',s['text']); ws=s['words']; ptr=0; groups=[]
    for tx in texts: n=len(tx.split()); groups.append(ws[ptr:ptr+n]); ptr+=n
    for (p0,p1),g in zip(parts,groups):
        if not g: continue
        o0,o1=g[0]['startMs'],g[-1]['endMs']; t0,t1=(a+p0)*10,(a+p1)*10
        for w in g:
            f=lambda v:t0+(v-o0)/(o1-o0)*(t1-t0)
            out.append({'w':w['w'],'s':round(f(w['startMs'])/1000,3),'e':round(f(w['endMs'])/1000,3),'i':len(out)})
open('words.js','w').write('WORDS='+json.dumps(out)+';\n'); print(len(out),'words')
