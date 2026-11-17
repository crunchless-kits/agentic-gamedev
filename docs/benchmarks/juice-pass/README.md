# Juice Pass: Before and After

**Role: RECORDS.** One art and game-feel pass by the kit on Skyhop, the sample game from the ship-to-Poki benchmark. The site's before-and-after frames come from here.

## Setup

- Start: `sonnet-B-2` from ship-to-Poki round 2, a kit build that passes all 22 preflight checks. It is `before/`.
- Kit: v0.17.0 source, web bundle, installed with `node scripts/install.mjs --project . --bundle web`.
- Agent: Claude Code, `claude-sonnet-5-5`, headless, one run, 17 Nov 2026. 91 seconds, 0.32 USD.
- Brief, word for word: "Skyhop plays fine but looks and feels flat: plain rectangles and no feedback. Give it a look and some game feel using the kit's art direction and game-juice skills. Draw everything in code (canvas), no generated or downloaded images. Keep the gameplay rules, controls, and Poki SDK behavior as they are, and keep the web portal preflight passing (preflight.config.json is in the repo). I can't answer questions during this run, so pick your recommended answer for each decision. When you're done, tell me what you changed."
- Result: `after/`, unedited. The agent's own summary is `agent-report.md`. It reports the preflight still at 22 of 22.

## Frames

`look-before.png` and `look-after.png` were taken in Chrome at the same moment in each build: one tap to start, one jump, then a capture of the canvas. One run, no retakes of the agent's work.

## What It Does Not Show

One game, one run, and no comparison against an agent without the kit on this task. It shows what the pass produced, not that the kit beats an unaided agent at art.

## Changelog

- 2026-11-17: First version.
