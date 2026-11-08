// Small settings store. The Gemini key lives under its own storage key so it is
// never mixed into anything that gets exported or logged.
import { DEFAULT_MODEL } from './gemini.js';
import { DEFAULT_VOICE } from './voices.js';

const SETTINGS = 'vocara.settings.v1';
const KEY = 'vocara.key.v1';

export const DEFAULTS = Object.freeze({
  onboarded: false,
  theme: 'system', // 'system' | 'light' | 'dark'
  model: DEFAULT_MODEL,
  voice: DEFAULT_VOICE,
});

export function createStore(storage) {
  const read = () => {
    try {
      return { ...DEFAULTS, ...JSON.parse(storage.getItem(SETTINGS) || '{}') };
    } catch (_) {
      return { ...DEFAULTS };
    }
  };
  return {
    get: read,
    set(patch) {
      const next = { ...read(), ...patch };
      storage.setItem(SETTINGS, JSON.stringify(next));
      return next;
    },
    getKey: () => storage.getItem(KEY) || '',
    setKey(k) { storage.setItem(KEY, (k || '').trim()); },
    clearKey() { storage.removeItem(KEY); },
  };
}

export function maskKey(k) {
  if (!k) return '';
  if (k.length <= 8) return '••••';
  return `${k.slice(0, 4)}••••••••${k.slice(-4)}`;
}

export function looksLikeKey(k) {
  return /^AIza[0-9A-Za-z_\-]{30,}$/.test((k || '').trim());
}
