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
