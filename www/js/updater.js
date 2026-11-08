// Glue: remembers the build, throttles auto checks, shows the sheet once per new build.
import { checkForUpdate, getBuildInfo } from './update.js';
import { showUpdateSheet } from './ui/update.js';

const KEY = 'vocara.update.v1';
const SIX_HOURS = 6 * 3600 * 1000;
let buildPromise = null;

export function buildInfo() { return (buildPromise ||= getBuildInfo()); }

function read() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (_) { return {}; } }
function write(v) { try { localStorage.setItem(KEY, JSON.stringify({ ...read(), ...v })); } catch (_) { /* ignore */ } }

export function lastKnown() { return read().available || null; }

export async function runCheck({ manual = false } = {}) {
  const cur = await buildInfo();
  const res = await checkForUpdate({ currentBuild: cur.build });
  if (res.state === 'available') write({ available: res.info, checkedAt: Date.now() });
  else if (res.state === 'latest') write({ available: null, checkedAt: Date.now() });
  return { ...res, current: cur };
}

export function openSheet(info, cur) {
  showUpdateSheet(info, { currentVersion: cur.version ? `Vocara ${cur.version}` : '', onLater: () => write({ dismissedBuild: info.build }) });
}

export async function autoCheckUpdate() {
  const st = read();
  if (st.checkedAt && Date.now() - st.checkedAt < SIX_HOURS && !(st.available && st.dismissedBuild !== st.available.build)) return;
  const res = await runCheck();
  if (res.state === 'available' && read().dismissedBuild !== res.info.build) openSheet(res.info, res.current);
}
