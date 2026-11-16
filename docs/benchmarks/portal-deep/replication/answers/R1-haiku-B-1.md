# Audit: Skyhop (v0.9.0)

**Stack:** Plain JavaScript ES modules, no bundler, no npm dependencies, no TypeScript (no `tsconfig.json`, so the TS checks don't apply). Poki SDK loaded from CDN (`index.html:7`).
**Build:** No build step. `npm start` runs `npx serve .`. I did not run it or open it in a browser, so runtime behavior below is from reading the code. The Poki SDK behaviors cited in findings 4 and 5 are from my knowledge of the SDK, not checked against current Poki docs. Confirm them before submitting.

## Findings (ranked)

1. **[blocker] Placeholder and HTTP leaderboard URL; boot fails if the fetch fails.**
   Evidence: `src/net.js:1` uses `http://scores.lumengames.example.com/...` (an `example.com` placeholder over plain HTTP). `src/net.js:4-5` has no try/catch or timeout. `src/main.js:90` awaits it inside `boot()`, so a failed fetch means `newRun()` and `loop()` never run.
   Impact: Poki serves over HTTPS, so the browser blocks this mixed-content request. Players get a black canvas.
   Route to: web-game-developer (replace the URL with the real HTTPS endpoint, add a timeout, and fall back to an empty leaderboard).

2. **[blocker] No touch or pointer input.**
   Evidence: `src/input.js:3-10` binds only `keydown`/`keyup`. Nothing in `src/main.js` handles touch. `src/main.js:78` says "Press space" to restart.
   Impact: Poki's audience is largely mobile. On a phone the game cannot be played or restarted.
   Route to: web-game-developer (on-screen or tap-to-jump controls, tap to restart). Confirm whether Poki's submission requirements mean you must support mobile.

3. **[high] 54.5 MB uncompressed music track.**
   Evidence: `assets/manifest.json:3` (`music.wav`, 54,525,952 bytes, "full soundtrack, uncompressed"). Loaded at module import in `src/audio.js:1` with the default preload, so it downloads immediately.
   Impact: very long first load, especially on mobile. Likely over Poki's size guidance (check the current limit).
   Route to: web-harness (convert to OGG/MP3 and lazy-load or stream).

4. **[high] Poki SDK integration is incomplete.**
   Evidence: `src/main.js:91-93` never calls gameplay start/stop. `src/sdk.js:6-7` calls `commercialBreak()` with no audio muting or game pause. `src/main.js:31-34` runs the ad while the loop keeps drawing and music keeps playing.
   Impact: Poki's integration requirements call for gameplay start/stop events and muted audio during ad breaks. Reviewers commonly reject submissions that miss these.
   Route to: cl-core:cl-port (Poki adapter).

5. **[high] SDK global missing crashes boot.**
   Evidence: `src/sdk.js:3` calls `PokiSDK.init()` with no existence check. `src/main.js:88` awaits it first, so if the SDK script is blocked or fails to load, the game never starts.
   Impact: a dead canvas for any player whose network or ad blocker blocks the CDN.
   Route to: cl-core:cl-port.

6. **[high] Duplicate key listeners on every restart.**
   Evidence: `src/main.js:23` calls `bindKeys(jump)` inside `newRun()`, and `newRun()` runs again after every restart (`src/main.js:33`). `src/input.js:4-7` adds a new `keydown` listener each time.
   Impact: after a few runs, one space press calls `jump()` several times, and a game-over press can call `restart()` several times, each triggering `showAd()` (`src/main.js:27`, `src/main.js:32`). This means extra ad calls.
   Route to: web-game-developer (bind input once in `boot()`).

7. **[high] No pause on tab hide or blur.**
   Evidence: `src/main.js:84` runs `requestAnimationFrame` unconditionally. There is no `visibilitychange` or `blur` handler anywhere in `src/`.
   Impact: the game keeps running and music keeps playing in a background tab, and a player who switches tabs can lose a run.
   Route to: web-game-developer.

8. **[high] Music autoplay promise is unhandled.**
   Evidence: `src/audio.js:6` calls `music.play()` without handling the returned promise. `src/main.js:92` calls it at boot, before any user gesture.
   Impact: browsers block autoplay until the user interacts, so the rejection is unhandled and the soundtrack may never start. Start music on the first input instead.
   Route to: web-game-developer.

9. **[high] Frame-bound physics.**
   Evidence: `src/main.js:41-42` applies gravity and velocity per frame with no delta time. `src/main.js:84` drives the update from `requestAnimationFrame`.
   Impact: the game runs about twice as fast on 120 Hz displays as on 60 Hz, and speed varies with frame drops.
   Route to: web-game-architecture (fixed-step loop).

10. **[medium] Per-frame `console.log`.**
    Evidence: `src/main.js:54` logs every frame (about 60 lines per second).
    Impact: slows the game and floods the console. Remove it before submission.
    Route to: web-game-developer.

11. **[medium] Gems and game-over counted more than once.**
    Evidence: `src/main.js:51` calls `gameOver()` inside the storm loop with no break. `src/main.js:57-62` then adds to `data.gems` (`src/main.js:60`) each time.
    Impact: if the player touches two storms in the same frame, `data.gems` is inflated and `save()` runs twice.
    Route to: web-game-developer (guard with `if (state.over) return` or break).

12. **[medium] Unguarded save parsing and storage access.**
    Evidence: `src/save.js:4` reads `localStorage` without a try/catch (it throws in some sandboxed iframes). `src/save.js:5` calls `JSON.parse` with no try/catch. `src/main.js:89` calls `load()` during boot.
    Impact: a corrupted or inaccessible save crashes boot, so the game never starts.
    Route to: release-hub (save-system check).

13. **[medium] Fixed 960×540 canvas with no scaling.**
    Evidence: `index.html:10` sets the canvas to 960×540. `style.css:2` centers it with no scaling rules.
    Impact: on a phone the canvas is cut off or unreadably small.
    Route to: game-ui-ux-designer (responsive layout).

14. **[medium] Player not clamped to the screen.**
    Evidence: `src/main.js:39-40` changes `p.x` with no bounds check.
    Impact: the player can walk off either side and is never recovered.
    Route to: web-game-developer.

15. **[medium] External promotional link and placeholder domain in the footer.**
    Evidence: `index.html:11` links to `https://lumengames.example.com/more` with `target="_blank"`.
    Impact: `example.com` is a placeholder and will not resolve. Poki reviewers also tend to flag external promotional links. Replace or remove.
    Route to: cl-platforms:platforms-hub (Poki submission checklist).

16. **[low] Unused sprite asset and eager audio loading.**
    Evidence: `assets/manifest.json:6` lists `sprites.png` (412 KB), but no code references it (`src/main.js` draws only rectangles). `src/audio.js:1-3` creates all audio elements at import.
    Impact: wasted download. Remove the sprite or use it.
    Route to: web-harness.

17. **[low] Unhandled promise in `play()`.**
    Evidence: `src/audio.js:12` does not handle the promise from `s.play()`.
    Impact: sound-effect failures surface as unhandled rejections.
    Route to: web-game-developer.

18. **[low] Case-sensitive key handling.**
    Evidence: `src/input.js:6` checks `"w"` only, and `src/main.js:39-40` checks `keys.a`/`keys.d` only.
    Impact: with Caps Lock on, WASD and jump on `W` do not work.
    Route to: web-game-developer.

## What is healthy

- The Poki SDK script tag is already in place (`index.html:7`), so the integration starts from a known point.
- The code is small and readable. Modules are separated cleanly (`audio`, `input`, `save`, `world`, `sdk`).
- Collision (`src/world.js:15-17`) and the save schema (`src/save.js`) are simple and easy to reason about.
- No dependencies to audit, so there is no supply-chain surface.

## Handoff

- **Changed:** nothing (audit only).
- **Evidence:** read every file in the repo (`README.md`, `package.json`, `index.html`, `style.css`, `assets/manifest.json`, all of `src/*.js`). Did not run `scripts/ts_health.mjs` because the project has no TypeScript and no build. Did not run the game in a browser.
- **Verify:** load the game over HTTPS with the leaderboard unreachable, and the canvas stays black (finding 1). Open the console and see a `console.log` line every frame (finding 10). Switch tabs and hear the music keep playing (finding 7).
- **Open:** Poki's current size limits and SDK requirements (finding 4 depends on them); the real leaderboard endpoint; whether the game must support mobile for this submission.
- **Next:** fix finding 1 (placeholder HTTP URL and boot failure) and confirm the real endpoint. It is the one thing that stops the game from running at all.