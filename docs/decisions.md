# Decisions

- Built from the ground up on GitHub, not in Google AI Studio: Claude can edit, test and ship it, and the app is ours.
- APK first (Capacitor + GitHub Actions); developed as a web app inside, so it can be tested in a browser.
- One repo for code and docs.
- Plain JS modules, no framework: smaller APK, less to break, no build step for the UI.
- Previews and takes are cached by SHA-256 of model+voice+style+text so repeat plays never spend quota.
- Key is stored in localStorage under its own key for now. Android Keystore storage (secure plugin) is a later hardening step.
- Default model gemini-3.1-flash-tts-preview; free-tier access is not verified, so the model is editable and "Test key" lists what the key can use.
- Local MCP server on the laptop comes after the app, sharing the same engine code.
