import sys,subprocess
from PIL import Image
ts=[float(a) for a in sys.argv[2:]];out=sys.argv[1]
subprocess.run(['python3','still.py']+[str(t) for t in ts],check=True)
n=len(ts);cols=min(n,6);rows=(n+cols-1)//cols
s=Image.new('RGB',(cols*270,rows*480))
for i,t in enumerate(ts):
    im=Image.open(f'st_{t:06.2f}.png').resize((270,480));s.paste(im,((i%cols)*270,(i//cols)*480))
s.save(out)
