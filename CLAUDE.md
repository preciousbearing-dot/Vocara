# Vocara

Free-to-run voice studio. Script in, voiceover audio + captions out, using the owner's own Gemini API key. Built as a web app (plain JS ES modules, no framework) wrapped in a Capacitor Android APK, built and signed on GitHub Actions.

## Rules
- No inline styles or inline scripts (strict CSP in www/index.html). Use classes; dynamic values via h(..., {vars}).
- `Node.append(null)` prints "null". Filter nulls before spreading into append/replaceChildren (h() already skips them).
- The API key goes only in the `x-goog-api-key` header, never a URL, never the settings blob, never logs.
- Spend quota carefully: everything that calls Gemini must go through `clip()` in www/js/services.js so it is cached.
- Core logic lives in www/js/*.js (no DOM) and is unit tested in tests/core.test.js. UI is checked by tests/ui_smoke.py (headless Chrome, Google mocked).

## Commands
- `npm test` unit tests
- `npm run prepare:web` copy fonts
- `node scripts/serve.mjs` then open http://127.0.0.1:4173
- `python3 -I tests/ui_smoke.py [screenshot_dir]` browser smoke test

## CI secrets (repo Settings > Secrets and variables > Actions)
VOCARA_KEYSTORE_BASE64, VOCARA_KEYSTORE_PASSWORD, VOCARA_KEY_ALIAS, VOCARA_KEY_PASSWORD. Without them CI signs with a throwaway debug key so the APK still installs, but it cannot update a previous install.

## Updates
Every push to main builds and publishes release `apk-latest`. CI stamps `www/build.json` and Android `versionCode` with the run number (Android refuses updates otherwise) and uses the commit message as the update details: first line = headline, then `- bullets` of what is new, written for the user. Keep the signing keystore secrets unchanged forever or installed apps can no longer update.

## Not built yet
Scene editor, export (wav/srt/timings), presets, quota queue, library, local MCP server.
