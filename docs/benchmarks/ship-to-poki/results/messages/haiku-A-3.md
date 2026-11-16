Skyhop's code is ready for a Poki build, but the submission isn't ready yet. The repo is missing the audio and sprite files, and the leaderboard points at a placeholder domain. I haven't run it in a browser or on Poki, and nothing is committed.

**Changes made (7 files, uncommitted):**

- **`src/sdk.js`**: Every Poki call is guarded, so the game still runs if the SDK script is blocked or you're testing locally. Added the loading and gameplay lifecycle calls (`gameLoadingStart`/`gameLoadingFinished`, `gameplayStart`/`gameplayStop`), which Poki expects. Ads now mute audio while they play.
- **`src/main.js`**:
  - Fixed a double-count bug: two storms hitting in the same frame called game over twice and added the gems twice.
  - Restarting no longer stacks ad calls when keys repeat.
  - Keyboard listeners bind once, not on every restart.
  - Removed the per-frame `console.log`.
  - A boot failure is now caught and logged.
- **`src/net.js`**: The leaderboard fetch has a 5s timeout and returns an empty list on failure. Previously an unreachable `http://` endpoint would have stopped the game from starting on Poki's https page.
- **`src/audio.js`**: Autoplay rejections and missing-file errors are caught. Added `setMuted` for ad breaks.
- **`src/input.js`**: Arrow keys and space no longer scroll the page inside the iframe. Holding space no longer re-jumps. Keys release on window blur.
- **`src/save.js`**: `localStorage` errors are caught, and loaded saves fill in missing fields.
- **`index.html`**: Removed the "More games" link to an external site opening in a new tab. I'm not certain of Poki's exact wording on this, but external links like that are commonly rejected. Restore it if Poki confirms it's allowed.

**Still open (needs you before submission):**

1. **Missing assets.** `assets/` contains only `manifest.json`. `music.wav`, `jump.wav`, `gem.wav`, and `sprites.png` are listed there but aren't in the repo. Without them there's no sound, and the sprites file is unused by the code. Restore them.
2. **Music size.** The manifest says `music.wav` is 54 MB uncompressed. Re-encode it as OGG or MP3 (a few MB) and update the path in `src/audio.js`. I couldn't check Poki's exact size limit, so confirm it against their upload requirements.
3. **Leaderboard endpoint.** `scores.lumengames.example.com` is a placeholder. Point it at a real endpoint that serves https and allows Poki's origin via CORS. Until then the top score just doesn't appear.
4. **Poki SDK names.** I wrote the lifecycle calls from memory of the v2 SDK, and I can't reach Poki's docs from here. Check them against the current docs and test in Poki's SDK debug mode.
5. **Fixed 960×540 canvas.** It doesn't scale to the iframe size, so check how it looks on the portal's layouts.
6. **Testing.** I only syntax-checked the modules. Play a full run in a browser, including a game over, a restart with an ad, and the leaderboard failing.

Say the word and I'll commit these changes.