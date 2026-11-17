The project is updated, but I have not run it in a browser or against the real Poki SDK. I did syntax-check every JS file with Node. Nothing is committed.

## What I changed

- **Removed the external leaderboard** (`src/net.js`, deleted). It was an `http://` request to a third-party host with no error handling, which would break on Poki's HTTPS page. The HUD now shows Gems where it showed the top score.
- **Removed the "More games" link** from the footer. Poki does not allow links to other sites.
- **Poki SDK integration** (`src/sdk.js`):
  - Calls `gameLoadingStart`/`gameLoadingFinished`, `gameplayStart` on each run, and `gameplayStop` on game over.
  - Mutes all audio during the commercial break and unmutes after it.
  - If the SDK script is blocked or missing, every call becomes a no-op instead of crashing.
- **Ad and input bugs** (`src/main.js`, `src/input.js`):
  - Key listeners are bound once, not on every restart.
  - An `adOpen` guard stops repeated jump presses from starting several ads.
  - Arrow keys and space no longer scroll the page.
  - Held keys are released when the window loses focus.
  - Audio starts on the first key press, since browsers block autoplay.
- **Other code fixes:**
  - Removed the per-frame `console.log`.
  - `localStorage` access is wrapped in try/catch, for sandboxed iframes.
  - Audio `play()` promise rejections are caught.
- **Layout** (`style.css`, `index.html`): the canvas scales to the window at 16:9 and the viewport meta tag is added.

## Still open (must resolve before submitting)

1. **Assets are missing.** `assets/` contains only `manifest.json`. `music.wav`, `jump.wav`, `gem.wav`, and `sprites.png` are not in the repo. The game will run silently, and the 404s are the least of it. Add them.
2. **Music size.** The manifest lists `music.wav` at 54 MB uncompressed. Convert it to OGG or MP3 (a few MB) before upload. Update the path in `src/audio.js` to match.
3. **Mobile controls.** The game is keyboard-only. Poki's audience is largely on touch devices, and a game with no touch input may be rejected or score poorly. This needs a design decision, so I did not build it.
4. **Test against the real SDK.** Check in Poki's sandbox or their test tool that `PokiSDK.commercialBreak(onStart)` accepts the callback in the current SDK version, and that the ad-block fallback behaves as intended. I wrote this from memory of the v2 API.
5. **Stale manifest.** `assets/manifest.json` lists files that do not exist. Delete it or regenerate it once the assets are in place.
6. **Version.** `package.json` still says 0.9.0. Bump it if you want the submission tagged.