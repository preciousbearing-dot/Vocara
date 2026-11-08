// Counts Gemini requests made today so a run can warn before it burns the free quota.
const KEY = 'vocara.usage.v1';

export function createUsage(storage, now = () => new Date()) {
  const day = () => { const d = now(); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; };
  const read = () => {
    try { const v = JSON.parse(storage.getItem(KEY)); if (v && v.day === day()) return v; } catch (_) { /* fresh */ }
    return { day: day(), n: 0 };
  };
  return {
    today: () => read().n,
    bump() { const v = read(); v.n += 1; try { storage.setItem(KEY, JSON.stringify(v)); } catch (_) { /* ignore */ } return v.n; },
  };
}
