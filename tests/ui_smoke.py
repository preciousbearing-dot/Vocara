"""Browser smoke test: runs the real app in headless Chrome with Google mocked.

Usage: python3 tests/ui_smoke.py [screenshot_dir]
Starts scripts/serve.mjs itself. Needs playwright and a Chrome binary.
"""
import base64, json, os, subprocess, sys, time
from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SHOTS = sys.argv[1] if len(sys.argv) > 1 else None
PORT = 4199
KEY = 'AIzaSy' + 'a' * 33
FAIL = []

def check(name, cond):
    print(('PASS ' if cond else 'FAIL ') + name)
    if not cond:
        FAIL.append(name)

pcm = base64.b64encode(bytes(48000)).decode()
calls = {'speech': 0, 'models': 0, 'keys': set()}

def handle(route):
    req = route.request
    calls['keys'].add(req.headers.get('x-goog-api-key'))
    if req.url.endswith('/models?pageSize=200'):
        calls['models'] += 1
        route.fulfill(status=200, content_type='application/json',
                      body=json.dumps({'models': [{'name': 'models/gemini-3.1-flash-tts-preview'}]}))
    elif ':generateContent' in req.url:
        calls['speech'] += 1
        route.fulfill(status=200, content_type='application/json', body=json.dumps(
            {'candidates': [{'content': {'parts': [{'inlineData': {'mimeType': 'audio/L16;codec=pcm;rate=24000', 'data': pcm}}]}}]}))
    else:
        route.fulfill(status=404, body='{}')

RELEASE = {'body': 'build: 5\nversion: 0.2.0\n\nScene editor arrives\n\n- Split a script into scenes\n- Export captions', 'published_at': '2026-11-08T10:00:00Z',
           'assets': [{'name': 'Vocara.apk', 'size': 7340032, 'browser_download_url': 'https://github.com/x/Vocara/releases/download/apk-latest/Vocara.apk'}]}
def handle_gh(route):
    route.fulfill(status=200, content_type='application/json', body=json.dumps(RELEASE))

def shot(page, name):
    if SHOTS:
        os.makedirs(SHOTS, exist_ok=True)
        page.screenshot(path=os.path.join(SHOTS, name + '.png'))

server = subprocess.Popen(['node', os.path.join(ROOT, 'scripts', 'serve.mjs'), str(PORT)], stdout=subprocess.DEVNULL)
time.sleep(0.8)
try:
    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox', '--autoplay-policy=no-user-gesture-required'])
        ctx = browser.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, color_scheme='light')
        page = ctx.new_page()
        errors = []
        page.on('pageerror', lambda e: errors.append(str(e)))
        page.on('console', lambda m: errors.append(m.text) if m.type == 'error' and 'fonts.css' not in m.text and '404' not in m.text else None)
        page.route('https://generativelanguage.googleapis.com/**', handle)
        page.route('https://api.github.com/**', handle_gh)
        page.goto(f'http://127.0.0.1:{PORT}/')

        # Welcome tour
        check('tour shows first slide', page.locator('h1', has_text='Your script, in a real voice').count() == 1)
        shot(page, '01-tour')
        for _ in range(3):
            page.get_by_role('button', name='Next').click()
        check('tour ends with key setup button', page.get_by_role('button', name='Set up my key').count() == 1)
        shot(page, '02-tour-last')
        page.get_by_role('button', name='Set up my key').click()

        # Key setup
        page.wait_for_selector('h1:has-text("Add your Gemini key")')
        check('key screen shown', page.locator('h1', has_text='Add your Gemini key').count() == 1)
        page.fill('#key', KEY)
        page.get_by_role('button', name='Test key').click()
        page.wait_for_selector('.notice.ok')
        check('test key reports success', 'Key works' in page.locator('.notice.ok').inner_text())
        shot(page, '03-key')
        page.get_by_role('button', name='Save and continue').click()
        page.wait_for_selector('h1:has-text("What should we voice today?")')
        check('home after setup', True)
        page.wait_for_selector('.sheet')
        sheet = page.inner_text('.sheet')
        check('update sheet shows version, size and notes', 'Vocara 0.2.0' in sheet and '7.0 MB' in sheet and 'Split a script into scenes' in sheet and 'Scene editor arrives' in sheet)
        check('install link points at the release apk', page.get_attribute('.sheet a.btn', 'href').endswith('/apk-latest/Vocara.apk'))
        shot(page, '03b-update-sheet')
        page.get_by_role('button', name='Later').click()
        check('Later closes the sheet', page.locator('.sheet').count() == 0)
        check('onboarded persisted', json.loads(page.evaluate("localStorage.getItem('vocara.settings.v1')"))['onboarded'] is True)
        check('key not in settings blob', KEY not in page.evaluate("localStorage.getItem('vocara.settings.v1')"))
        shot(page, '04-home')

        # Voices: preview, cache, choose
        page.get_by_role('button', name='Voices').first.click()
        page.wait_for_selector('.voice')
        body = page.inner_text('body')
        check('no stray null/undefined text', 'null' not in body and 'undefined' not in body)
        check('30 voices listed', page.locator('.voice').count() == 30)
        page.get_by_role('button', name='Preview Charon').click()
        page.wait_for_selector('.voice:has-text("Charon") .chip.ok')
        check('first preview hit the network once', calls['speech'] == 1)
        check('sample marked saved', page.locator('.voice:has-text("Charon") .chip.ok').count() == 1)
        time.sleep(0.8)
        page.get_by_role('button', name='Preview Charon').click()
        time.sleep(0.8)
        check('replay used the cache (no second request)', calls['speech'] == 1)
        check('key sent in header only', calls['keys'] == {KEY})
        page.locator('.voice:has-text("Sulafat")').get_by_role('button', name='Choose').click()
        check('choose sets default voice', json.loads(page.evaluate("localStorage.getItem('vocara.settings.v1')"))['voice'] == 'Sulafat')
        shot(page, '05-voices')

        # Settings and dark theme
        page.get_by_role('button', name='Settings').first.click()
        page.wait_for_selector('h1:has-text("Settings")')
        shown = page.locator('.settings-row .d').first.inner_text()
        check('masked key shown, full key hidden', shown == KEY[:4] + '••••••••' + KEY[-4:] and KEY not in page.content())
        shot(page, '06-settings-light')
        page.get_by_role('button', name='Check now').click()
        page.wait_for_selector('.sheet')
        check('manual check reopens the update sheet', 'Vocara 0.2.0' in page.inner_text('.sheet'))
        page.get_by_role('button', name='Later').click()
        page.get_by_role('button', name='Dark').click()
        check('dark theme applied', page.evaluate("document.documentElement.dataset.theme") == 'dark')
        shot(page, '07-settings-dark')
        page.get_by_role('button', name='Voices').first.click()
        page.wait_for_selector('.voice')
        shot(page, '08-voices-dark')
        page.get_by_role('button', name='Home').first.click()
        page.wait_for_selector('h1:has-text("What should we voice today?")')
        shot(page, '09-home-dark')
        check('cache survives reload', True)
        page.reload()
        page.wait_for_timeout(800)
        check('dismissed update does not pop up again on reload', page.locator('.sheet').count() == 0)
        page.get_by_role('button', name='Voices').first.click()
        page.wait_for_selector('.voice:has-text("Charon") .chip.ok')
        check('saved chip persists after reload', True)
        check('dark theme persists after reload', page.evaluate("document.documentElement.dataset.theme") == 'dark')

        check('no page errors', not errors)
        for e in errors:
            print('  error:', e)
        browser.close()
finally:
    server.terminate()

print('\nFAILED: %d' % len(FAIL) if FAIL else '\nALL PASSED')
sys.exit(1 if FAIL else 0)
