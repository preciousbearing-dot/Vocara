// Helpers for 16-bit mono PCM and WAV files.

export function silencePcm(ms, rate = 24000) {
  const samples = Math.round((ms / 1000) * rate);
  return new Uint8Array(samples * 2);
}

export function concatBytes(chunks) {
  let total = 0;
  for (const c of chunks) total += c.length;
  const out = new Uint8Array(total);
  let off = 0;
  for (const c of chunks) { out.set(c, off); off += c.length; }
  return out;
}

export function pcmDurationMs(pcm, rate = 24000) {
  return Math.round((pcm.length / 2 / rate) * 1000);
}

export function pcmToWav(pcm, rate = 24000) {
  const channels = 1;
  const bits = 16;
  const header = new ArrayBuffer(44);
  const v = new DataView(header);
  const w = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
  w(0, 'RIFF'); v.setUint32(4, 36 + pcm.length, true); w(8, 'WAVE');
  w(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true);
  v.setUint16(22, channels, true); v.setUint32(24, rate, true);
  v.setUint32(28, (rate * channels * bits) / 8, true);
  v.setUint16(32, (channels * bits) / 8, true); v.setUint16(34, bits, true);
  w(36, 'data'); v.setUint32(40, pcm.length, true);
  return concatBytes([new Uint8Array(header), pcm]);
}

// Reads the PCM and rate back out of a WAV produced by pcmToWav.
export function wavToPcm(wav) {
  const v = new DataView(wav.buffer, wav.byteOffset, wav.byteLength);
  return { rate: v.getUint32(24, true), pcm: wav.subarray(44) };
}

// Cuts leading/trailing near-silence, keeping a small pad so words are not clipped.
export function trimSilence(pcm, rate = 24000, { threshold = 400, headMs = 40, tailMs = 120 } = {}) {
  const n = pcm.length >> 1;
  const dv = new DataView(pcm.buffer, pcm.byteOffset, pcm.byteLength);
  let first = -1; let last = -1;
  for (let i = 0; i < n; i++) {
    if (Math.abs(dv.getInt16(i * 2, true)) > threshold) { if (first < 0) first = i; last = i; }
  }
  if (first < 0) return pcm.slice(0, 0);
  const head = Math.round((headMs * rate) / 1000);
  const tail = Math.round((tailMs * rate) / 1000);
  const start = Math.max(0, first - head);
  const end = Math.min(n, last + 1 + tail);
  return pcm.slice(start * 2, end * 2);
}

// Evens out loudness between clips: pulls each clip toward a target RMS without clipping.
export function normalizePcm(pcm, { targetRms = 3000, peak = 31000, maxGain = 4 } = {}) {
  const n = pcm.length >> 1;
  if (!n) return pcm;
  const dv = new DataView(pcm.buffer, pcm.byteOffset, pcm.byteLength);
  let sum = 0; let pk = 0;
  for (let i = 0; i < n; i++) { const v = dv.getInt16(i * 2, true); sum += v * v; if (Math.abs(v) > pk) pk = Math.abs(v); }
  const rms = Math.sqrt(sum / n);
  if (rms < 1 || pk === 0) return pcm;
  let gain = Math.min(maxGain, targetRms / rms);
  if (pk * gain > peak) gain = peak / pk;
  if (Math.abs(gain - 1) < 0.02) return pcm;
  const out = new Uint8Array(pcm.length);
  const od = new DataView(out.buffer);
  for (let i = 0; i < n; i++) od.setInt16(i * 2, Math.max(-32768, Math.min(32767, Math.round(dv.getInt16(i * 2, true) * gain))), true);
  return out;
}

// Finds a quiet stretch (a breath between phrases) near `fraction` of the way through a clip.
// Used to place a [pause] inside one request instead of paying for two.
// Returns the sample index at the middle of the gap, or -1 when there is no clear one.
export function findGap(pcm, rate, fraction, { frameMs = 10, minGapMs = 100, windowFrac = 0.2, fromSample = 0 } = {}) {
  const n = pcm.length >> 1;
  const frame = Math.max(1, Math.round((frameMs * rate) / 1000));
  const frames = Math.floor(n / frame);
  if (frames < 10) return -1;
  const dv = new DataView(pcm.buffer, pcm.byteOffset, pcm.byteLength);
  const rms = new Float64Array(frames);
  for (let f = 0; f < frames; f++) {
    let sum = 0;
    for (let i = f * frame; i < (f + 1) * frame; i++) { const v = dv.getInt16(i * 2, true); sum += v * v; }
    rms[f] = Math.sqrt(sum / frame);
  }
  const sorted = Array.from(rms).sort((a, b) => a - b);
  const loud = sorted[Math.floor(frames * 0.9)];
  const thr = Math.max(100, loud * 0.1);
  const target = fraction * frames;
  const win = Math.max(50, windowFrac * frames);
  const minRun = Math.max(1, Math.round(minGapMs / frameMs));
  const startF = Math.ceil(fromSample / frame);
  let best = -1; let bestDist = Infinity;
  let f = 0;
  while (f < frames) {
    if (rms[f] >= thr) { f++; continue; }
    let e = f;
    while (e < frames && rms[e] < thr) e++;
    const centre = (f + e) / 2;
    if (e - f >= minRun && centre > startF && Math.abs(centre - target) <= win && Math.abs(centre - target) < bestDist) {
      best = centre; bestDist = Math.abs(centre - target);
    }
    f = e;
  }
  return best < 0 ? -1 : Math.round(best * frame);
}

// True when a clip is far longer than the text could take to say, which is what happens when the
// voice also reads the style notes aloud. 7 characters per second is slower than any real narration.
export function runsTooLong(durationMs, text) {
  const chars = String(text || '').length;
  return chars > 0 && durationMs > (chars / 7) * 1000 + 3000;
}

// ---------------------------------------------------------------------------------------------
// Newer Gemini voice models (3.8 and up) answer with a complete WAV file, not bare PCM: a 44-byte
// header in front, and after the audio a block of provenance data (a "C2PA" chunk, about 6 KB).
// Played as sound, the header is a click at the start and the C2PA block is a burst of static
// at the end. This returns only the audio samples. Bare PCM passes through untouched.
export function unwrapWav(bytes) {
  const ascii = (o, n) => String.fromCharCode(...bytes.subarray(o, o + n));
  if (!bytes || bytes.length < 12 || ascii(0, 4) !== 'RIFF' || ascii(8, 4) !== 'WAVE') return { pcm: bytes, rate: 0, wrapped: false };
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let rate = 0; let pos = 12;
  while (pos + 8 <= bytes.length) {
    const id = ascii(pos, 4);
    const size = dv.getUint32(pos + 4, true);
    const body = pos + 8;
    if (id === 'fmt ' && body + 16 <= bytes.length) rate = dv.getUint32(body + 4, true);
    if (id === 'data') {
      const avail = bytes.length - body;
      let len = size > 0 && size <= avail ? size : avail; // a streamed file can leave the size blank
      len -= len % 2;
      return { pcm: bytes.slice(body, body + len), rate, wrapped: true };
    }
    pos = body + size + (size % 2);
  }
  return { pcm: bytes, rate: 0, wrapped: false };
}

// 8 ms fade at both ends so a cut never clicks.
export function fadeEdges(pcm, rate = 24000, ms = 8) {
  const n = pcm.length >> 1;
  const f = Math.min(Math.round((ms * rate) / 1000), n >> 1);
  if (f < 2) return pcm;
  const out = pcm.slice();
  const dv = new DataView(out.buffer, out.byteOffset, out.byteLength);
  for (let i = 0; i < f; i++) {
    const g = i / f;
    dv.setInt16(i * 2, Math.round(dv.getInt16(i * 2, true) * g), true);
    const j = n - 1 - i;
    dv.setInt16(j * 2, Math.round(dv.getInt16(j * 2, true) * g), true);
  }
  return out;
}

// ---------------------------------------------------------------------------------------------
// Repeat detection. Gemini sometimes reads the whole script twice in one clip. Speaking speed
// varies by style, so this does not rely on length alone: it takes the opening two seconds and
// searches the rest of the clip for the same speech (dynamic time warping on band energies).
const FFT_N = 512;
const BANDS = 16;
const SEED = (() => { // band edges, log spaced from FFT bin 4 to 200
  const e = [];
  for (let i = 0; i <= BANDS; i++) e.push(Math.floor(4 * (200 / 4) ** (i / BANDS)));
  return e;
})();
const HANN = Float64Array.from({ length: FFT_N }, (_, i) => 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (FFT_N - 1)));

function fftMag2(x) { // radix-2 FFT of a real frame; returns power of bins 0..N/2
  const n = FFT_N; const re = Float64Array.from(x); const im = new Float64Array(n);
  for (let i = 1, j = 0; i < n; i++) { // bit reversal
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) { const t = re[i]; re[i] = re[j]; re[j] = t; }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (-2 * Math.PI) / len; const wr = Math.cos(ang); const wi = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let cr = 1; let ci = 0;
      for (let k = 0; k < len / 2; k++) {
        const a = i + k; const b = a + len / 2;
        const tr = re[b] * cr - im[b] * ci; const ti = re[b] * ci + im[b] * cr;
        re[b] = re[a] - tr; im[b] = im[a] - ti; re[a] += tr; im[a] += ti;
        const nr = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = nr;
      }
    }
  }
  const p = new Float64Array(n / 2 + 1);
  for (let i = 0; i <= n / 2; i++) p[i] = re[i] * re[i] + im[i] * im[i];
  return p;
}

function frameFeatures(pcm, rate) {
  const dv = new DataView(pcm.buffer, pcm.byteOffset, pcm.byteLength);
  const n = pcm.length >> 1; const hop = Math.round(0.02 * rate);
  const feats = []; const energy = [];
  const buf = new Float64Array(FFT_N);
  for (let s = 0; s + FFT_N < n; s += hop) {
    for (let i = 0; i < FFT_N; i++) buf[i] = (dv.getInt16((s + i) * 2, true) / 32768) * HANN[i] * 32768;
    const p = fftMag2(buf);
    const f = new Float64Array(BANDS); let e = 0;
    for (let b = 0; b < BANDS; b++) {
      let sum = 0;
      for (let k = SEED[b]; k < SEED[b + 1]; k++) sum += p[k];
      f[b] = Math.log(sum + 1); e += f[b];
    }
    energy.push(e);
    const mean = f.reduce((a, c) => a + c, 0) / BANDS;
    let norm = 0;
    for (let b = 0; b < BANDS; b++) { f[b] -= mean; norm += f[b] * f[b]; }
    norm = Math.sqrt(norm) + 1e-9;
    for (let b = 0; b < BANDS; b++) f[b] /= norm;
    feats.push(f);
  }
  return { feats, energy, hopSec: hop / rate };
}

function subseqDtw(A, B) { // best normalised cost of A anywhere inside B, and where it ends
  const n = A.length; const m = B.length;
  let prev = new Float64Array(m); let cur = new Float64Array(m);
  const cost = (i, k) => { let d = 0; const a = A[i]; const b = B[k]; for (let c = 0; c < BANDS; c++) d += a[c] * b[c]; return 1 - d; };
  for (let k = 0; k < m; k++) prev[k] = cost(0, k);
  for (let i = 1; i < n; i++) {
    cur[0] = cost(i, 0) + prev[0];
    for (let k = 1; k < m; k++) cur[k] = cost(i, k) + Math.min(prev[k], prev[k - 1], cur[k - 1]);
    [prev, cur] = [cur, prev];
  }
  let best = Infinity; let at = 0;
  for (let k = 0; k < m; k++) if (prev[k] < best) { best = prev[k]; at = k; }
  return { cost: best / n, end: at };
}

// Judges a fresh take. Returns { ok, reason: '' | 'repeat' | 'slow', repeatAt (seconds), msPerChar, ratio }.
export function checkTake(pcm, rate, text) {
  const chars = String(text || '').length;
  const durSec = pcm.length / 2 / rate;
  const out = { ok: true, reason: '', repeat: false, repeatAt: 0, msPerChar: chars ? (durSec * 1000) / chars : 0, ratio: 1 };
  if (chars < 40 || durSec < 5) return out;
  const slow = out.msPerChar > 115; // over 115 ms a character is under 9 characters a second
  const { feats, energy, hopSec } = frameFeatures(pcm, rate);
  const sorted = [...energy].sort((a, b) => a - b);
  const thr = sorted[Math.floor(sorted.length * 0.4)];
  const a0 = energy.findIndex((e) => e > thr);
  const len = Math.round(2 / hopSec); const skip = Math.round(0.4 / hopSec);
  if (a0 < 0 || feats.length < a0 + len + skip + len) return slow ? { ...out, ok: false, reason: 'slow' } : out;
  const A = feats.slice(a0, a0 + len); const B = feats.slice(a0 + len + skip);
  const real = subseqDtw(A, B);
  const nul = subseqDtw(A.slice().reverse(), B);
  const ratio = real.cost / (nul.cost || 1);
  const startFrame = a0 + len + skip + real.end - len + 1;
  const repeatAt = startFrame * hopSec;
  out.ratio = ratio; out.repeatAt = repeatAt;
  out.repeat = ratio < 0.82 && repeatAt >= durSec * 0.3;
  if (out.repeat && out.msPerChar > 75) return { ...out, ok: false, reason: 'repeat' };
  return slow ? { ...out, ok: false, reason: 'slow' } : out;
}

// For a take that says everything twice: keeps the first copy, cut at the breath before the second.
// Returns the shorter clip, or null when the two halves are too different to trust the cut.
export function cutRepeat(pcm, rate, repeatAt) {
  const total = pcm.length >> 1;
  const at = findGap(pcm, rate, (repeatAt * rate) / total, { windowFrac: 0.08, minGapMs: 60 });
  if (at < 0) return null;
  const first = at; const second = total - at;
  if (Math.abs(first - second) / Math.max(first, second) > 0.35) return null;
  return pcm.slice(0, at * 2);
}
