// Take cache. Every generated clip is stored on the device under a key made
// from everything that affects the sound (model, voice, style, text), so the
// same request is never paid for twice.

export async function sha256Hex(str) {
  const data = new TextEncoder().encode(str);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

// `take` is only part of the key when above 0, so take 0 keeps the key it always had.
export function cacheKey({ model, voice, style, text, take = 0 }) {
  const parts = [model || '', voice || '', (style || '').trim(), text];
  if (take > 0) parts.push(take);
  return sha256Hex(JSON.stringify(parts));
}

// In-memory adapter: used by tests and as a fallback when IndexedDB is missing.
export function memoryAdapter() {
  const m = new Map();
  return {
    async get(k) { return m.has(k) ? m.get(k) : null; },
    async put(k, v) { m.set(k, v); },
    async del(k) { m.delete(k); },
    async all() { return Array.from(m.entries()).map(([key, value]) => ({ key, value })); },
    async clear() { m.clear(); },
  };
}

// IndexedDB adapter for the app.
export function idbAdapter(name = 'vocara-cache', store = 'clips') {
  let dbp = null;
  const open = () => {
    if (!dbp) {
      dbp = new Promise((resolve, reject) => {
        const req = indexedDB.open(name, 1);
        req.onupgradeneeded = () => req.result.createObjectStore(store);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
    }
    return dbp;
  };
  const run = async (mode, fn) => {
    const db = await open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(store, mode);
      const out = fn(tx.objectStore(store));
      tx.oncomplete = () => resolve(out && 'result' in out ? out.result : undefined);
      tx.onerror = () => reject(tx.error);
    });
  };
  return {
    get: (k) => run('readonly', (s) => s.get(k)).then((v) => (v === undefined ? null : v)),
    put: (k, v) => run('readwrite', (s) => s.put(v, k)),
    del: (k) => run('readwrite', (s) => s.delete(k)),
    clear: () => run('readwrite', (s) => s.clear()),
    all: async () => {
      const db = await open();
      return new Promise((resolve, reject) => {
        const out = [];
        const req = db.transaction(store, 'readonly').objectStore(store).openCursor();
        req.onsuccess = () => {
          const c = req.result;
          if (c) { out.push({ key: c.key, value: c.value }); c.continue(); } else resolve(out);
        };
        req.onerror = () => reject(req.error);
      });
    },
  };
}

// value shape: { wav: Uint8Array, rate: number, ms: number, at: number }
export function createCache(adapter) {
  return {
    adapter,
    async lookup(params) {
      return adapter.get(await cacheKey(params));
    },
    async save(params, value) {
      await adapter.put(await cacheKey(params), { ...value, at: Date.now() });
    },
    // Returns { value, cached }. `make` runs only on a miss.
    async getOrMake(params, make) {
      const k = await cacheKey(params);
      const hit = await adapter.get(k);
      if (hit) return { value: hit, cached: true };
      const value = { ...(await make()), at: Date.now() };
      await adapter.put(k, value);
      return { value, cached: false };
    },
    async stats() {
      const all = await adapter.all();
      let bytes = 0;
      for (const { value } of all) bytes += (value && value.wav && value.wav.length) || 0;
      return { count: all.length, bytes };
    },
    clear: () => adapter.clear(),
  };
}
