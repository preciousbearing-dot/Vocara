// Gemini text-to-speech client. Pure functions plus an injectable fetch so the
// whole module can be tested without a network.

import { unwrapWav } from './wav.js';

export const API_BASE = 'https://generativelanguage.googleapis.com/v1beta';
// Third-party coverage (2026) says only this model has a free tier; the user can
// change the model id in Settings, and "Test key" shows what the key can reach.
export const DEFAULT_MODEL = 'gemini-3.1-flash-tts-preview';

export class GeminiError extends Error {
  constructor(kind, message, status, extra = {}) {
    super(message);
    this.name = 'GeminiError';
    this.kind = kind; // 'key' | 'quota' | 'model' | 'network' | 'empty' | 'server' | 'request'
    this.status = status || 0;
    this.retryAfter = extra.retryAfter || 0; // seconds Google asked us to wait, when it said
    this.daily = Boolean(extra.daily); // true when the limit is a per-day one
  }
}

// The style goes in a clearly separate "director's notes" block, and the line to be spoken
// sits under a TRANSCRIPT heading, which is the layout Google documents for steering Gemini
// speech. A bare "style: line" lets long style text get read aloud on some takes.
export function buildPrompt(style, text) {
  const s = (style || '').trim();
  if (!s) return text;
  return `# DIRECTOR'S NOTES\nDelivery guidance only. Never read these notes aloud.\n${s}\n\n#### TRANSCRIPT\n${text}`;
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

// Pulls the message, and any "retry in N s" hint, out of a Google error body.
export function parseErrorBody(json) {
  const err = (json && json.error) || {};
  const msg = err.message || '';
  let retryAfter = 0;
  const m = /retry in ([\d.]+)\s*s/i.exec(msg);
  if (m) retryAfter = parseFloat(m[1]);
  for (const d of err.details || []) {
    if (/RetryInfo/.test(d['@type'] || '') && d.retryDelay) retryAfter = parseFloat(d.retryDelay) || retryAfter;
  }
  const daily = /per\s?day|daily/i.test(msg + JSON.stringify(err.details || []));
  return { msg, retryAfter, daily };
}

async function readError(res) {
  try { return parseErrorBody(await res.json()); } catch (_) { return { msg: '', retryAfter: 0, daily: false }; }
}

function mapStatus(status, info) {
  const { msg, retryAfter, daily } = info;
  if (status === 429) return new GeminiError('quota', msg || 'Rate limit or free quota reached. Wait a minute and try again.', status, { retryAfter, daily });
  if (status === 401 || status === 403) return new GeminiError('key', msg || 'This key was rejected.', status);
  if (status === 400 && /api key/i.test(msg)) return new GeminiError('key', msg, status);
  if (status === 404) return new GeminiError('model', msg || 'That model was not found for this key.', status);
  if (status === 400 && /model|not supported|unsupported/i.test(msg)) return new GeminiError('model', msg, status);
  if (status >= 500) return new GeminiError('server', msg || 'Google had a problem. Try again shortly.', status);
  return new GeminiError('request', msg || `Request failed (${status}).`, status);
}

// Models from 3.8 on use Google's newer request shape (POST /interactions, the style sent as a
// separate speech_metadata note instead of text mixed into the transcript).
export function usesInteractions(model) {
  const m = /(\d+(?:\.\d+)?)/.exec(String(model || ''));
  return /tts/i.test(model || '') && Boolean(m) && parseFloat(m[1]) >= 3.8;
}

export function buildInteractionBody({ model, voice, text, style }) {
  const s = (style || '').trim();
  const item = { type: 'text', text };
  if (s) item.annotations = [{ type: 'speech_metadata', style: s }];
  return {
    model,
    input: [{ type: 'user_input', content: [item] }],
    response_format: { type: 'audio' },
    generation_config: { speech_config: [{ voice }] },
  };
}

// Finds the audio in either response shape (generateContent or interactions): the last object
// that carries base64 `data` and says it is audio.
export function findAudio(json) {
  let found = null;
  const walk = (n) => {
    if (Array.isArray(n)) { n.forEach(walk); return; }
    if (!n || typeof n !== 'object') return;
    const mime = String(n.mime_type || n.mimeType || '');
    if (typeof n.data === 'string' && n.data.length > 0 && (n.type === 'audio' || /audio/i.test(mime))) {
      found = { data: n.data, mime, rate: Number(n.sample_rate) || 0 };
    }
    for (const k of Object.keys(n)) if (n[k] && typeof n[k] === 'object') walk(n[k]);
  };
  walk(json);
  return found;
}

// Turns whatever came back into clean 16-bit mono samples (no WAV header, no trailing metadata).
export function audioToPcm(found) {
  const raw = base64ToBytes(found.data);
  const un = unwrapWav(raw);
  const rate = un.rate || found.rate || sampleRateFromMime(found.mime);
  return { pcm: un.pcm, rate };
}

async function post(f, url, key, body, signal) {
  let res;
  try {
    res = await f(url, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key }, body: JSON.stringify(body), signal });
  } catch (e) {
    if (e && e.name === 'AbortError') throw e;
    throw new GeminiError('network', 'Could not reach Google. Check your connection.');
  }
  if (!res.ok) throw mapStatus(res.status, await readError(res));
  return res.json();
}

async function synthLegacy({ key, model, voice, text, style, fetchImpl, signal }) {
  const json = await post(fetchImpl || fetch, `${API_BASE}/models/${encodeURIComponent(model)}:generateContent`, key, buildSynthBody({ model, voice, text, style }), signal);
  const found = findAudio(json);
  if (!found) throw new GeminiError('empty', 'Google returned no audio for that text. Try shorter or simpler wording.');
  return audioToPcm(found);
}

async function synthInteractions({ key, model, voice, text, style, fetchImpl, signal }) {
  const json = await post(fetchImpl || fetch, `${API_BASE}/interactions`, key, buildInteractionBody({ model, voice, text, style }), signal);
  const found = findAudio(json);
  if (!found) throw new GeminiError('empty', 'Google returned no audio for that text. Try shorter or simpler wording.');
  return audioToPcm(found);
}

// Returns { pcm: Uint8Array (16-bit mono little-endian), rate }.
export async function synth(opts) {
  const o = { model: DEFAULT_MODEL, ...opts };
  if (!usesInteractions(o.model)) return synthLegacy(o);
  try {
    return await synthInteractions(o);
  } catch (e) {
    // If Google does not accept the newer request for this key, the older one still works.
    if (e instanceof GeminiError && (e.kind === 'request' || e.kind === 'model' || e.kind === 'empty')) return synthLegacy(o);
    throw e;
  }
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
