"""Browser test of the Studio: generate, cache, exports, takes, guard, library. Gemini is mocked.

Usage: python3 -I tests/ui_studio.py [screenshot_dir]
"""
import base64, json, math, os, struct, subprocess, sys, time
from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SHOTS = sys.argv[1] if len(sys.argv) > 1 else None
PORT = 4198
KEY = 'AIzaSy' + 'b' * 33
FAIL = []

def check(name, cond):
    print(('PASS ' if cond else 'FAIL ') + name)
    if not cond:
        FAIL.append(name)

def tone_b64(ms=900, rate=24000, amp=7000):
    n = int(rate * ms / 1000)
    pcm = b''.join(struct.pack('<h', int(amp * math.sin(i / 9))) for i in range(n))
    return base64.b64encode(b'\x00\x00' * 2400 + pcm + b'\x00\x00' * 4800).decode()

TONE = tone_b64()
calls = {'speech': 0, 'texts': []}

def gemini(route):
    req = route.request
    if ':generateContent' in req.url:
        calls['speech'] += 1
        body = json.loads(req.post_data)
        calls['texts'].append(body['contents'][0]['parts'][0]['text'])
        route.fulfill(status=200, content_type='application/json', body=json.dumps(
            {'candidates': [{'content': {'parts': [{'inlineData': {'mimeType': 'audio/L16;codec=pcm;rate=24000', 'data': TONE}}]}}]}))
    else:
        route.fulfill(status=200, content_type='application/json', body='{"models":[]}')

SEED = """
if (!localStorage.getItem('vocara.seeded')) {
  localStorage.setItem('vocara.settings.v1', JSON.stringify({onboarded: true}));
  localStorage.setItem('vocara.key.v1', '%s');
  localStorage.setItem('vocara.seeded', '1');
}
""" % KEY

NATIVE = """
window.__native = {writes: [], shares: []};
window.Capacitor = {
  isNativePlatform: () => true,
  Plugins: {
    Filesystem: {writeFile: async (o) => { window.__native.writes.push({path: o.path, dir: o.directory, len: o.data.length}); return {uri: 'file:///cache/' + o.path}; }},
    Share: {share: async (o) => { window.__native.shares.push(o); return {}; }},
  },
};
"""

SCRIPT = "Hello there. This is scene one.\n\nScene two [pause 0.5s] continues here."

def shot(page, name):
    if SHOTS:
        os.makedirs(SHOTS, exist_ok=True)
        page.screenshot(path=os.path.join(SHOTS, name + '.png'))

server = subprocess.Popen(['node', os.path.join(ROOT, 'scripts', 'serve.mjs'), str(PORT)], stdout=subprocess.DEVNULL)
time.sleep(0.8)
try:
    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox', '--autoplay-policy=no-user-gesture-required'])
        ctx = browser.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, accept_downloads=True)
        ctx.grant_permissions(['clipboard-read', 'clipboard-write'], origin=f'http://127.0.0.1:{PORT}')
        ctx.add_init_script(SEED)
        page = ctx.new_page()
        errors = []
        page.on('pageerror', lambda e: errors.append(str(e)))
        page.on('console', lambda m: errors.append(m.text) if m.type == 'error' and '404' not in m.text else None)
        page.route('https://generativelanguage.googleapis.com/**', gemini)
        page.route('https://api.github.com/**', lambda r: r.fulfill(status=404, body='{}'))
        page.goto(f'http://127.0.0.1:{PORT}/')

        # Home -> Studio
        page.get_by_role('button', name='New voiceover').first.click()
        page.wait_for_selector('h1:has-text("Studio")')
        page.fill('#title', 'Snake fear')
        page.get_by_role('button', name='Thesis narrator').click()
        check('preset sets voice', page.input_value('#voice') == 'Charon')
        check('preset sets style', 'documentary' in page.input_value('#style'))
        page.fill('#script', SCRIPT)
        page.wait_for_selector('.scene')
        page.wait_for_selector('.scene .chip.peach')
        check('two scenes shown', page.locator('.scene').count() == 2)
        page.wait_for_selector('#generate[data-pending="3"]')
        check('plan counts 3 new requests (pause splits scene 2)', '3 new' in page.inner_text('#generate'))
        shot(page, 's1-studio')

        # Generate
        page.click('#generate')
        page.wait_for_selector('#result', timeout=30000)
        check('3 Gemini requests made', calls['speech'] == 3)
        check('style prefix reached the model', all(t.startswith('Say in a calm, deep documentary') for t in calls['texts']))
        check('pause tag was not sent to the model', not any('pause' in t for t in calls['texts']))
        result_text = page.inner_text('#result')
        check('result shows duration', 'Voiceover ready' in result_text)
        shot(page, 's2-result')

        # Free rebuild
        page.wait_for_selector('#generate[data-pending="0"]')
        check('button says free when everything is saved', 'free' in page.inner_text('#generate'))
        page.click('#generate')
        page.wait_for_selector('#result')
        page.wait_for_timeout(500)
        check('rebuild made no new requests', calls['speech'] == 3)

        # Exports (browser downloads)
        got = []
        page.on('download', lambda d: got.append(d))
        page.click('#share-all')
        t0 = time.time()
        while len(got) < 4 and time.time() - t0 < 10:
            page.wait_for_timeout(200)
        names = sorted(d.suggested_filename for d in got)
        check('four files downloaded', names == ['snake-fear.srt', 'snake-fear.timings.json', 'snake-fear.wav', 'snake-fear.words.srt'])
        by = {d.suggested_filename: open(d.path(), 'rb').read() for d in got}
        wav = by.get('snake-fear.wav', b'')
        check('wav is a real RIFF file with audio', wav[:4] == b'RIFF' and len(wav) > 100000)
        srt = by.get('snake-fear.srt', b'').decode()
        check('captions are valid SRT with the spoken words', '-->' in srt and 'Hello there.' in srt and 'continues here.' in srt)
        tj = json.loads(by.get('snake-fear.timings.json', b'{}'))
        check('timings json: 2 scenes, estimated flag, monotonic', len(tj['scenes']) == 2 and tj['wordTimings'] == 'estimated' and tj['scenes'][1]['startMs'] > tj['scenes'][0]['endMs'])
        words = [w for s in tj['scenes'] for w in s['words']]
        check('word times never go backwards', all(words[i]['startMs'] >= words[i - 1]['startMs'] for i in range(1, len(words))))
        # wav duration matches timeline
        wav_ms = (len(wav) - 44) / 2 / 24000 * 1000
        check('wav length matches timings duration', abs(wav_ms - tj['durationMs']) < 5)

        # Copy for Claude
        page.click('#copy-claude')
        page.wait_for_timeout(400)
        clip = page.evaluate('navigator.clipboard.readText()')
        check('Copy for Claude puts the timeline on the clipboard', '## timings.json' in clip and 'Snake fear' in clip)

        # New take costs one request and shows Take 2
        page.locator('.scene').first.get_by_role('button', name='New take').click()
        page.wait_for_selector('.scene .chip:has-text("Take 2")')
        for _ in range(60):
            if calls['speech'] >= 4: break
            page.wait_for_timeout(100)
        page.wait_for_timeout(500)
        check('new take made exactly one request (got %d)' % (calls['speech'] - 3), calls['speech'] == 4)
        check('first take is still available', page.locator('.scene').first.get_by_role('button', name='Previous take').count() == 1)
        page.locator('.scene').first.get_by_role('button', name='Previous take').click()
        page.wait_for_selector('.scene .chip.ok')
        page.click('#generate')
        page.wait_for_selector('#result')
        page.wait_for_timeout(500)
        check('going back to take 1 is free', calls['speech'] == 4)

        # Library
        page.get_by_role('button', name='Library').first.click()
        page.wait_for_selector('.proj')
        check('project is in the library', 'Snake fear' in page.inner_text('.proj'))
        shot(page, 's3-library')
        page.locator('.proj-open').first.click()
        page.wait_for_selector('#script')
        check('reopened project keeps script', page.input_value('#script') == SCRIPT)
        check('reopened project keeps title', page.input_value('#title') == 'Snake fear')
        page.wait_for_selector('.scene .chip.ok')
        page.click('#generate'); page.wait_for_selector('#result')
        page.wait_for_timeout(400)
        check('reopened project rebuilds from the cache for free', calls['speech'] == 4)

        # Quota guard
        page.evaluate("""() => { const s = JSON.parse(localStorage.getItem('vocara.settings.v1')); s.dailyGuard = 5; localStorage.setItem('vocara.settings.v1', JSON.stringify(s)); }""")
        page.get_by_role('button', name='New voiceover').first.click() if page.get_by_role('button', name='New voiceover').count() else page.evaluate("location.hash = '#/studio'")
        page.evaluate("location.hash = '#/studio'")
        page.wait_for_selector('#script')
        page.fill('#script', 'Brand new line one.\n\nBrand new line two.\n\nBrand new line three.')
        page.wait_for_selector('#generate[data-pending="3"]')
        asked = []
        def on_dialog(d):
            asked.append(d.message); d.dismiss()
        page.once('dialog', on_dialog)
        before = calls['speech']
        page.click('#generate')
        for _ in range(50):
            if asked: break
            page.wait_for_timeout(100)
        page.wait_for_timeout(300)
        check('guard asked before overspending', len(asked) == 1 and 'guard is 5' in asked[0])
        check('declining the guard made no requests', calls['speech'] == before)
        shot(page, 's4-guard')
        check('no page errors (browser flow)', not errors)
        for e in errors: print('  error:', e)

        # Native share path (Capacitor plugins mocked)
        ctx2 = browser.new_context(viewport={'width': 390, 'height': 844}, accept_downloads=True)
        ctx2.add_init_script(SEED); ctx2.add_init_script(NATIVE)
        pg = ctx2.new_page()
        pg.route('https://generativelanguage.googleapis.com/**', gemini)
        pg.route('https://api.github.com/**', lambda r: r.fulfill(status=404, body='{}'))
        pg.goto(f'http://127.0.0.1:{PORT}/#/studio')
        pg.fill('#title', 'Native test')
        pg.fill('#script', 'Just one short scene here.')
        pg.wait_for_selector('.scene')
        pg.wait_for_selector('#generate[data-pending="1"]')
        pg.click('#generate'); pg.wait_for_selector('#result', timeout=30000)
        pg.click('#share-all')
        for _ in range(50):
            if pg.evaluate('window.__native.shares.length') == 1: break
            pg.wait_for_timeout(100)
        nat = pg.evaluate('window.__native')
        check('native: 4 files written to cache dir', len(nat['writes']) == 4 and all(w['dir'] == 'CACHE' for w in nat['writes']))
        check('native: share sheet opened with 4 files', len(nat['shares'][0]['files']) == 4)
        browser.close()
finally:
    server.terminate()

print('\nFAILED: %d' % len(FAIL) if FAIL else '\nALL PASSED')
sys.exit(1 if FAIL else 0)
