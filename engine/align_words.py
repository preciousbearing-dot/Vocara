"""Audio-aligned word times (replaces the character-proportional spread in warp_words.py).
usage: python3 align_words.py <voice.wav> <name.timings.json> <out words.js> [--compare old_words.js]

Per scene: find voiced frames (10 ms hop), then choose word boundaries with dynamic programming so that
  (a) each word's VOICED duration is close to its expected share (syllables + length),
  (b) boundaries fall in energy dips / silences (extra weight after . ? ! : , words).
Silent gaps (pauses, breaths) therefore end up BETWEEN words instead of stretching them.
Also prints a sync check: how far each word start is from the nearest audio onset.
This is an automated sanity check, not ground truth: always confirm by watching the final file."""
import json, re, sys
import numpy as np
import scipy.io.wavfile as wf

HOP_MS = 10

def syllables(w):
    w = re.sub(r"[^a-z']", "", w.lower())
    n = len(re.findall(r"[aeiouy]+", w))
    if w.endswith("e") and not w.endswith(("le", "ee")) and n > 1:
        n -= 1
    return max(1, n)

def weight(w):
    return syllables(w) + 0.1 * len(re.sub(r"[^A-Za-z]", "", w))

def load_env(path):
    sr, y = wf.read(path)
    y = y.astype(float)
    if y.ndim > 1:
        y = y.mean(1)
    y /= max(abs(y).max(), 1e-9)
    hop = int(sr * HOP_MS / 1000)
    win = hop * 2
    env = np.array([np.sqrt((y[i:i + win] ** 2).mean()) for i in range(0, len(y) - win, hop)])
    return sr, env

def smooth(a, n=3):
    k = np.ones(2 * n + 1) / (2 * n + 1)
    return np.convolve(a, k, mode="same")

def align_scene(env_s, voiced, scene, thr_hi):
    a = int(scene["startMs"] / HOP_MS)
    e = min(int(scene["endMs"] / HOP_MS), len(voiced))
    seg_v = voiced[a:e]
    idx = np.where(seg_v)[0]
    if len(idx) == 0:
        raise SystemExit("scene %d has no voiced frames" % scene["index"])
    f0, f1 = idx[0], idx[-1] + 1            # first voiced frame, one past last voiced frame
    v = seg_v[f0:f1].astype(int)
    en = env_s[a + f0:a + f1] / thr_hi      # normalised energy, ~1 = loud speech
    F = len(v)
    V = np.concatenate([[0], np.cumsum(v)])  # voiced frames in [0, t)
    words = scene["words"]
    N = len(words)
    wts = np.array([weight(w["w"]) for w in words])
    rate = V[F] / wts.sum()                  # voiced frames per weight unit
    D = wts * rate
    # boundary cost at position t (between frame t-1 and t): energy around it
    en_pad = np.concatenate([[0], en, [0]])
    bc = np.minimum(en_pad[:F + 1], en_pad[1:F + 2])   # min of both sides: gap -> ~0
    bc = np.clip(bc, 0, 1.5)
    punct = np.array([1.0 if re.search(r"[.?!:,]$", w["w"]) else 0.0 for w in words])
    lam = 0.9
    t = np.arange(F + 1)
    INF = 1e12
    cost = np.full((N, F + 1), INF)
    back = np.zeros((N, F + 1), dtype=int)
    dv0 = V - V[0]
    c0 = ((dv0 - D[0]) / D[0]) ** 2 + lam * (1 + 2 * punct[0]) * bc
    c0[dv0 < 3] = INF
    c0[0] = INF
    cost[0] = c0
    dv = V[None, :] - V[:, None]             # dv[i,j] = voiced frames between boundary i and j
    valid = (t[None, :] > t[:, None]) & (dv >= 3)
    for k in range(1, N):
        wc = ((dv - D[k]) / D[k]) ** 2 + lam * (1 + 2 * punct[k]) * bc[None, :]
        if k == N - 1:
            wc = ((dv - D[k]) / D[k]) ** 2
        m = cost[k - 1][:, None] + np.where(valid, wc, INF)
        back[k] = np.argmin(m, axis=0)
        cost[k] = m[back[k], t]
    j = F
    bounds = [F]
    for k in range(N - 1, 0, -1):
        j = back[k][j]
        bounds.append(j)
    bounds = bounds[::-1]                    # end boundary of each word (N values)
    out = []
    prev = 0
    for k, w in enumerate(words):
        end = bounds[k]
        s = prev
        while s < end and not v[s]:
            s += 1
        ee = end
        while ee > s and not v[ee - 1]:
            ee -= 1
        out.append((w["w"], (a + f0 + s) * HOP_MS / 1000, (a + f0 + ee) * HOP_MS / 1000))
        prev = end
    return out

def onsets(env_s):
    d = np.zeros_like(env_s)
    d[3:-3] = env_s[6:] - env_s[:-6]
    thr = np.percentile(d[d > 0], 60)
    ons = []
    for i in range(3, len(d) - 3):
        if d[i] > thr and d[i] >= d[i - 1] and d[i] >= d[i + 1]:
            if not ons or (i - ons[-1]) * HOP_MS >= 60:
                ons.append(i)
    return np.array(ons) * HOP_MS / 1000

def sync_report(starts, ons, label):
    dist = np.array([np.min(np.abs(ons - s)) for s in starts])
    print("%-14s word-start to nearest audio onset: median %.3fs, p90 %.3fs, max %.3fs, within 0.12s: %.0f%%"
          % (label, np.median(dist), np.percentile(dist, 90), dist.max(), 100 * (dist <= 0.12).mean()))
    return dist

def main():
    wav, tj, outp = sys.argv[1], sys.argv[2], sys.argv[3]
    d = json.load(open(tj))
    sr, env = load_env(wav)
    env_s = smooth(env, 2)
    thr = max(env_s.max() * 0.03, 0.004)
    voiced = env_s > thr
    thr_hi = np.percentile(env_s[voiced], 90)
    out = []
    for sc in d["scenes"]:
        for w, s, e in align_scene(env_s, voiced, sc, thr_hi):
            out.append({"w": w, "s": round(s, 3), "e": round(e, 3), "i": len(out)})
    open(outp, "w").write("WORDS=" + json.dumps(out) + ";\n")
    print(len(out), "words ->", outp)
    ons = onsets(env_s)
    new = np.array([w["s"] for w in out])
    sync_report(new, ons, "aligned")
    if "--compare" in sys.argv:
        old = json.loads(open(sys.argv[sys.argv.index("--compare") + 1]).read().split("=", 1)[1].rstrip().rstrip(";"))
        olds = np.array([w["s"] for w in old])
        sync_report(olds, ons, "old (warp)")
        diff = np.abs(new - olds)
        print("aligned vs old start times: median %.3fs, max %.3fs" % (np.median(diff), diff.max()))

if __name__ == "__main__":
    main()
