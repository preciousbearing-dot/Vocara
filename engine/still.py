import sys
from playwright.sync_api import sync_playwright
ts=[float(a) for a in sys.argv[1:]]
with sync_playwright() as p:
    b=p.chromium.launch(args=['--no-sandbox','--disable-gpu']);pg=b.new_page(viewport={'width':1080,'height':1920})
    msgs=[];pg.on('console',lambda m:msgs.append(m.text));pg.on('pageerror',lambda e:msgs.append('ERR '+str(e)))
    pg.goto('file:///home/claude/work/v2/video.html');pg.wait_for_timeout(300)
    for t in ts:
        pg.evaluate(f'renderAt({t})');pg.locator('#c').screenshot(path=f'st_{t:06.2f}.png')
    print('\n'.join(msgs[:10]));b.close()
