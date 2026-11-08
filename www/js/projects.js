// Saved projects: script, voice, style and take choices. Audio is not stored here;
// it comes back for free from the clip cache.
const KEY = 'vocara.projects.v1';

export function createProjects(storage, now = () => Date.now(), makeId = () => Math.random().toString(36).slice(2, 10)) {
  const read = () => { try { const v = JSON.parse(storage.getItem(KEY)); return Array.isArray(v) ? v : []; } catch (_) { return []; } };
  const write = (list) => storage.setItem(KEY, JSON.stringify(list));
  return {
    list: () => read().sort((a, b) => b.updated - a.updated),
    get: (id) => read().find((p) => p.id === id) || null,
    create(init) { return { id: makeId(), title: '', script: '', voice: '', style: '', preset: '', gapMs: 400, takes: {}, updated: now(), ...init }; },
    save(p) {
      const list = read().filter((x) => x.id !== p.id);
      list.push({ ...p, updated: now() });
      write(list);
    },
    remove(id) { write(read().filter((p) => p.id !== id)); },
  };
}
