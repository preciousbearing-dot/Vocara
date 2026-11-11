// clip() end to end with a fake Google and an in-memory store: old bad takes heal, repeats are
// repaired, and a repair costs one request, not two.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const mem = new Map();
globalThis.window = { localStorage: { getItem: (k) => (mem.has(k) ? mem.get(k) : null), setItem: (k, v) => mem.set(k, String(v)), removeItem: (k) => mem.delete(k) } };
const { clip, cache, store } = await import('../www/js/services.js');
const { pcmToWav, wavToPcm, concatBytes, silencePcm, checkTake, pcmDurationMs } = await import('../www/js/wav.js');

const { pcm: CLEAN, rate: RATE } = wavToPcm(new Uint8Array(readFileSync(new URL('./fixtures/clean_scene.wav', import.meta.url))));
const TEXT = "The survivors in this world belong to a group. Because the moment you join one, you can teach, trade, and be taught. That's how humans always won. Not alone. Together.";
const stretch = (pcm, f) => {
  const n = pcm.length >> 1; const m = Math.floor(n / f); const o = new Uint8Array(m * 2);
  const a = new DataView(pcm.buffer, pcm.byteOffset, pcm.byteLength); const b = new DataView(o.buffer);
  for (let i = 0; i < m; i++) { const p = i * f; const k = Math.floor(p); const t = p - k; const x = a.getInt16(k * 2, true); const y = a.getInt16(Math.min(k + 1, n - 1) * 2, true); b.setInt16(i * 2, Math.round(x + (y - x) * t), true); }
  return o;
};
const TWICE = concatBytes([CLEAN, silencePcm(900, RATE), stretch(CLEAN, 1.04)]);
const c2pa = () => { const c = new Uint8Array(8 + 6066); c.set([0x43, 0x32, 0x50, 0x41], 0); new DataView(c.buffer).setUint32(4, 6065, true); for (let i = 8; i < c.length; i++) c[i] = (i * 37) & 255; return c; };
const geminiWav = (pcm) => concatBytes([pcmToWav(pcm, RATE), c2pa()]);

test('a take saved by the old app (WAV header + static + repeat) is healed for free', async () => {
  const params = { model: 'gemini-3.8-flash-tts', voice: 'Leda', style: '', text: TEXT, take: 0 };
  // the old app stored the raw response bytes as if they were PCM
  await cache.save(params, { wav: pcmToWav(geminiWav(TWICE), RATE), rate: RATE, ms: 1, model: 'gemini-3.8-flash-tts' });
  const got = await clip({ voice: 'Leda', text: TEXT, model: 'gemini-3.8-flash-tts' });
  assert.equal(got.cached, true);
  assert.equal(got.value.repaired, true);
  const { pcm, rate } = wavToPcm(got.value.wav);
  assert.equal(checkTake(pcm, rate, TEXT).ok, true);
  assert.ok(Math.abs(pcmDurationMs(pcm, rate) - 11247) < 1500, `length ${pcmDurationMs(pcm, rate)}`);
  assert.notEqual(String.fromCharCode(...pcm.subarray(0, 4)), 'RIFF');
  // second call is a plain cache hit
  assert.equal((await clip({ voice: 'Leda', text: TEXT, model: 'gemini-3.8-flash-tts' })).cached, true);
});

test('a fresh take that says the script twice is repaired from one request', async () => {
  store.setKey('K');
  let calls = 0;
  globalThis.fetch = async (url) => {
    calls++;
    if (url.endsWith('/models?pageSize=200')) return { ok: true, json: async () => ({ models: [{ name: 'models/gemini-3.8-flash-tts' }] }) };
    return { ok: true, json: async () => ({ steps: [{ content: [{ type: 'audio', mime_type: 'audio/wav', data: Buffer.from(geminiWav(TWICE)).toString('base64') }] }] }) };
  };
  const got = await clip({ voice: 'Kore', text: TEXT, model: 'gemini-3.8-flash-tts', style: 'warm' });
  assert.equal(got.cached, false);
  assert.equal(got.value.repaired, true);
  const speech = [];
  speech.push(calls);
  assert.ok(calls <= 2, `calls ${calls}`); // one model listing at most, one speech request
  const { pcm, rate } = wavToPcm(got.value.wav);
  assert.equal(checkTake(pcm, rate, TEXT).ok, true);
});

test('a take that cannot be repaired is retried once, never saved, then reported', async () => {
  let speech = 0;
  globalThis.fetch = async (url) => {
    if (url.endsWith('/models?pageSize=200')) return { ok: true, json: async () => ({ models: [{ name: 'models/gemini-3.8-flash-tts' }] }) };
    speech++;
    // far too long for the text, and not a clean repeat: noise-like sweep
    const n = RATE * 40; const o = new Uint8Array(n * 2); const dv = new DataView(o.buffer);
    for (let i = 0; i < n; i++) dv.setInt16(i * 2, Math.round(Math.sin(i * i * 1e-7) * 9000), true);
    return { ok: true, json: async () => ({ steps: [{ content: [{ type: 'audio', mime_type: 'audio/wav', data: Buffer.from(geminiWav(o)).toString('base64') }] }] }) };
  };
  await assert.rejects(clip({ voice: 'Kore', text: TEXT, model: 'gemini-3.8-flash-tts', style: 'other', take: 3 }), /style notes|twice/);
  assert.equal(speech, 2);
  assert.equal(await cache.lookup({ model: 'gemini-3.8-flash-tts', voice: 'Kore', style: 'other', text: TEXT, take: 3 }), null);
});
