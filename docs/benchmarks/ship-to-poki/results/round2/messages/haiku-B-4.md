Skyhop now passes all 20 checks in the kit's Poki preflight, up from 1 of 20 at the start. The changes are in the working tree and not committed.

**What I changed**

- **Poki SDK wrapper (`src/sdk.js`):** every SDK call is guarded, so the game runs when the script is blocked or `init()` rejects. Init has a 5-second timeout. Ad breaks have a 30-second fallback. `gameplayStart`/`gameplayStop` are paired and never double-fire.
- **Lifecycle (`src/main.js`):** `gameLoadingFinished` fires after the first frame. `gameplayStart` fires on the first input. `gameplayStop` fires on every game over and when the tab is hidden. Each restart runs `commercialBreak`, then `gameplayStart`. Input and audio are ignored or muted during the break.
- **Input (`src/input.js`):** arrow keys, space, and the wheel no longer scroll the page. Key listeners are bound once, not on every restart. Stuck keys clear on window blur. Holding space no longer auto-repeats jumps.
- **Touch (`src/input.js`):** tap to jump, hold the left or right half to move. The game had no touch input, and Poki requires phone and tablet support. Phones are untested.
- **Timing (`src/main.js`):** a fixed 60 Hz step, so 144 Hz screens don't play 2.4× faster. Removed the per-frame `console.log`.
- **Audio (`src/audio.js`):** music waits for the first input. `play()` rejections are caught, and music pauses when the tab is hidden.
- **Saves (`src/save.js`):** blocked storage and corrupt save data fall back to defaults.
- **Network (`src/net.js`):** switched from `http://` to `https://`, with a 3-second timeout that returns `[]` on failure. Boot no longer waits on it.
- **Page (`index.html`, `style.css`):** added a viewport meta tag, removed the outgoing "More games" link, and scaled the canvas to 16:9 within the window.
- **README:** added the touch controls.
- **`preflight.config.json`:** new, at the repo root, so the same checks can be re-run. The kit says to keep it.

**Still open, and needs you before submitting**

1. **The game has no audio or sprites in the repo.** `assets/music.wav`, `jump.wav`, `gem.wav`, and `sprites.png` were never committed. `assets/manifest.json` lists them, so the shipped game is silent. I can't create these files.
2. **The music file is 54 MB uncompressed.** Re-encode it to OGG or MP3. Poki asks for small files and says players leave if loading takes more than 10 seconds.
3. **The leaderboard is an external request.** Poki blocks external requests by default, and leaderboards are approved case by case. Either get an exception from Poki or remove the fetch. Until then the "Top" field shows "-".
4. **The URLs still use `example.com` placeholders.** Confirm the real leaderboard domain.
5. **Phone layout is untested.** The canvas is 960×540 and scales down on small screens, so the 18 px HUD text may be hard to read. Check on a real device.
6. **Poki Inspector hasn't been run.** It needs a manual drag of the folder in a browser. The kit's preflight is a substitute, not the official test.
7. **Web exclusivity.** Poki's terms forbid publishing the same game on other web portals. Decide before any other web portal.
8. **Not committed.** Commit when you're happy with it.

**Judgement calls you may want to change:** the jump-on-tap touch scheme, ignoring key auto-repeat, removing the footer link rather than routing it through `openExternalLink`, and the timeout fallbacks in the ad break (30 seconds) and SDK init (5 seconds).

The Poki API calls follow the kit's snapshot, verified 2026-11-16. I did not re-fetch the live Poki docs today.