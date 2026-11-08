import test from 'node:test';
import assert from 'node:assert/strict';
import { parseScript, splitScenes } from '../www/js/tags.js';
import { pcmToWav, wavToPcm, silencePcm, pcmDurationMs, concatBytes } from '../www/js/wav.js';
import { srtTime, buildSrt } from '../www/js/srt.js';
import { buildPrompt, buildSynthBody, synth, testKey, GeminiError, sampleRateFromMime } from '../www/js/gemini.js';
import { createCache, memoryAdapter, cacheKey } from '../www/js/cache.js';
import { createStore, maskKey, looksLikeKey, DEFAULTS } from '../www/js/store.js';
import { VOICES, findVoice } from '../www/js/voices.js';

test('parseScript turns pause tags into exact silence', () => {
  const p = parseScript('Hello there. [pause 0.6s] Next line. [pause 250ms] End.');
  assert.deepEqual(p, [
    { type: 'text', text: 'Hello there.' },
    { type: 'pause', ms: 600 },
    { type: 'text', text: 'Next line.' },
    { type: 'pause', ms: 250 },
    { type: 'text', text: 'End.' },
  ]);
});

test('parseScript leaves other tags for the model and caps long pauses', () => {
  const p = parseScript('[whispers] Quiet now. [pause 99s]');
  assert.equal(p[0].text, '[whispers] Quiet now.');
  assert.equal(p[1].ms, 10000);
});

test('splitScenes splits on blank lines', () => {
  assert.deepEqual(splitScenes('One.\nStill one.\n\n\nTwo.\n\nThree.'), ['One.\nStill one.', 'Two.', 'Three.']);
});

test('wav round trip keeps the audio and the rate', () => {
  const pcm = new Uint8Array([1, 0, 2, 0, 3, 0, 4, 0]);
  const wav = pcmToWav(pcm, 24000);
  assert.equal(wav.length, 44 + pcm.length);
  assert.equal(String.fromCharCode(...wav.subarray(0, 4)), 'RIFF');
  const back = wavToPcm(wav);
  assert.equal(back.rate, 24000);
  assert.deepEqual(Array.from(back.pcm), Array.from(pcm));
});

test('silence and duration maths agree', () => {
  const s = silencePcm(500, 24000);
  assert.equal(s.length, 24000);
  assert.equal(pcmDurationMs(s, 24000), 500);
  assert.equal(concatBytes([s, s]).length, 48000);
});

test('srt time and cues format correctly', () => {
  assert.equal(srtTime(3723456), '01:02:03,456');
  assert.equal(buildSrt([{ start: 0, end: 1500, text: 'Hi' }]), '1\n00:00:00,000 --> 00:00:01,500\nHi\n');
});

test('prompt and request body follow the documented shape', () => {
  assert.equal(buildPrompt('Say calmly.', 'Hello'), 'Say calmly: Hello');
  assert.equal(buildPrompt('', 'Hello'), 'Hello');
  const b = buildSynthBody({ model: 'm', voice: 'Kore', text: 'Hi', style: '' });
  assert.deepEqual(b.generationConfig.responseModalities, ['AUDIO']);
  assert.equal(b.generationConfig.speechConfig.voiceConfig.prebuiltVoiceConfig.voiceName, 'Kore');
  assert.equal(sampleRateFromMime('audio/L16;codec=pcm;rate=24000'), 24000);
  assert.equal(sampleRateFromMime(undefined), 24000);
});

function fakeFetch(status, body) {
  const calls = [];
  const f = async (url, opts) => {
    calls.push({ url, opts });
    return { ok: status >= 200 && status < 300, status, json: async () => body };
  };
  f.calls = calls;
  return f;
}

test('synth returns pcm from a good response and sends the key as a header', async () => {
  const b64 = Buffer.from([9, 0, 8, 0]).toString('base64');
  const f = fakeFetch(200, { candidates: [{ content: { parts: [{ inlineData: { data: b64, mimeType: 'audio/L16;rate=24000' } }] } }] });
  const out = await synth({ key: 'K', model: 'm', voice: 'Kore', text: 'Hi', fetchImpl: f });
  assert.deepEqual(Array.from(out.pcm), [9, 0, 8, 0]);
  assert.equal(out.rate, 24000);
  assert.equal(f.calls[0].opts.headers['x-goog-api-key'], 'K');
  assert.ok(!f.calls[0].url.includes('K'), 'key must not be in the url');
});

test('synth maps errors to readable kinds', async () => {
  const cases = [[429, 'quota'], [403, 'key'], [404, 'model'], [500, 'server'], [418, 'request']];
  for (const [status, kind] of cases) {
    await assert.rejects(
      synth({ key: 'K', voice: 'Kore', text: 'Hi', fetchImpl: fakeFetch(status, { error: { message: 'x' } }) }),
      (e) => e instanceof GeminiError && e.kind === kind,
    );
  }
  await assert.rejects(
    synth({ key: 'K', voice: 'Kore', text: 'Hi', fetchImpl: fakeFetch(200, { candidates: [] }) }),
    (e) => e.kind === 'empty',
  );
  await assert.rejects(
    synth({ key: 'K', voice: 'Kore', text: 'Hi', fetchImpl: async () => { throw new TypeError('offline'); } }),
    (e) => e.kind === 'network',
  );
});

test('testKey reports whether the chosen model is reachable', async () => {
  const f = fakeFetch(200, { models: [{ name: 'models/gemini-3.1-flash-tts-preview' }, { name: 'models/other' }] });
  const r = await testKey({ key: 'K', model: 'gemini-3.1-flash-tts-preview', fetchImpl: f });
  assert.equal(r.ok, true);
  assert.equal(r.modelAvailable, true);
  assert.deepEqual(r.ttsModels, ['gemini-3.1-flash-tts-preview']);
  const r2 = await testKey({ key: 'K', model: 'nope', fetchImpl: f });
  assert.equal(r2.modelAvailable, false);
});

test('cache never makes the same request twice', async () => {
  const cache = createCache(memoryAdapter());
  let made = 0;
  const params = { model: 'm', voice: 'Kore', style: 'Say calmly', text: 'Hello' };
  const make = async () => { made++; return { wav: new Uint8Array(100), rate: 24000, ms: 10 }; };
  const a = await cache.getOrMake(params, make);
  const b = await cache.getOrMake(params, make);
  assert.equal(made, 1);
  assert.equal(a.cached, false);
  assert.equal(b.cached, true);
  await cache.getOrMake({ ...params, voice: 'Puck' }, make);
  assert.equal(made, 2);
  const st = await cache.stats();
  assert.equal(st.count, 2);
  assert.equal(st.bytes, 200);
  assert.notEqual(await cacheKey(params), await cacheKey({ ...params, style: 'Say loudly' }));
  await cache.clear();
  assert.equal((await cache.stats()).count, 0);
});

test('store keeps the key apart from settings and masks it', () => {
  const mem = new Map();
  const storage = { getItem: (k) => (mem.has(k) ? mem.get(k) : null), setItem: (k, v) => mem.set(k, v), removeItem: (k) => mem.delete(k) };
  const s = createStore(storage);
  assert.deepEqual(s.get(), { ...DEFAULTS });
  s.set({ theme: 'dark' });
  s.setKey('  AIzaSyD-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa ');
  assert.equal(s.get().theme, 'dark');
  assert.ok(!JSON.stringify(Array.from(mem.entries()).filter(([k]) => k.includes('settings'))).includes('AIza'));
  assert.ok(looksLikeKey(s.getKey()));
  assert.equal(maskKey('AIzaSyD-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa').includes('aaaaaa'), false);
  s.clearKey();
  assert.equal(s.getKey(), '');
});

test('there are 30 voices with unique names', () => {
  assert.equal(VOICES.length, 30);
  assert.equal(new Set(VOICES.map((v) => v.name)).size, 30);
  assert.equal(findVoice('Sulafat').trait, 'Warm');
});
