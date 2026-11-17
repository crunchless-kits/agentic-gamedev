All 20 preflight checks now pass, but Skyhop isn't ready to submit yet. The 54 MB soundtrack, touch controls and the leaderboard are still open, and I haven't run the Poki Inspector.

I started with `web-portal-preflight` (the kit's fake-browser check of Poki's rules). It failed 19 of 20 checks on the original build. After the fixes it passes 20 of 20, exit 0. That tool doesn't replace the Inspector. Nothing is committed.

## What I changed

- **`src/sdk.js`:**
  - Every Poki call is now guarded, and `init()` failures are caught. Before, a blocked SDK or ad blocker crashed the game before anything was drawn.
  - I added `gameLoadingFinished`, `gameplayStart` and `gameplayStop`, which were never called before.
  - `commercialBreak` now takes a callback.
- **`src/main.js`:**
  - Boot sends loading-finished, and gameplay-start fires on the first input. Gameplay-stop fires on death, and every restart does break, then resume, then start.
  - The leaderboard fetch no longer blocks boot.
  - Movement runs on a fixed 60 Hz step. Before, it was 300 px off between 60 and 144 fps.
  - The simulation and audio pause when the tab is hidden.
  - I removed the per-frame `console.log`.
- **`src/audio.js`:**
  - Music starts after the first key press, and a rejected `play()` is caught.
  - There is a mute that the ad break and hidden tab use.
- **`src/input.js`:**
  - Listeners are bound once. They used to stack on every restart.
  - `preventDefault` is applied to arrows, space and the wheel.
  - Input is ignored during an ad break.
- **`src/save.js`:** `localStorage` and the JSON parse are wrapped in try/catch, so incognito and corrupt saves no longer break boot.
- **`index.html` and `style.css`:**
  - I removed the "More games" external link, which Poki disallows.
  - I added a viewport meta tag, and the canvas now scales to the window at 16:9.
- **`src/net.js`:** the leaderboard URL is now https and failures return an empty list.
- **`preflight.config.json`:** new, so you can re-run the check with `node .claude/skills/web-portal-preflight/scripts/preflight.mjs --config preflight.config.json`.

## Still open

1. **Music file size.** `assets/manifest.json` lists `music.wav` at 54 MB, uncompressed, and Poki warns that players leave after about 10 seconds of loading. The audio files aren't in the repo, so I couldn't convert or measure anything. Convert the music to OGG or MP3, which should be a few MB, and re-measure load time.
2. **Leaderboard.** Poki blocks external requests by default. Either get `scores.lumengames.example.com` approved under Settings, then CSP, in Poki for Developers (reviewed case by case), or remove the feature. I kept it as optional. It shows "-" when blocked, but I haven't confirmed the https endpoint exists.
3. **Touch controls.** Poki requires mobile and tablet support, and the game is keyboard-only. This needs a design decision, such as on-screen buttons or tap-to-jump.
4. **Poki Inspector.** I haven't run it on a build folder. Do that before submitting.
5. **Not tested.** I haven't played it in a real browser, so I haven't tried the ad flow with the real SDK or a phone. The mock is not the real Poki SDK.
6. **Hosting.** The preflight serves from the project root. Make sure you upload a folder containing `index.html`, `src/`, `assets/` and `style.css`, and nothing else. `.claude/`, `CLAUDE.md` and `README.md` should stay out of the upload.