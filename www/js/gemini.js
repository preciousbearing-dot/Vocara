// Gemini text-to-speech client. Pure functions plus an injectable fetch so the
// whole module can be tested without a network.

export const API_BASE = 'https://generativelanguage.googleapis.com/v1beta';
// Third-party coverage (2026) says only this model has a free tier; the user can
// change the model id in Settings, and "Test key" shows what the key can reach.
export const DEFAULT_MODEL = 'gemini-3.1-flash-tts-preview';

export class GeminiError extends Error {
  constructor(kind, message, status) {
    super(message);
    this.name = 'GeminiError';
    this.kind = kind; // 'key' | 'quota' | 'model' | 'network' | 'empty' | 'server' | 'request'
    this.status = status || 0;
  }
}

// A style phrase such as "Say calmly and slowly" goes in front of the line,
// which is how Google's own examples steer delivery.
export function buildPrompt(style, text) {
  const s = (style || '').trim().replace(/[:.]+$/, '');
  return s ? `${s}: ${text}` : text;
}

export function buildSynthBody({ model, voice, text, style }) {
  return {
    contents: [{ parts: [{ text: buildPrompt(style, text) }] }],
    generationConfig: {
      responseModalities: ['AUDIO'],
      speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } },
    },
    model,
  };
}

export function base64ToBytes(b64) {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export function sampleRateFromMime(mime, fallback = 24000) {
  const m = /rate=(\d+)/i.exec(mime || '');
  return m ? parseInt(m[1], 10) : fallback;
}

async function readError(res) {
  let msg = '';
  try {
    const j = await res.json();
    msg = (j && j.error && j.error.message) || '';
  } catch (_) { /* body was not json */ }
  return msg;
}

function mapStatus(status, msg) {
  if (status === 429) return new GeminiError('quota', msg || 'Rate limit or free quota reached. Wait a minute and try again.', status);
  if (status === 401 || status === 403) return new GeminiError('key', msg || 'This key was rejected.', status);
  if (status === 400 && /api key/i.test(msg)) return new GeminiError('key', msg, status);
  if (status === 404) return new GeminiError('model', msg || 'That model was not found for this key.', status);
  if (status >= 500) return new GeminiError('server', msg || 'Google had a problem. Try again shortly.', status);
  return new GeminiError('request', msg || `Request failed (${status}).`, status);
}

// Returns { pcm: Uint8Array (16-bit mono little-endian), rate }.
export async function synth({ key, model = DEFAULT_MODEL, voice, text, style, fetchImpl, signal }) {
  const f = fetchImpl || fetch;
  let res;
  try {
    res = await f(`${API_BASE}/models/${encodeURIComponent(model)}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify(buildSynthBody({ model, voice, text, style })),
      signal,
    });
  } catch (e) {
    if (e && e.name === 'AbortError') throw e;
    throw new GeminiError('network', 'Could not reach Google. Check your connection.');
  }
  if (!res.ok) throw mapStatus(res.status, await readError(res));
  const json = await res.json();
  const part = json && json.candidates && json.candidates[0] && json.candidates[0].content
    && json.candidates[0].content.parts && json.candidates[0].content.parts[0];
  const inline = part && part.inlineData;
  if (!inline || !inline.data) {
    throw new GeminiError('empty', 'Google returned no audio for that text. Try shorter or simpler wording.');
  }
  return { pcm: base64ToBytes(inline.data), rate: sampleRateFromMime(inline.mimeType) };
}

// Cheap key check: lists models. Does not spend speech quota.
export async function testKey({ key, model = DEFAULT_MODEL, fetchImpl }) {
  const f = fetchImpl || fetch;
  let res;
  try {
    res = await f(`${API_BASE}/models?pageSize=200`, { headers: { 'x-goog-api-key': key } });
  } catch (_) {
    throw new GeminiError('network', 'Could not reach Google. Check your connection.');
  }
  if (!res.ok) throw mapStatus(res.status, await readError(res));
  const json = await res.json();
  const names = ((json && json.models) || []).map((m) => String(m.name || '').replace(/^models\//, ''));
  return { ok: true, modelAvailable: names.includes(model), ttsModels: names.filter((n) => /tts/i.test(n)) };
}
