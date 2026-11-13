---
name: thesis-video-studio
description: Make a Thesis YouTube video end to end (script, Vocara voiceover screening, code-rendered pseudo-3D vertical video, intentional sound, delivery). Living skill: update it after every video.
---
# Thesis video studio (living skill)
Use when Precious asks for a Thesis video, a new topic/script, or to improve the video process. Read this, then the Notion page "Claude Second Brain > Projects > Thesis Channel", then fetch the code: attach repo preciousbearing-dot/Vocara and `git fetch origin thesis-studio && git checkout thesis-studio` (folder `engine/` code, `docs/PLAYBOOK.md` full details, `docs/CHATGPT_BRIEF.md`).

## Non-negotiables
- Channel is not limited to documentary/science: any topic that works. Judge by hook and retention.
- Script and visuals get equal effort. Sound effects and music are important but each must be intentional and fit what is on screen (no decorative swooshes; animal sounds when animals appear).
- Do not build anything until the voiceover is screened (repeats, static, read-aloud style). He regenerates scenes in Vocara if needed.
- Verify the FINAL muxed file before delivering. Never claim a fix you haven't checked.
- He works from his phone: deliver a ~25-30 MB MP4 via SendUserFile; keep replies short. He dictates by voice, so the transcript has similar-sounding wrong words ("Cloud" = Claude, "chart" = chat): silently understand what he meant and never point out or correct it.
- Free plan, no network installs: use installed python3/numpy/scipy/PIL, node, ffmpeg, Playwright Chromium.

## QA GATE (mandatory, added 2026-11-13)
Never call a video ready or postable until: frame 0 is a designed cover; every overlay is inside the safe area on EVERY frame (automated check); captions align to real audio onsets within 0.12 s (automated check); contact sheets every 1 s were read; and the reply lists what was not verified. Precious found cut-off icons, a blank first frame and drifting captions in v2 that I missed. Details: docs/PLAYBOOK.md section 6b. Next test format: 16:9 landscape.

## Procedure
1. Topic + script (second-person paradox hook, twist ~65%, closing question, 8 scenes, `[pause 0.5s]` tags, ~220 words/85 s).
2. He generates wav + timings.json in Vocara (Leda, "Confident storyteller", gemini-3.8-flash-tts, short style) and attaches them.
3. Screen: node engine/screen.mjs (Vocara checkTake). Bad take -> ask him to regenerate that scene.
4. `python3 engine/warp_words.py voice.wav x.timings.json` -> words.js.
5. Write the shot list in shots.js against word times; camera always moving; visual event per key word; moods per beat.
6. `python3 sheet.py sheet.png <times>` contact sheets; read them; fix framing; repeat.
7. audio2.py: write the cue list first, synthesize music/sfx/ambience, duck under voice, loudnorm -16 LUFS.
8. `python3 render.py` (12 segments, ~4 min), concat, mux, crf 24 compress, verify frames from the final file, deliver.
9. Ask for feedback; append what you learned to docs/PLAYBOOK.md and push the branch; update the Notion page Current State; update this skill.

## Pitfalls
x.reset() each frame; keep a clearing free of trees; mind frame width at distance (d*1080/FOC); icon sizes; wide shots make people tiny.
