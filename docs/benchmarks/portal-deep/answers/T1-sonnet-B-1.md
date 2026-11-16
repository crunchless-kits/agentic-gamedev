# Audit: Skyhop (v0.9.0)
Stack: plain JavaScript with ES modules, Canvas 2D, no bundler, no `package.json` dependencies, no TypeScript.
Build: not applicable, since there is no build step. `npm start` serves the folder with `npx serve`. I didn't run the game or the `ts_health` script. This is a read-only audit of all 11 tracked files, and I edited nothing.

## Findings (ranked)

1. **[blocker] The 52 MB uncompressed WAV soundtrack.**
   - Evidence: `assets/manifest.json:3` (54,525,952 bytes), loaded at `src/audio.js:1`.
   - Impact: the file is about 100 times larger than the rest of the game combined. It will blow past Poki's size and load-time expectations and will likely be rejected. Players on slow connections will get no music for a long time.
   - Route to: convert to OGG/MP3 at about 1 MB, ideally with a streamed or lazy load.

2. **[blocker] Restart stacks key listeners.**
   - Evidence: `src/main.js:23` calls `bindKeys(jump)` inside `newRun()`, and `newRun()` runs on every restart (`src/main.js:33`). `src/input.js:4-10` adds fresh `window` listeners each time.
   - Impact: after N restarts, one keypress fires `jump()` N times. On game over, that means N parallel `restart()` calls, N ad requests at `src/main.js:32` and N `newRun()` calls, which add still more listeners. The effect compounds each run. It also plays the jump sound multiple times.
   - Route to: web-game-developer. Bind input once, in `boot()`.

3. **[blocker] A failed leaderboard fetch stops the game from starting.**
   - Evidence: `src/net.js:1` uses a plain `http://` URL on a placeholder `.example.com` host. `src/net.js:5` has no `.ok` check and no catch. `src/main.js:90` awaits it before `newRun()` and `loop()`.
   - Impact: the URL is mixed content inside Poki's HTTPS iframe, so it is blocked. The host is also a placeholder. Any network error, block or offline player gives a permanent blank canvas.
   - Route to: web-game-developer. Wrap it in try/catch with a short timeout, don't block boot on it, and use HTTPS. Poki may also object to external calls, so consider removing it.

4. **[high] Poki SDK integration is incomplete and fragile.**
   - Evidence: `src/sdk.js:2-7`, `src/main.js:87-88`.
   - Impact:
     - `PokiSDK.init()` is awaited with no catch. An ad blocker or a failed script load leaves `PokiSDK` undefined, so boot throws and the game is dead.
     - There are no `gameLoadingFinished()`, `gameplayStart()` or `gameplayStop()` calls anywhere. Poki requires them.
     - Audio and input are not muted or paused during `commercialBreak()`.
     - The ad runs on a restart from game over, which is the right placement.
   - Route to: cl-core:cl-port (Poki adapter).

5. **[high] Music autoplay is unhandled.**
   - Evidence: `src/audio.js:6` and `src/main.js:92`. `startMusic()` runs at boot with no user gesture, and the `play()` promise rejection is not caught. `src/audio.js:12` has the same problem for sound effects.
   - Impact: browsers block the music until the player interacts, and there is no retry. Unhandled promise rejections appear in the console. There is no mute button or volume control.
   - Route to: web-game-developer. Start audio on the first keypress or click.

6. **[high] Page scroll, and key handling that breaks with Shift or Caps Lock.**
   - Evidence: `src/input.js:5-6`. There is no `preventDefault`, and keys are matched on `e.key` as lowercase `"w"`, `"a"` and `"d"` (`src/main.js:39-40`).
   - Impact: Space and the arrow keys scroll the page inside the Poki frame. With Caps Lock or Shift held, `e.key` is `"A"` or `"W"` and movement stops working. The README says WASD is supported, so this breaks a promised control. Holding Space on game over also auto-repeats and restarts instantly.
   - Route to: web-game-developer. Use `e.code` and call `preventDefault`.

7. **[high] No mobile or touch support, and no resize handling.**
   - Evidence: the canvas is fixed at 960×540 (`index.html:10`), and `src/input.js` is keyboard-only.
   - Impact: Poki expects mobile support. There is no touch input, no scaling to the iframe, and no DPR handling, so it will look blurry or crop on many screens.
   - Route to: cl-design:game-ui-ux-designer, then web-game-developer.

8. **[high] Unrequested external link and branding in the page.**
   - Evidence: `index.html:11` links "More games" to `lumengames.example.com`.
   - Impact: Poki rejects external links and promotion of other sites. It also shrinks the playable area.
   - Route to: remove it, or use cl-core:cl-port guidance.

9. **[medium] Frame-bound simulation and no pause on tab hide.**
   - Evidence: `src/main.js:36-55,81-85`. Movement runs per `requestAnimationFrame` callback with no delta time.
   - Impact: the game runs twice as fast on 120 or 144 Hz monitors, which distorts jump arcs and storm speeds. There is no `visibilitychange` handling, so it keeps running, and the music keeps playing, in a background tab.
   - Route to: web-game-architecture (fixed timestep).

10. **[medium] `console.log` on every frame.**
    - Evidence: `src/main.js:54`.
    - Impact: about 60 log lines per second, which hurts performance with the console open and clutters Poki's QA output.
    - Route to: delete the line.

11. **[medium] Save handling is fragile.**
    - Evidence: `src/save.js:4-9`.
    - Impact: `JSON.parse` is unguarded, so one corrupt value crashes boot. `localStorage` can throw in a sandboxed iframe or private mode. There is no schema version, and older saves missing `gems` would produce `NaN` at `src/main.js:60`. Poki recommends its own storage or a safe wrapper.
    - Route to: web-game-developer.

12. **[low] Hygiene.**
    - Audio objects are never preloaded, and rapid sound effects restart the same element (`src/audio.js:11`).
    - `package.json` has no build, lint or test scripts.
    - The README is thin.
    - The 412 KB spritesheet (`assets/sprites.png`) is listed in the manifest but never used. The game draws coloured rectangles (`src/main.js:65-74`), so it is either dead weight or unfinished art.

## What is healthy
- The code is small and readable, split cleanly into modules (`world.js`, `save.js`, `input.js` and so on).
- The Poki wrapper is isolated in `src/sdk.js`, so provider code stays out of gameplay logic.
- The collision and island logic is self-contained and testable (`src/world.js:15-17`).
- The ad is shown at a natural break, on restart from game over.
- Per-frame allocations are minimal, and there are no external runtime dependencies.

## Handoff
Changed: nothing (audit only).
Evidence: I read all 11 tracked files (`README.md`, `package.json`, `index.html`, `style.css`, `assets/manifest.json`, `src/*.js`) and ran `git ls-files`.
Verify: for #2, press Space to restart three times, then die once more. You should see multiple ad calls and multiple jump sounds per keypress. For #3, block the leaderboard host and the canvas stays blank.
Open: I did not run the game in a browser, so the runtime behaviour above comes from reading the code. I couldn't confirm that `assets/` contains the real binary files, because only `manifest.json` is tracked in git. I did not check Poki's current submission checklist online, so confirm the size limits and the rule on external links before you submit.
Next: fix #2 and #3 first, since either one can leave a reviewer staring at a broken or blank game. Then replace the WAV (#1).