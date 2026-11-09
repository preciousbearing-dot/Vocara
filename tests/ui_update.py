"""Browser test of the in-app update: details, in-app download with progress, installer hand-off.
The native plugin is faked; no page may open outside the app.

Usage: python3 -I tests/ui_update.py [screenshot_dir]
"""
import json, os, subprocess, sys, time
from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SHOTS = sys.argv[1] if len(sys.argv) > 1 else None
PORT = 4196
FAIL = []

def check(name, cond):
    print(('PASS ' if cond else 'FAIL ') + name)
    if not cond:
        FAIL.append(name)

RELEASE = {'body': 'build: 9\nversion: 0.3.0\n\nFaster exports\n\n- Downloads now happen inside the app', 'published_at': '2026-11-09T00:00:00Z',
           'assets': [{'name': 'Vocara.apk', 'size': 5242880, 'browser_download_url': 'https://github.com/x/Vocara/releases/download/apk-latest/Vocara.apk'}]}

SEED = """
if (!localStorage.getItem('vocara.seeded')) {
  localStorage.setItem('vocara.settings.v1', JSON.stringify({onboarded: true}));
  localStorage.setItem('vocara.seeded', '1');
}
"""

FAKE = """
window.__u = {calls: [], allowed: true, pct: 0, state: 'idle'};
const U = {
  status: async () => ({state: window.__u.state, pct: window.__u.pct, done: window.__u.pct * 52428.8, total: 5242880, speed: 1500000, allowed: window.__u.allowed}),
  download: async (o) => { window.__u.calls.push(['download', o.url, o.bytes]); window.__u.state = 'running'; window.__u.pct = 0;
    const t = setInterval(() => { window.__u.pct += 20; if (window.__u.pct >= 100) { window.__u.pct = 100; window.__u.state = 'ready'; clearInterval(t); } }, 400); return {}; },
  cancel: async () => { window.__u.calls.push(['cancel']); window.__u.state = 'idle'; return {}; },
  install: async () => { window.__u.calls.push(['install']); return {}; },
  openSettings: async () => { window.__u.calls.push(['openSettings']); return {}; },
  cleanup: async () => { window.__u.calls.push(['cleanup']); return {}; },
};
window.Capacitor = { isNativePlatform: () => true, registerPlugin: (n) => (n === 'VocaraUpdate' ? U : {}), Plugins: {} };
"""

def shot(page, name):
    if SHOTS:
        os.makedirs(SHOTS, exist_ok=True)
        page.screenshot(path=os.path.join(SHOTS, name + '.png'))

server = subprocess.Popen(['node', os.path.join(ROOT, 'scripts', 'serve.mjs'), str(PORT)], stdout=subprocess.DEVNULL)
time.sleep(0.8)
try:
    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        ctx = browser.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2)
        ctx.add_init_script(SEED); ctx.add_init_script(FAKE)
        opened = []
        page = ctx.new_page()
        ctx.on('page', lambda pg: opened.append(pg.url))
        errors = []
        page.on('pageerror', lambda e: errors.append(str(e)))
        page.route('https://api.github.com/**', lambda r: r.fulfill(status=200, content_type='application/json', body=json.dumps(RELEASE)))
        page.goto(f'http://127.0.0.1:{PORT}/')
        page.wait_for_selector('.sheet')
        txt = page.inner_text('.sheet')
        check('sheet shows version, notes and size', 'Vocara 0.3.0' in txt and 'Downloads now happen inside the app' in txt and '5.0 MB' in txt)
        check('native mode has no external link', page.locator('.sheet a').count() == 0)
        shot(page, 'u1-sheet')
        page.click('#update-main')
        page.wait_for_selector('.prog:not(.hidden)')
        page.wait_for_timeout(700)
        txt = page.inner_text('.sheet')
        check('progress shown inside the app', 'Downloading' in txt and 'MB' in txt and '%' in txt)
        check('download asked for the release apk', page.evaluate('window.__u.calls[0][1]').endswith('/apk-latest/Vocara.apk'))
        shot(page, 'u2-progress')
        for _ in range(60):
            if page.evaluate("window.__u.calls.some(c => c[0] === 'install')"): break
            page.wait_for_timeout(150)
        calls = page.evaluate('window.__u.calls.map(c => c[0])')
        check('installer opened automatically after the download', calls.count('install') == 1)
        check('no browser tab or external page opened', not opened)
        check('button offers Install now when ready', 'Install now' in page.inner_text('#update-main'))
        shot(page, 'u3-ready')

        # Installs not allowed yet -> settings screen, no install
        page.wait_for_timeout(1800)  # the installer button ignores double taps for a moment
        page.evaluate("window.__u.calls.length = 0; window.__u.allowed = false")
        page.click('#update-main')
        page.wait_for_timeout(500)
        calls = page.evaluate('window.__u.calls.map(c => c[0])')
        check('when installs are blocked, opens Android settings instead of installing', 'openSettings' in calls and 'install' not in calls)
        check('no page errors', not errors)
        for e in errors: print('  error:', e)
        browser.close()
finally:
    server.terminate()

print('\nFAILED: %d' % len(FAIL) if FAIL else '\nALL PASSED')
sys.exit(1 if FAIL else 0)
