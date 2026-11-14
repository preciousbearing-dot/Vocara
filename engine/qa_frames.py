"""every-frame QA for the Cobra Effect: python3 qa_frames.py [step]  (step=1 -> every frame)
checks: frame0 non-blank/has cover title, overlays inside safe area, story-critical props >=90% on screen, caption word == word active at that time"""
import sys,json
from playwright.sync_api import sync_playwright
step=int(sys.argv[1]) if len(sys.argv)>1 else 1
JS="""(args)=>{const [a,b,st]=args,bad=[];const SR={x0:W*SAFE.l-2,x1:W*(1-SAFE.l)+2,y0:H*SAFE.t-2};
for(let f=a;f<b;f+=st){const t=f/30;renderAt(t);
 for(const o of OVL){if(o.focus){const vw=Math.max(0,Math.min(o.x1,W)-Math.max(o.x0,0)),vh=Math.max(0,Math.min(o.y1,H)-Math.max(o.y0,0)),fr=vw*vh/((o.x1-o.x0)*(o.y1-o.y0));if(fr<.9)bad.push([f,'focus-cut',o.n,+fr.toFixed(2)])}
  else if(o.n!=='caption'){if(o.x0<SR.x0||o.x1>SR.x1||o.y0<SR.y0||o.y1>CAP.top+H*.02)bad.push([f,'overlay-out',o.n,Math.round(o.x0),Math.round(o.y0),Math.round(o.x1),Math.round(o.y1)])}
  else{if(o.x0<SR.x0||o.x1>SR.x1)bad.push([f,'caption-out',Math.round(o.x0),Math.round(o.x1)])}}
 const cw=captionAt(t),ex=WORDS.find(w=>t>=w.s&&t<w.e);if(ex&&(!cw||cw.i!==ex.i))bad.push([f,'caption-mismatch',cw&&cw.w,ex.w]);
 }return bad}"""
with sync_playwright() as p:
    b=p.chromium.launch(args=['--no-sandbox','--disable-gpu']);pg=b.new_page(viewport={'width':1920,'height':1080})
    errs=[];pg.on('pageerror',lambda e:errs.append(str(e)));pg.goto('file://'+__import__('os').path.dirname(__import__('os').path.abspath(__file__))+'/cobra.html?w=1920&h=1080');pg.wait_for_timeout(400)
    N=int(78.6*30);bad=pg.evaluate(JS,[0,N,step])
    # frame 0 check
    pg.evaluate('renderAt(0)');px=pg.evaluate("(()=>{const d=x.getImageData(0,0,W,H).data;let s=0,n=0;for(let i=0;i<d.length;i+=4*97){s+=d[i]+d[i+1]+d[i+2];n++}return s/n/3})()")
    print('frame0 mean luma',round(px,1),'(blank would be ~flat brown <60 or 0)');print('errors',errs[:5])
    from collections import Counter
    print('total issues',len(bad));c=Counter((x[1],x[2] if x[1]!='caption-mismatch' else '') for x in bad)
    for k,v in c.most_common(25):print(v,k,[x[0] for x in bad if (x[1],x[2] if x[1]!='caption-mismatch' else '')==k][:3])
    json.dump(bad,open('qa_out.json','w'));b.close()
