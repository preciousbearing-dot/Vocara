# Thesis Studio (branch `thesis-studio` of preciousbearing-dot/Vocara)
Code-rendered video engine for the Thesis YouTube channel. Not part of the Vocara app; lives on its own branch so Vocara's main CI is untouched.
- docs/PLAYBOOK.md  full workflow, rules, status, backlog (living)
- docs/SKILL.md     copy of the Claude skill "thesis-video-studio"
- docs/CHATGPT_BRIEF.md  paste into ChatGPT for scripts/topics
- docs/stone-age-script.md  first vertical test script
- engine/  lib.js world.js shots.js words.js video.html still.py sheet.py render.py audio2.py screen.mjs warp_words.py cues.json stone-age.timings.json
Run: copy engine/ to a work folder, put the voice wav next to it, `python3 sheet.py s.png 1 5 9`, `python3 render.py`. Paths inside render.py/still.py/video.html assume /home/claude/work/v2; change them if you move it.
