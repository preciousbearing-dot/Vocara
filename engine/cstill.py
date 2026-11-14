"""stills for the 16:9 Cobra Effect: python3 cstill.py OUTDIR t1 t2 ...  -> OUTDIR/st_<t>.png (1920x1080), prints console errors"""
import sys,os
from playwright.sync_api import sync_playwright
out=sys.argv[1];ts=[float(a) for a in sys.argv[2:]];os.makedirs(out,exist_ok=True)
here=os.path.dirname(os.path.abspath(__file__))
with sync_playwright() as p:
    b=p.chromium.launch(args=['--no-sandbox','--disable-gpu']);pg=b.new_page(viewport={'width':1920,'height':1080})
    msgs=[];pg.on('console',lambda m:msgs.append(m.text));pg.on('pageerror',lambda e:msgs.append('ERR '+str(e)))
    pg.goto('file://'+here+'/cobra.html?w=1920&h=1080');pg.wait_for_timeout(400)
    for t in ts:
        pg.evaluate(f'renderAt({t})');pg.locator('#c').screenshot(path=f'{out}/st_{t:06.2f}.png')
    print('\n'.join(dict.fromkeys(msgs[:12])));b.close()
