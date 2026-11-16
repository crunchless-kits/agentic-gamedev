# Audit: Skyhop (pre-Poki submission)

**Stack:** Plain JavaScript (ES modules, no framework, no bundler, no TypeScript, no dependencies). `package.json` has only a `start` script (`npx serve .`). Strict: n/a.
**Build:** No build step exists. The game runs as-is, so there is nothing to compile. I did not run it in a browser, so runtime behavior below comes from reading the code.

## Findings (ranked)

1. **[blocker] 54 MB uncompressed music track.** `music.wav` is 54,525,952 bytes, marked "full soundtrack, uncompressed." Poki portal builds have to load quickly, so this will hurt first load badly or fail it outright.
   - Evidence: `assets/manifest.json:3`, `src/audio.js:1`
   - Impact: Long or failed load on the first session, before the player reaches the game.
   - Route to: `cl-web:web-harness` (asset compression, switch to OGG/MP3).

2. **[blocker] Placeholder and insecure leaderboard URL, with no error handling.** The URL is an `http://` `.example.com` placeholder. On an HTTPS portal the browser blocks it as mixed content. `boot()` awaits it with no `try`/`catch`, so a failed fetch stops boot before `newRun()` and the game never starts.
   - Evidence: `src/net.js:1`, `src/net.js:4-5`, `src/main.js:90`
   - Impact: Blank or dead game on Poki if the leaderboard is unreachable, which it will be as written.
   - Route to: `cl-web:web-game-developer` (HTTPS endpoint, catch and fall back to empty scores).

3. **[blocker] No touch input and no responsive layout.** Controls are keyboard-only. The `<head>` has no viewport meta tag, and the canvas is a fixed 960×540 with no scaling CSS. Most Poki traffic is mobile, so most players cannot play.
   - Evidence: `src/input.js:3-10` (keyboard only), `index.html:3-8` (no `<meta name="viewport">`), `index.html:10` and `style.css:2` (fixed canvas, no scaling)
   - Impact: Mobile players cannot play, and on phones the canvas renders at the wrong scale.
   - Route to: `cl-design:game-ui-ux-designer` for the touch scheme, then `cl-web:web-game-developer` for the implementation.

4. **[high] Poki SDK integration is incomplete and unguarded.** The game never calls `gameLoadingFinished`, `gameplayStart`, or `gameplayStop`. `PokiSDK.init()` is not guarded, so if the SDK script is blocked (common with ad blockers), `boot()` throws and the game does not start.
   - Evidence: `src/sdk.js:2-4`, `src/main.js:87-94`, `index.html:7`
   - Impact: Poki may reject or delay the build, ads may not fill, and blocked SDK loads kill the game.
   - Route to: `cl-platforms:platforms-hub` (Poki adapter) or `cl-core:cl-port`.

5. **[high] Repeated key listeners and repeated ad calls.** `newRun()` calls `bindKeys()` every time, so each restart adds another `keydown` listener. After a few restarts one keypress fires `jump()` several times. While the game is over, each `jump()` calls `restart()`, which calls `showAd()`, so one press can trigger several commercial breaks.
   - Evidence: `src/main.js:23`, `src/main.js:27`, `src/main.js:31-34`, `src/input.js:3-10`
   - Impact: Players see stacked ad requests, and the ad flow looks broken, which is a Poki review risk.
   - Route to: `cl-web:web-game-developer` (bind input once in `boot`, guard `restart` with an "ad in progress" flag).

6. **[high] Music and sound keep playing during commercial breaks.** No mute or pause is wired to the ad lifecycle, and the loop is not paused.
   - Evidence: `src/main.js:31-34`, `src/audio.js:5-7`
   - Impact: Poki requires audio to be muted or paused during ads.
   - Route to: `cl-web:web-game-developer`, paired with the SDK work in finding 4.

7. **[high] Off-site "More games" link in the footer.** It points to an external `.example.com` domain (also a placeholder) and opens in a new tab.
   - Evidence: `index.html:11`
   - Impact: Poki's submission rules generally restrict external links from games. Confirm against the current Poki guidelines, but expect this to be flagged in review.
   - Route to: `cl-platforms:platforms-hub` (review checklist) and remove or replace the link.

8. **[medium] Gems double-counted when game-over fires twice in one frame.** `update()` has no `return` after `gameOver()`, so a storm hit and a fall-off in the same frame both call it. Each call adds the taken gems to `data.gems`.
   - Evidence: `src/main.js:47-53`, `src/main.js:57-62`
   - Impact: Persistent gem totals inflate, and the save gets written twice.
   - Route to: `cl-web:web-game-developer` (return after game-over, or guard it with `state.over`).

9. **[medium] Physics is frame-bound, not fixed-step.** Speed and jump height scale with the display refresh rate, so 120 Hz and 144 Hz monitors play differently than 60 Hz.
   - Evidence: `src/main.js:36-55`, `src/main.js:81-85`
   - Impact: Inconsistent difficulty and feel across devices.
   - Route to: `cl-web:web-game-architecture` (fixed timestep).

10. **[medium] Per-frame `console.log`.** This writes about 60 lines per second to the console.
    - Evidence: `src/main.js:54`
    - Impact: Console noise and avoidable per-frame cost. Remove before submission.
    - Route to: `cl-web:web-game-developer` (one-line removal).

11. **[medium] Autoplay and unhandled promise rejections.** `startMusic()` runs at boot without a user gesture, so browsers block it. `music.play()` and `s.play()` return promises that are never caught.
    - Evidence: `src/main.js:92`, `src/audio.js:6`, `src/audio.js:12`
    - Impact: Music may not start, and console errors appear on every jump.
    - Route to: `cl-web:web-game-developer` (start audio on the first input, catch the promise).

12. **[medium] Keys stick after focus loss, and there is no pause on tab hide.** There is no `blur` or `visibilitychange` handler, so a held key stays down after alt-tab. The loop keeps running in the background.
    - Evidence: `src/input.js:8-10`, `src/main.js:81-85`
    - Impact: The player keeps moving after switching windows, and the game runs unpaused in the background.
    - Route to: `cl-web:web-game-developer`.

13. **[medium] Save load is unguarded and unversioned.** `JSON.parse` on corrupt `localStorage` throws, which stops boot. The save has no schema version.
    - Evidence: `src/save.js:4-5`, `src/save.js:8-9`
    - Impact: One corrupt value blocks the game for that player. Future schema changes will break old saves.
    - Route to: `cl-release:release-hub` (save-system checks).

14. **[medium] Leaderboard response is trusted without validation.** `topScores[0]?.score` assumes an array of objects. A different response shape crashes `draw()` every frame.
    - Evidence: `src/main.js:77`, `src/net.js:5`
    - Impact: Crash loop from one bad response.
    - Route to: `cl-web:web-game-developer` (validate shape, default to empty).

15. **[low] Arrow and space keys scroll the page.** No `preventDefault` is called.
    - Evidence: `src/input.js:6`
    - Impact: Page jumps on space or arrow keys. Minor, but visible.
    - Route to: `cl-web:web-game-developer`.

16. **[low] Unused asset.** `sprites.png` (412 KB) is listed in the manifest and never referenced by any source file. The game draws with `fillRect` only.
    - Evidence: `assets/manifest.json:6`; no reference in `src/`
    - Impact: Wasted download.
    - Route to: `cl-web:web-harness` (asset audit).

17. **[low] Case-sensitive key handling.** Only lowercase `w`, `a`, and `d` are matched, so Caps Lock or Shift breaks WASD.
    - Evidence: `src/input.js:6`, `src/main.js:39-40`
    - Impact: WASD stops responding with Caps Lock on.
    - Route to: `cl-web:web-game-developer` (compare `e.key.toLowerCase()`).

## What is healthy

- The game logic is small and easy to follow. The loop, world generation, and collision (`src/world.js`, `src/main.js:36-55`) are clear.
- Assets are sized sensibly apart from the music track: `jump.wav` is 88 KB, `gem.wav` is 62 KB, and `sprites.png` is 412 KB (`assets/manifest.json`).
- Drawing uses plain canvas `fillRect` with no per-frame allocations in the draw path (`src/main.js:64-79`).
- Save and SDK code is isolated into their own modules (`src/save.js`, `src/sdk.js`), which makes the fixes contained.

## Handoff

**Changed:** Nothing (audit only).
**Evidence:** Read `README.md`, `package.json`, `index.html`, `style.css`, `assets/manifest.json`, and all of `src/*.js`. Ran no commands and no browser.
**Verify:** Open the built game on a phone-sized viewport to confirm findings 3 and 5 (touch absence, duplicate ad calls). Check the Network tab for the `http://` leaderboard request (finding 2). Check the file size of `music.wav` (finding 1).
**Open:** I did not run the game, so runtime findings (5, 9, 11, 12) are inferred from the code. I did not check the current Poki submission guidelines, so findings 4 and 7 need confirmation against the live rules.
**Next:** Replace the 54 MB WAV with a compressed OGG/MP3 and fix the leaderboard URL. These two are blockers and are quick to fix.