# Audit: Skyhop
Stack: plain JavaScript (ES modules), HTML5 canvas 2D, no bundler, no `package.json` dependencies, no TypeScript. I skipped the TS and lockfile checks.
Build: there is no build step. The start script is `npx serve .`. I didn't run the game. Everything below comes from reading the code.

## Findings (ranked)

1. **[blocker] The 52 MB uncompressed WAV soundtrack.**
   - Evidence: `assets/manifest.json:3` lists `assets/music.wav` at 54,525,952 bytes. It is loaded at `src/audio.js:1`.
   - Impact: Poki has a small initial-download budget, and 52 MB is far over it. The page is also unplayable on mobile or slow connections. Convert to OGG or MP3 (about 2–3 MB) and lazy-load it.
   - Route to: `cl-web:web-harness` (audio and assets).

2. **[blocker] No Poki lifecycle calls.**
   - Evidence: `src/sdk.js:1-8` only wraps `init` and `commercialBreak`. Grep shows no `gameLoadingFinished`, `gameplayStart` or `gameplayStop` anywhere.
   - Impact: Poki requires these calls, and review rejects games that omit them. They go at the end of loading, on the first input of a run, and on game over or pause.
   - Route to: `cl-core:cl-port`.

3. **[blocker] SDK failure and ad blockers crash the game at boot.**
   - Evidence: `src/sdk.js:3` calls `PokiSDK.init()` with no guard. The script tag is at `index.html:7`. `boot()` at `src/main.js:87-94` awaits `initSdk()` first. Also, `init()` rejects when an ad blocker is active, which Poki's docs say to handle. Here that rejection is unhandled, so `loop()` never starts and the player gets a blank canvas.
   - Impact: players with ad blockers get a dead game. If the CDN script fails to load, `PokiSDK` is undefined and it throws.
   - Route to: `cl-core:cl-port`.

4. **[high] The leaderboard fetch blocks boot, and it's insecure and unreachable.**
   - Evidence: `src/net.js:1-5` fetches `http://scores.lumengames.example.com/...` with no `try/catch` and no `res.ok` check. `src/main.js:90` awaits it before `newRun()`.
   - Impact: the game never starts if the fetch fails, which will happen in the portal iframe because of mixed content (http inside https) and CORS. Poki also restricts external requests. Drop the call or make it non-blocking with a fallback.
   - Route to: `cl-web:web-game-developer`.

5. **[high] The footer links to an external site.**
   - Evidence: `index.html:11` has "Made by Lumen Games" and a "More games" link to `lumengames.example.com`.
   - Impact: Poki forbids outbound links and branding that push players off the portal. Remove it.
   - Route to: `cl-core:cl-port`.

6. **[high] Audio is not safe for autoplay or the ad flow.**
   - Evidence: `src/audio.js:6` calls `music.play()` from `boot()` (`src/main.js:92`) with no user gesture, so the browser blocks it and the returned promise is never caught. `play()` at `src/audio.js:9-13` also ignores rejections. Nothing mutes the sound during `commercialBreak`.
   - Impact: there's no music on first load, and the console fills with unhandled rejections. Poki requires audio to be muted during ads.
   - Route to: `cl-web:web-harness`.

7. **[high] `bindKeys` is called on every restart.**
   - Evidence: `newRun()` at `src/main.js:23` calls `bindKeys(jump)`, and `newRun` runs on every restart (`src/main.js:33`). Each call adds another pair of `window` listeners at `src/input.js:4,8`.
   - Impact: after N restarts, one keypress calls `jump()` N times. The first press after game over triggers several `restart()` calls, each of which shows an ad. This also leaks listeners. Bind once in `boot()`.
   - Route to: `cl-web:web-game-developer`.

8. **[high] Restart can run twice, and the ad can break input.**
   - Evidence: `restart()` at `src/main.js:31-34` awaits `showAd()` with no re-entrancy guard, and `state.over` stays true during the ad. A second Space press starts a second `restart()` and a second ad. `showAd()` at `src/sdk.js:6-8` also has no error handling.
   - Impact: players see double ads, and a rejected `commercialBreak` leaves the game stuck on the game-over screen.
   - Route to: `cl-web:web-game-developer`.

9. **[high] There is no touch or mobile support.**
   - Evidence: `src/input.js` only handles `keydown` and `keyup`. The canvas is fixed at 960×540 (`index.html:10`) with no scaling.
   - Impact: Poki traffic is heavily mobile, and the game can't be played there. The canvas also doesn't fit smaller or iframe viewports. Add pointer controls and a resize/scale path.
   - Route to: `cl-web:web-game-developer`.

10. **[medium] There is a per-frame `console.log`.**
    - Evidence: `src/main.js:54` logs `"frame", p.x, p.y, state.score` on every update.
    - Impact: about 60 log lines per second, which slows the game and fills the console. Remove it.
    - Route to: `cl-web:web-game-developer`.

11. **[medium] The game loop is frame-bound and doesn't pause.**
    - Evidence: `loop()` at `src/main.js:81-85` runs one `update()` per animation frame, with gravity (`0.5`) and speeds (`4`) fixed per frame. No `visibilitychange` or `blur` handler exists.
    - Impact: the game runs about 2× faster on 120/144 Hz displays, which changes difficulty. It also keeps running, and the music keeps playing, in background tabs. Use a fixed timestep and pause on hide.
    - Route to: `cl-web:web-game-developer`.

12. **[medium] Save handling is fragile and unversioned.**
    - Evidence: `src/save.js:4-5` calls `JSON.parse` with no try/catch. The save has no schema version. `localStorage` is used directly, and it can throw in sandboxed or third-party iframes. `save(data)` at `src/main.js:61` has the same exposure.
    - Impact: a corrupted or blocked save throws at boot, so the game never starts. Wrap both calls in try/catch with an in-memory fallback, and add a version field.
    - Route to: `cl-web:web-game-developer`.

13. **[medium] Input handling has bugs.**
    - Evidence: keys are stored by `e.key` (`src/input.js:5`), but `src/main.js:39-40` checks lowercase `a` and `d`. With Caps Lock or Shift held, the key is `A` or `D` and the check misses it. The jump check at `src/input.js:6` only matches `w`, not `W`. Keys also stay stuck when focus is lost, because there is no `blur` reset. Space and the arrow keys are not `preventDefault`ed, so the portal page scrolls.
    - Impact: controls feel broken for some players, and the page scrolls inside the Poki frame.
    - Route to: `cl-web:web-game-developer`.

14. **[medium] The first-frame state is unsafe, and the unused spritesheet is a download cost.**
    - Evidence: `draw()` and `jump()` use `state` and `data`. Key events can fire before `newRun()` finishes, because the leaderboard await (`src/main.js:90`) comes first. The input is only bound inside `newRun`, so this is mostly latent. Separately, `assets/sprites.png` (412 KB, `assets/manifest.json:6`) is never loaded. All drawing uses `fillRect`.
    - Impact: an unused 412 KB ships with the build, and the ordering is easy to break. Remove the file, or use it.
    - Route to: `cl-web:web-game-developer`.

15. **[low] Hygiene.**
    - The README has no build or package script, and `package.json` has no `build`, lint or test script.
    - The page `<title>` and the HTML have no viewport meta tag (`index.html:3-8`) and no `lang` attribute on `<html>` (`index.html:2`).
    - There's no focus or click-to-start screen.
    - The game-over text is a hardcoded `380, 270` position (`src/main.js:78`). Overlaps and sizes are hardcoded to 960×540, including `src/main.js:50,53`.
    - Route to: `cl-web:web-harness`.

## What is healthy
- The code is small and readable: 8 modules, about 150 lines, with a clear split between world, input, audio, save and the SDK wrapper (`src/sdk.js`).
- The Poki calls are isolated in `src/sdk.js`, so the portal adapter is easy to fix in one place.
- It has no dependencies and no build, so there's no supply-chain or build risk.
- Collision, with the one-way island landing check (`src/main.js:45`), and the overlap helper (`src/world.js:15-17`) are simple and correct.

## Handoff
Changed: nothing (audit only)
Evidence: read every tracked file (`README.md`, `package.json`, `index.html`, `style.css`, `assets/manifest.json`, `src/*.js`). I ran no build, no game and no scripts.
Verify: for #1, check the sizes in `assets/manifest.json`, or run `ls -l assets/`. The `.wav` files aren't tracked in git, so the manifest is the only evidence of their size. For #3, block `poki-sdk.js` in DevTools and load the page, and it stays blank. For #7, restart three times and press Space once. You should see multiple ad calls.
Open: I did not check Poki's current size and policy limits against their live documentation, so the exact thresholds in #1, #2 and #5 are from my knowledge of their requirements and should be confirmed. I could not run the game in a browser, so frame-rate and mobile behavior are from reading the code. The audio, sprite and manifest files are not in the repo, so their real sizes and licensing are unverified.
Next: fix the blockers first: compress the music (#1), add the Poki lifecycle calls (#2), and make boot survive SDK and network failure (#3 and #4). Then bind input once (#7), because it also multiplies the ad calls.