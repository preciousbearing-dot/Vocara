// In-app update check. No DOM here so it can be unit tested.
// CI publishes each build to the GitHub release "apk-latest". Its notes start with
// "build: N" and "version: X"; the rest is the human-readable update details.
export const REPO = 'preciousbearing-dot/Vocara';
export const RELEASE_URL = `https://api.github.com/repos/${REPO}/releases/tags/apk-latest`;

export function parseRelease(release) {
  if (!release || !Array.isArray(release.assets)) return null;
  const apk = release.assets.find((a) => /\.apk$/i.test(a.name || ''));
  if (!apk) return null;
  const lines = String(release.body || '').replace(/\r/g, '').split('\n');
  let build = NaN; let version = '';
  const notes = [];
  let header = true;
  for (const line of lines) {
    if (header) {
      const b = /^build:\s*(\d+)\s*$/i.exec(line); if (b) { build = Number(b[1]); continue; }
      const v = /^version:\s*(\S+)\s*$/i.exec(line); if (v) { version = v[1]; continue; }
      if (!line.trim()) continue;
      header = false;
    }
    notes.push(line);
  }
  if (!Number.isFinite(build)) return null;
  return {
    build, version,
    notes: notes.join('\n').trim(),
    size: apk.size || 0,
    url: apk.browser_download_url,
    published: release.published_at || release.created_at || '',
  };
}

export function noteLines(notes) {
  return String(notes || '').split('\n').map((l) => l.replace(/^\s*[-*•]\s*/, '').trim()).filter(Boolean);
}

export function formatSize(bytes) {
  if (!bytes) return 'Size unknown';
  const mb = bytes / (1024 * 1024);
  return mb >= 1 ? `${mb.toFixed(mb >= 10 ? 0 : 1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export async function getBuildInfo(fetchImpl = fetch) {
  try {
    const r = await fetchImpl('build.json', { cache: 'no-store' });
    const j = await r.json();
    return { build: Number(j.build) || 0, version: String(j.version || '') };
  } catch (_) { return { build: 0, version: '' }; }
}

// Returns {state:'available', info} | {state:'latest'} | {state:'error', message}
export async function checkForUpdate({ currentBuild, fetchImpl = fetch }) {
  try {
    const r = await fetchImpl(RELEASE_URL, { headers: { Accept: 'application/vnd.github+json' } });
    if (r.status === 404) return { state: 'latest' };
    if (!r.ok) return { state: 'error', message: `GitHub answered ${r.status}.` };
    const info = parseRelease(await r.json());
    if (!info) return { state: 'error', message: 'Could not read the update info.' };
    return info.build > currentBuild ? { state: 'available', info } : { state: 'latest' };
  } catch (_) {
    return { state: 'error', message: 'Could not reach GitHub. Check your connection.' };
  }
}

// Progress text for the in-app download. st = { state, done, total, pct, speed, error, allowed }.
export function progressText(st) {
  if (!st) return '';
  if (st.state === 'waiting') return 'Waiting for a connection...';
  if (st.state === 'error') return st.error || 'The download stopped.';
  if (st.state === 'ready') return 'Downloaded. Ready to install.';
  const mb = (n) => (n / (1024 * 1024)).toFixed(1);
  const part = st.total > 0 ? `${mb(st.done)} of ${mb(st.total)} MB` : `${mb(st.done)} MB`;
  const speed = st.speed > 0 ? ` · ${(st.speed / (1024 * 1024)).toFixed(1)} MB/s` : '';
  return `Downloading ${st.pct || 0}% · ${part}${speed}`;
}
