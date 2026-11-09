// Getting files out of the app. On the phone: write to the app cache and open the
// share sheet (save to Drive, Files, WhatsApp...). In a browser: normal downloads.
export function isNative() {
  return Boolean(window.Capacitor && typeof window.Capacitor.isNativePlatform === 'function' && window.Capacitor.isNativePlatform());
}

function toBase64(bytes) {
  let bin = '';
  const step = 0x8000;
  for (let i = 0; i < bytes.length; i += step) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + step));
  return btoa(bin);
}

const bytesOf = (d) => (typeof d === 'string' ? new TextEncoder().encode(d) : d);

// files: [{ name, mime, data: Uint8Array | string }]. Returns 'shared' or 'downloaded'.
export async function deliver(files, title = 'Vocara export') {
  const plugins = (window.Capacitor && window.Capacitor.Plugins) || {};
  if (isNative() && plugins.Filesystem && plugins.Share) {
    const uris = [];
    for (const f of files) {
      const r = await plugins.Filesystem.writeFile({ path: `vocara/${f.name}`, data: toBase64(bytesOf(f.data)), directory: 'CACHE', recursive: true });
      uris.push(r.uri);
    }
    await plugins.Share.share({ title, files: uris, dialogTitle: 'Save or send' });
    return 'shared';
  }
  for (const f of files) {
    const url = URL.createObjectURL(new Blob([bytesOf(f.data)], { type: f.mime }));
    const a = document.createElement('a');
    a.href = url; a.download = f.name;
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  }
  return 'downloaded';
}

export async function copyText(text) {
  try { await navigator.clipboard.writeText(text); return true; } catch (_) { return false; }
}

// The in-app updater (native plugin VocaraUpdate). null in a browser.
export function updatePlugin() {
  if (!isNative()) return null;
  const cap = window.Capacitor;
  try { return cap.registerPlugin ? cap.registerPlugin('VocaraUpdate') : ((cap.Plugins || {}).VocaraUpdate || null); } catch (_) { return null; }
}
