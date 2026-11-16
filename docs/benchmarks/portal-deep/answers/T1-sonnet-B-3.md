# Audit: Skyhop (v0.9.0)
Stack: plain JavaScript (ES modules), Canvas 2D, no bundler, no TypeScript, no lockfile. `package.json` has only a `start` script.
Build: not applicable, since there is no build step. I did not run the game in a browser, so everything below comes from reading the code.

## Findings (ranked)

1. **[blocker] The Poki SDK is not integrated correctly.**
   - Evidence: `src/sdk.js:3` calls `PokiSDK.init()` with no error handling. `index.html:7` loads the SDK from a CDN script tag. If an ad blocker blocks the script, `PokiSDK` is undefined, `boot()` throws at `src/main.js:88`, and the game never starts. `src/sdk.js` also never calls `gameLoadingFinished()`, `gameplayStart()` or `gameplayStop()`. `showAd()` at `src/sdk.js:7` only calls `commercialBreak()`, so a blocked SDK throws there too and the restart flow dies.
   - Impact: Poki requires the gameplay and loading events, and a blocked SDK leaves a blank page.
   - Route to: cl-core:cl-port (Poki), or the web-game-developer agent.

2. **[blocker] `assets/music.wav` is 54.5 MB, uncompressed.**
   - Evidence: `assets/manifest.json:3` (54,525,952 bytes). It is loaded eagerly at `src/audio.js:1`.
   - Impact: far over Poki's initial-download budget, and on mobile it is a long wait or a crash. Compress it to OGG/MP3 (roughly 2–4 MB) and stream it or load it lazily. `jump.wav` and `gem.wav` are also WAV and could be converted.
   - Route to: cl-release:game-performance-engineer.

3. **[high] Audio is not gated on a user gesture and has no error handling.**
   - Evidence: `src/main.js:92` calls `startMusic()` straight after boot, and `src/audio.js:6` ignores the promise returned by `play()`. Browsers block autoplay, so this rejects with an unhandled promise error and the music never starts. After that the game has no music at all.
   - Related: `play()` at `src/audio.js:10-12` resets `currentTime` on a single shared element, so overlapping sounds cut each other off. It also throws on an unknown name.
   - Route to: web-game-developer.

4. **[high] An external leaderboard blocks boot over plain HTTP.**
   - Evidence: `src/net.js:1` uses `http://` on a `.example.com` host, and `src/net.js:5` has no try/catch. `src/main.js:90` awaits it before `newRun()`, so if the request fails the game never starts.
   - Impact: the browser blocks mixed content on HTTPS portals, so this request is blocked and the game stays blank. Poki also disallows third-party calls and custom leaderboards. Remove it, or make it non-blocking and optional.
   - Route to: cl-core:cl-port.

5. **[high] A new keyboard listener is added on every run.**
   - Evidence: `bindKeys(jump)` is called inside `newRun()` at `src/main.js:23`, and `restart()` calls `newRun()` at `src/main.js:33`.
   - Impact: each restart adds another listener. After n restarts, one jump press calls `jump()` n times. Because `jump()` at `src/main.js:26-27` calls `restart()` when the game is over, a single Space press can fire multiple restart ads and several `newRun()` calls. Move the binding into `boot()`.
   - Route to: web-game-developer.

6. **[high] There is no touch or mobile input, no pause on tab hide and no resize handling.**
   - Evidence: `src/input.js` handles only the keyboard. The canvas is fixed at 960×540 in `index.html:10`. There is no `visibilitychange` handler and no devicePixelRatio scaling.
   - Impact: Poki is mostly mobile traffic, so the game cannot be played there. When the tab is hidden, the game keeps running, and it is not muted for ads either.
   - Route to: cl-web:web-harness.

7. **[high] Physics is tied to the frame rate.**
   - Evidence: `src/main.js:81-85` has no delta time, and `src/main.js:39-42` uses fixed per-frame steps (`p.x -= 4`, `vy += 0.5`).
   - Impact: the game runs about 2.4× faster on 144 Hz monitors than on 60 Hz ones, which is a gameplay bug. Use a fixed timestep.
   - Route to: cl-web:web-game-architecture.

8. **[medium] There is a console.log in the per-frame update.**
   - Evidence: `src/main.js:54`.
   - Impact: it prints about 60 lines a second, which hurts performance and floods the console. Poki reviewers will notice it. Remove it.

9. **[medium] The save system is fragile and has no schema version.**
   - Evidence: `src/save.js:5` calls `JSON.parse` with no try/catch, so corrupt data makes boot throw. `localStorage` throws in some embedded or private contexts, and `src/save.js:9` has no guard. There is no schema version field. Poki recommends the SDK's data storage or a safe wrapper.
   - Route to: cl-release:release-hub (save-system checks).

10. **[medium] There is an external link and a branding footer.**
    - Evidence: `index.html:11` has a "More games" link to a non-Poki site.
    - Impact: Poki rejects links that send players off-platform. Remove it.
    - Route to: cl-core:cl-port.

11. **[medium] Gameplay and rendering bugs.**
    - The player is not clamped to the canvas horizontally (`src/main.js:39-40`), so it can walk off-screen, but the death check only covers `y` (`src/main.js:53`).
    - `gameOver()` can run more than once in a frame, because it is called inside the storm loop at `src/main.js:51`. `data.gems` is then incremented again.
    - The "A"/"D" keys are matched case-sensitively (`keys.a`, `keys.d` at `src/main.js:39-40`), and `e.key === "w"` at `src/input.js:6` breaks with Caps Lock on. Use `e.code`.
    - Space and the arrow keys scroll the page because `preventDefault` is not called.
    - Route to: web-game-developer.

12. **[low] Hygiene.**
    - There is no `package-lock.json`, no build script and no minification.
    - There are no tests.
    - `start` uses `npx serve`, which is not pinned.
    - The README has no controls or credits section, and there is no asset licence information.

## What is healthy
- The code is small and modular: `src/world.js`, `src/input.js` and `src/save.js` are cleanly separated, with a single entry point.
- The SDK calls sit behind a wrapper (`src/sdk.js`), so no provider code is mixed into gameplay logic.
- Collision is simple and correct for the one-way island platforms.
- The sprite and sound files are small, except the music.

## Handoff
Changed: nothing (audit only)
Evidence: read all 12 tracked files (`index.html`, `package.json`, `style.css`, the manifest and `src/*.js`). I did not run the script `scripts/ts_health.mjs`, because the project has no TypeScript.
Verify: for #2, check `assets/manifest.json:3`. For #5, restart three times and press Space once; you should see three ad calls. For #1, block `poki-sdk.js` and reload; the page stays blank.
Open: I did not run the game in a browser, so the frame-rate, autoplay and mobile behaviour are from reading the code only. The asset files are not in the repo, so the sizes come from the manifest. I could not check Poki's current submission requirements.
Next: fix #1 and #2 first (SDK lifecycle with a safe fallback, and compress the music), then #4 and #5.