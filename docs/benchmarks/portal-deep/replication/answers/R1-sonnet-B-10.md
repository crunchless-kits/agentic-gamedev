# Audit: Skyhop (v0.9.0)

**Stack:** plain JavaScript with ES modules and a 2D canvas. There is no bundler, no TypeScript and no lockfile, so I skipped the TS checks. `package.json` only has `npx serve .`.
**Build:** there is no build step. I did not run the game in a browser. This is a read-only static audit of all 11 source files. I did not edit anything.

## Findings (ranked)

1. **[blocker] The game never starts if the leaderboard request fails.**
   - Evidence: `src/main.js:90` awaits `fetchTopScores()` before `newRun()` and `loop()`. `src/net.js:3-5` has no try/catch or timeout and doesn't check `res.ok`.
   - Impact: the URL is `http://scores.lumengames.example.com/...` (`src/net.js:1`). That is a placeholder domain and plain HTTP, so it is blocked as mixed content inside Poki's HTTPS iframe. The player gets a black or empty canvas.
   - Fix: wrap the call in try/catch, don't block boot on it, and use HTTPS. Better, drop it or confirm Poki allows the call.

2. **[blocker] The Poki SDK is incomplete and fragile.**
   - Evidence: `src/sdk.js:2-8` and `src/main.js:87-88`.
   - Missing calls: there is no `gameLoadingFinished()`, no `gameplayStart()` when a run begins, and no `gameplayStop()` on game over or before the ad. Poki requires these.
   - Missing guards: `PokiSDK.init()` has no catch, so an ad blocker makes `boot()` throw and the game never starts. `commercialBreak()` (`src/sdk.js:7`) has no audio mute or input lock, and no catch.
   - Fix: call `init().catch(...)` and continue anyway, and add the lifecycle calls. Mute audio around ads.

3. **[blocker] There is an external link in the footer.**
   - Evidence: `index.html:11` ("More games" → `lumengames.example.com`, `target="_blank"`).
   - Impact: Poki rejects games with outbound links or branding that drive players off-portal. Remove the footer.

4. **[high] The 52 MB uncompressed music file breaks load time.**
   - Evidence: `assets/manifest.json:3` lists `music.wav` at 54,525,952 bytes, and `src/audio.js:1` loads it.
   - Impact: it is far over Poki's initial-load budget and means a very long wait on mobile. Re-encode to OGG or MP3 (about 2–4 MB) or stream it.
   - Also: `sprites.png` (`manifest.json:6`) is never loaded, so it is dead weight. The audio files named in the manifest aren't in the repo, so I couldn't verify them.

5. **[high] Restarting stacks key listeners and fires multiple ads.**
   - Evidence: `bindKeys(jump)` runs inside `newRun()` (`src/main.js:23`), so every restart adds another `keydown`/`keyup` pair (`src/input.js:4,8`).
   - Impact: after N restarts, one jump press fires `jump()` N times, which compounds the restart problem.
   - Related: `jump()` calls `restart()` while `state.over` is true (`src/main.js:27`). Nothing guards against re-entry during `await showAd()` (`src/main.js:32`), so key-repeat or a double-tap shows multiple ads and builds multiple runs.
   - Fix: bind once in `boot`, and add a `restarting` flag.

6. **[high] Autoplay and audio errors are unhandled.**
   - Evidence: `src/audio.js:6-7` and `12`. `music.play()` and `s.play()` return promises that nobody catches.
   - Impact: `startMusic()` runs at boot (`src/main.js:92`) before any user gesture, so browsers reject it. Music never starts, with an unhandled-rejection error. It should start on first input.
   - Also: sound effects reuse a single `Audio` element, so rapid gem pickups cut each other off.

7. **[high] Physics is tied to the frame rate.**
   - Evidence: `src/main.js:39-42` and `81-85`. Movement, gravity and storm speed are per-frame constants, and `loop()` ignores time.
   - Impact: on 120/144 Hz screens the game runs 2.4x faster than on 60 Hz, which changes jump arcs and storm speed.
   - Fix: use a fixed timestep.

8. **[medium] `gameOver()` can run twice in one frame.**
   - Evidence: `src/main.js:51,53,57-62`. Nothing returns after the first call, so overlapping two storms, or a storm and a fall, fires it twice.
   - Impact: `data.gems` is double-counted and saved twice. Add `if (state.over) return;` at the top.

9. **[medium] The game doesn't pause when the tab is hidden, and no input path is safe.**
   - Evidence: there is no `visibilitychange` or `blur` handler anywhere.
   - Impact: the game keeps running and playing music in the background.
   - Also:
     - There is no touch or mobile control (`src/input.js` is keyboard only), and Poki traffic is mostly mobile.
     - Keys are matched by `e.key`, so Caps Lock or Shift breaks `"a"`, `"d"` and `"w"` (`src/main.js:39-40`, `src/input.js:6`).
     - Space and the arrows aren't `preventDefault`ed, so the host page can scroll.
     - Held keys stay stuck after focus loss.

10. **[medium] Saves are fragile.**
    - Evidence: `src/save.js:4-9`.
    - Problems:
      - `JSON.parse` and `localStorage` have no try/catch. Blocked storage in a cross-origin iframe, or a corrupt value, throws during `boot()`.
      - A partial or old save leaves `data.best` undefined.
      - There is no version field.
    - Fix: guard it, merge with defaults, and add a schema version. Consider Poki's recommended storage handling.

11. **[medium] A `console.log` runs every frame.**
    - Evidence: `src/main.js:54`. It logs 60 or more lines per second, which hurts performance and floods the console. Remove it.

12. **[low] The canvas is fixed at 960x540.**
    - Evidence: `index.html:10`, `style.css:2`.
    - There is no scaling to the iframe, no handling of device pixel ratio, and no orientation handling. It will be cropped or letterboxed oddly on small screens.

13. **[low] Hygiene.**
    - There is no build or minify step and no lockfile. `npx serve` is fetched at run time.
    - There is no sprite or art pipeline. Everything is `fillRect` and `sprites.png` is unused.
    - `README.md` describes controls but the footer and credits are unfinished.
    - Gems that have been taken are never reset except by `newRun`. This is fine, but the island layout is identical every run.

## What is healthy
- The code is small, modular and split sensibly: `world`, `save`, `input`, `sdk` and `net` are separate files, with the SDK behind a wrapper (`src/sdk.js`).
- Gameplay code doesn't import provider code directly, apart from the `PokiSDK` global in `sdk.js`.
- Collision and the draw loop are simple and allocation-light, with no per-frame object churn.
- The Poki SDK script tag is present (`index.html:7`).

## Handoff
**Changed:** nothing (audit only).
**Evidence:** I read all 11 tracked files with `cat -n`. I ran no build, `tsc` or browser, since there is no build and no dependencies.
**Verify:** open the game with the leaderboard URL unreachable (as it is now). The canvas stays blank and the console shows the `fetch` failure (finding 1). Then press space repeatedly after game over and count the `showAd` calls (finding 5).
**Open:**
- I did not run `scripts/ts_health.mjs` or spawn scouts, because it is a 190-line plain-JS project. I did not run the game, so the performance and device findings come from reading the code.
- The audio and sprite files aren't in the repo, so their real sizes are unverified.
- Poki's current review checklist should be checked, because I cited it from memory.

**Next:** fix findings 1–3 first (about an hour), then compress the music (finding 4).

If you want, I can route the Poki integration items to `cl-core:cl-port` and run `cl-core:cl-ship` for a ship decision once those are fixed.