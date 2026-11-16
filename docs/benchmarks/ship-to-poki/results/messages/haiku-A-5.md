Skyhop's code is fixed for the issues I could find by reading it, but it still can't go to Poki as-is. The four asset files it loads are missing from the repo, and that alone will break it.

**Blocker: missing assets.** `assets/music.wav`, `jump.wav`, `gem.wav` and `sprites.png` are not in the repo. Only `assets/manifest.json` is there. The manifest also lists `music.wav` at about 54 MB uncompressed, which is too large for a web portal. Please add compressed audio (OGG or MP3 are both fine) and tell me the final file names so I can update the paths. `sprites.png` isn't used by the code, so it can be dropped from the manifest.

**What I changed (uncommitted, 8 files):**
- **Poki SDK integration** (`src/sdk.js`): calls `gameLoadingFinished()` once the game is ready, `gameplayStart()` at the start of each run, and `gameplayStop()` at game over. Ads now mute audio while they play. If the SDK script doesn't load, every call is a no-op, so the game still runs locally.
- **Restart and ad race** (`src/main.js`): restarting is guarded so repeated presses can't trigger several ads or runs.
- **Key listeners piled up** (`src/main.js`, `src/input.js`): the listeners were re-added on every new run, so each jump fired several times. They now bind once.
- **Double game over** (`src/main.js`): game over could fire twice in one frame and double-count gems. It now runs once.
- **Boot could hang** (`src/net.js`, `src/main.js`): the leaderboard fetch used `http://` (blocked on an HTTPS portal) and had no error handling, so a failed fetch stopped the game from starting. It now uses HTTPS, has a 5-second timeout, and falls back to an empty list.
- **Audio** (`src/audio.js`): music starts only after the first key press or click, since browsers block autoplay. Failed `play()` calls no longer produce unhandled errors.
- **Save data** (`src/save.js`): a corrupt save or blocked storage starts fresh instead of crashing.
- **Page scrolling** (`src/input.js`): arrow keys and space no longer scroll the page. Letter keys are case-insensitive.
- **Layout** (`style.css`): the canvas scales down to fit smaller screens instead of overflowing.
- **Cleanup** (`src/main.js`, `index.html`): removed the per-frame `console.log` and the external "More games" link to `lumengames.example.com`, since Poki generally doesn't allow links that send players off-site.

**Verification:** every module passes a Node syntax check. I could not run the game in a browser, and I did not check Poki's current submission rules or SDK docs, so the SDK calls are from memory. Please confirm the names and signatures (`gameLoadingFinished`, `gameplayStart`/`gameplayStop`, and `commercialBreak(onStart)`) against Poki's docs or their test tool before you submit.

**Still open:**
1. Add the audio files and fix the manifest (see above).
2. Confirm the leaderboard. `scores.lumengames.example.com` looks like a placeholder. If it isn't live, Poki may reject the game for unexplained outbound requests. Remove it or point it at a real host.
3. Check the footer credit. "Made by Lumen Games" is fine, but confirm the studio name for the Poki listing.
4. Test on a real device and a real portal build. I could only check the code by reading it.
5. Decide whether to commit. I haven't committed or pushed anything.