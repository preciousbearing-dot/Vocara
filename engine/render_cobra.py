import sys, os, subprocess, time, threading, queue
from playwright.sync_api import sync_playwright
FPS=30; DUR=78.6; N=int(round(DUR*FPS)); NS=12
bounds=[round(N*i/NS) for i in range(NS+1)]
segs=[(i,bounds[i],bounds[i+1]) for i in range(NS)]
out='/tmp/claude-0/-home-claude/ebf4de3f-52e0-56c2-a68b-a62648a942a9/scratchpad/segs'; os.makedirs(out,exist_ok=True)
q=queue.Queue()
for s in segs:
    if not os.path.exists(f'{out}/s{s[0]}.mp4'): q.put(s)
def worker():
    with sync_playwright() as p:
        b=p.chromium.launch(args=['--no-sandbox','--disable-gpu'])
        pg=b.new_page(viewport={'width':1920,'height':1080})
        pg.goto('file:///home/claude/vocara/engine/cobra.html?w=1920&h=1080'); pg.wait_for_timeout(300)
        el=pg.locator('#c')
        while True:
            try: i,a,e=q.get_nowait()
            except queue.Empty: break
            tmp=f'{out}/s{i}.tmp.mp4'; fin=f'{out}/s{i}.mp4'
            ff=subprocess.Popen(['ffmpeg','-y','-loglevel','error','-f','image2pipe','-framerate',str(FPS),'-c:v','mjpeg','-i','-','-c:v','libx264','-preset','veryfast','-crf','18','-pix_fmt','yuv420p','-r',str(FPS),tmp],stdin=subprocess.PIPE)
            t0=time.time()
            for f in range(a,e):
                pg.evaluate(f'renderAt({f/FPS})')
                ff.stdin.write(el.screenshot(type='jpeg',quality=92))
            ff.stdin.close(); rc=ff.wait()
            if rc==0: os.rename(tmp,fin)
            print(f'segment {i} {a}-{e} {time.time()-t0:.0f}s rc={rc}',flush=True)
        b.close()
ths=[threading.Thread(target=worker) for _ in range(2)]
[t.start() for t in ths]; [t.join() for t in ths]
print('ALLDONE')
