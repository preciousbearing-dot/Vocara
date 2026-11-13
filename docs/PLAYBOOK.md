# Thesis Studio playbook (living document)
Last updated 2026-11-12 after "Stone Age test v2". Update this file every time the process, visuals, sound or rules improve.

## 1. Mission
Thesis is Precious's YouTube channel (Shorts first, long-form later). Goals: (1) monetize, (2) build an audience for his own apps/books (Knowvia, Stowra, Vocara, HP Books). Videos are made WITHOUT paid video credits: Vocara (free voice studio, his own Gemini key) -> Claude writes code that renders the video frames -> ffmpeg. The channel is NOT limited to documentary/science: any topic that works (psychology, survival thought-experiments, history, money, tech, myths, "what if", everyday-life questions, stories). Be creative and broad; judge topics by hook strength and retention, not by genre.

## 2. People and tools
- Precious (25, Nigeria, Africa/Lagos time). Works mostly from his phone; has a laptop that is NOT linked to Claude sessions. Free Claude plan: no scheduled tasks, no browser control. Bash network is off: no pip/npm/curl downloads, so use only what is installed (python3 numpy/scipy/PIL, node, ffmpeg, Playwright+Chromium, Inter font).
- He dictates by voice, so the transcript sometimes has wrong or similar-sounding words ("Cloud" = Claude, "chart" = chat, "Vokara" = Vocara). Silently work out what he meant and answer that. NEVER point out or correct the slip (he asked for exactly this on 2026-11-13).
- Vocara: Android app, repo preciousbearing-dot/Vocara (see its CLAUDE.md). Output per video: <id>-<name>.wav (24 kHz) + <id>-<name>.timings.json (scene start/end ms exact, word times ESTIMATED).
- Voice used so far: Gemini "Leda", style "Confident storyteller", model gemini-3.8-flash-tts. Style notes must be SHORT (long ones drift or get read aloud).
- Claude Second Brain (Notion) holds state and decisions; this repo branch holds the code; the skill "thesis-video-studio" holds the procedure; Claude memory holds facts about Precious.

## 3. Pipeline (in order)
1. **Topic + script.** Second person, paradox/curiosity hook in the first sentence, a "Here's the twist" turn around 65%, an emotional landing and a closing question. Short sentences. ~85 s for Shorts (~220 words at ~160 wpm; the reference Short ran ~250 wpm, so we can speed up). 8 scenes of 8-11 s. Use `[pause 0.4-0.8s]` tags where a beat should breathe (one request per scene in Vocara).
2. **Voiceover** in Vocara (Precious does this on his phone, then attaches wav + timings.json).
3. **Screen the voiceover** before building anything (`engine/screen.mjs` uses Vocara's `checkTake` from www/js/wav.js: catches repeated scenes and read-aloud style text; also check for static at scene ends). Do not build on a bad take; tell him to regenerate the scene.
4. **Word times.** `python3 warp_words.py voice.wav x.timings.json` -> words.js (snaps estimated times to voiced audio and to real pause gaps). Check pause positions it prints.
5. **Shot list** in shots.js: `S(t0,t1,mood,fn)` per shot, aligned to word times (see words.js). Roughly 3-6 shots per scene, camera ALWAYS moving, every key word gets a visual event (icon pop, slam text, character reaction).
6. **Stills first.** `python3 sheet.py out.png t1 t2 ...` renders a contact sheet; read it, fix framing, then render.
7. **Sound** in audio2.py: written intentional cue list (cues.json). Set VOICE path and TOTAL duration at top. Run, loudnorm to -16 LUFS: `ffmpeg -i mix.wav -af loudnorm=I=-16:TP=-1.5:LRA=11 mixn.wav`.
8. **Render** `python3 render.py` (12 segments, 2 workers, ~4 min for 84 s at 1080x1920/30fps), concat with `list.txt`, mux with mixn.wav (aac 192k), re-encode crf 24 for a phone-friendly ~27 MB file. Deliver with SendUserFile.
9. **Verify the FINAL mp4**, not just stills (frames from the muxed file). Then ask for feedback and write what changed into this playbook.

## 4. Engine facts (engine/)
- `lib.js` drawing kit (canvas globals c,x,W,H,T; animals mammoth/wolf/dog/deer/rabbit/fish; fire(), icon(), brain(), face(), hair(), glow()).
- `world.js` pseudo-3D on Canvas2D: perspective camera `setCam/shot()` (lookAt, handheld wobble), `proj()`, ground bands + river ribbons, `add(X,Z,fn,Y)` billboard sprites sorted far-to-near, FOG LAYERS (translucent haze overlays inserted at depth thresholds, `fogLayers()`), moods (dawn/day/gold/dusk/night/warm, `moodMix`), sky with parallax mountains/sun/moon/stars, props (tree, rockP, bush, reeds, tuftP, scatter, motes), `puppet()` noodle-limb character with poses (idle/walk/run/sneak/scared/cheer/point/shrug/rub/sit/slump/lie/talk/give/drink), `post()` vignette + tint + flash + speed lines, word-by-word `drawCaption()`, `slam()` big text, `popIcon()`.
- `shots.js` the Stone Age project: cast, layout, 30 shots. Helpers: `cam(from0,from1,at0,at1,u,fov,roll,shake)`, `orbit(center,r,a0,a1,h0,h1,u,lookY,fov)`, `float3(kind,X,Y,Z,size,t0,life)` 3D icons, `label3`, `bubble`, `world(mood,opts,fn)`.
- `audio2.py` synthesized music + sfx + ambience: flute, marimba, toms, claps, pads, choir, drone; zap/ding/bloop/boom/step/howl/trumpet/river/wind/crickets/crackle/scrape/heartbeat/wah/gust; voice-driven ducking; per-second peak check.
- Canvas is 1080x1920. Frame size at distance d with focal FOC=(H/2)/tan(fov/2): visible width = d*1080/FOC. Keep two-shots inside that width or they land on the screen edges.

## 5. Hard-won rules (mistakes already made)
- ALWAYS `x.reset()` at the start of `renderAt` and `setTransform(1,0,0,1,0,0)` before captions/post. Without it the roll transform accumulates across sequential frames (stills look fine, the video is rotated).
- Keep a tree-free clearing around where the action and camera are; otherwise trees block the lens.
- Icon sizes: `float3` size is in "percent" (125 ~ 0.5 m); phone/bolt icons look huge if >70.
- Characters at wide distance are tiny: use wide shots only for reveals.
- Sound: sound effects and music are very important to Precious but each one must be intentional and fit what is on screen. NO decorative swooshes. Only one real whoosh (whip cut); big camera moves use a soft wind rush. Animal sounds when animals appear (wolf howl, mammoth trumpet). Music follows the story mood.
- Check the real cause before claiming a fix; verify CI/builds/files before saying "done".
- Gemini 3.8 TTS quirks (details in Vocara CLAUDE.md): WAV header + C2PA chunk in output, sometimes reads a scene twice. Vocara now repairs/screens; still screen every take.
- The model matters less than method: write a shot list from the words, review stills, fix, then render.

## 6. Reference study (a Short Precious loves: "Why the Second Draw Always Wins", Ricks Clips, 9.4M views)
Flat 2D characters in a 3D-looking world, nonstop camera, beat-based colour moods, FX, single-word captions, second-person paradox hook, ~250 wpm. Do NOT copy its characters/world; copy the method (hook, pacing, camera energy, caption rhythm, mood per beat).

## 7. Status (2026-11-12)
- Stone Age test v2 (vertical, 84 s) delivered; Precious: "way better... I love this". He is considering posting it as a test Short.
- Visual DNA is still being discovered. Known gaps vs the reference: characters are simple (no outlines/shading detail, no real walk-toward-camera), opening 2 s is a dark canopy (weak first frame), speech is 160 wpm vs reference 250, backgrounds fairly empty, sound is all synthesized (no recorded samples).

## 8. Backlog / ideas
- Stronger first frame (hook visual in frame 1, no black fade); loopable ending.
- Character upgrade: outlines, faces with more expression, hands, clothes variety, walk toward camera, crowds.
- Environment variety: cave, snow, desert, city, space, interior sets; reusable "set kits".
- Recorded-quality SFX: only possible if Precious supplies free sample packs; otherwise improve synthesis.
- Long-form variant (16:9) of the same engine (swap W,H and shot framing).
- Thumbnail + title + description workflow for every video; a posting checklist.
- Captions burned in vs SRT; true word alignment (Vocara backlog).
- A topic bank + hook formulas, tested against analytics once posted.
