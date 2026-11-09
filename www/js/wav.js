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
