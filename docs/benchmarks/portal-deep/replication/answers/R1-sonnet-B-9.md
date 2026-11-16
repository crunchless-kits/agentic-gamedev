# Audit: Skyhop (v0.9.0)

**Stack:** plain JavaScript (ES modules) with Canvas 2D. There is no bundler, no TypeScript and no dependencies, so I skipped the TypeScript and lockfile checks. `package.json` only has `npx serve .`.
**Build:** there is no build step. I did not run the game, so everything below comes from reading the code. The audit changed no files.

## Findings (ranked)

1. **[blocker] The game never starts if the Poki SDK fails to load or init.**
   - Evidence: `src/main.js:88` awaits `initSdk()`, and `src/sdk.js:3` calls `PokiSDK.init()` with no catch. The script tag is at `index.html:7`.
   - Impact: with an adblocker, a network failure or a local run, `PokiSDK` is undefined or the promise rejects. `boot()` dies and the player sees a blank canvas. Poki's integration expects the game to keep running when the SDK is blocked.
   - Fix: wrap init in try/catch and continue, and guard `showAd` the same way.

2. **[blocker] The leaderboard fetch can also stop boot.**
   - Evidence: `src/main.js:90` awaits `fetchTopScores()`. `src/net.js:1` uses a plain `http://` URL on a placeholder `.example.com` host, and `src/net.js:4-5` has no error handling and doesn't check `res.ok`.
   - Impact: the request is mixed content on an HTTPS portal and will be blocked. The rejection kills `boot()`, so the game never starts. Poki also restricts calls to outside servers.
   - Fix: drop it or make it optional, and never put it on the critical path.

3. **[blocker] The 52 MB uncompressed music file.**
   - Evidence: `assets/manifest.json:3` lists `assets/music.wav` at 54,525,952 bytes. `src/audio.js:1` loads it directly.
   - Impact: it is far over Poki's initial-load and total size guidance. On mobile or slow connections the game stalls or fails.
   - Fix: re-encode to OGG/MP3 at roughly 1–3 MB and lazy-load it.
   - Also: `jump.wav` and `gem.wav` could be compressed too (`manifest.json:4-5`).

4. **[high] Missing Poki lifecycle calls.**
   - Evidence: `src/sdk.js` only wraps `init` and `commercialBreak`. A search for `gameplayStart`, `gameplayStop` and `gameLoadingFinished` finds nothing anywhere in `src/`.
   - Impact: Poki requires these for ad timing and analytics, and review can reject without them.
   - Fix: call `gameLoadingFinished` after load, `gameplayStart` on a run start and `gameplayStop` in `gameOver` (`src/main.js:57`) and before the ad.

5. **[high] Input handlers are re-bound on every run, so restarts multiply.**
   - Evidence: `bindKeys(jump)` is called inside `newRun()` (`src/main.js:23`), and each call adds new listeners (`src/input.js:4,8`). `restart()` also stays in `state.over` during the `await showAd()` (`src/main.js:27,32`).
   - Impact: after N restarts, one keypress fires `jump` N times. Several `restart()` calls can overlap, so several ads are requested and several new runs start. Holding space on the game-over screen already causes this on the first restart through key repeat.
   - Fix: bind once at boot and add a `restarting` guard.

6. **[high] Audio starts without a user gesture and has no mute during ads.**
   - Evidence: `startMusic()` runs in `boot()` (`src/main.js:92`), and `music.play()` has no catch (`src/audio.js:6`).
   - Impact: browsers reject autoplay, which gives an unhandled promise rejection and no music. `play()` in `src/audio.js:12` has the same problem. Poki also requires audio muted during ads, and nothing mutes it around `showAd`.
   - Fix: start music on the first key press and mute around ads.

7. **[high] The ad is a pre-roll-style break on every restart, with no pause or visibility handling.**
   - Evidence: `src/main.js:32` calls `showAd()` and nothing else. There is no `visibilitychange` or blur handler anywhere.
   - Impact: the game keeps running when the tab is hidden, and `requestAnimationFrame` pauses unevenly. Input is not blocked during the ad.
   - Fix: pause on hidden or blur, and ignore input while an ad is showing.

8. **[medium] An outbound branded link and footer.**
   - Evidence: `index.html:11` has "Made by Lumen Games" and a "More games" link to `lumengames.example.com`.
   - Impact: Poki prohibits external links and promotion of other sites, and review will flag it.
   - Fix: remove it.

9. **[medium] A `console.log` on every frame.**
   - Evidence: `src/main.js:54`.
   - Impact: roughly 60 log calls per second. This hurts performance, especially with devtools open, and spams the console.
   - Fix: remove it.

10. **[medium] The save has no error handling or schema version.**
    - Evidence: `src/save.js:5` calls `JSON.parse` with no try/catch, and `src/save.js:9` does `setItem` with no try/catch. The saved object has no version field.
    - Impact: corrupt data or blocked storage (an embedded iframe with storage disabled) throws during boot. Storage failures also throw inside `gameOver`.
    - Fix: guard both calls with try/catch and add `v: 1` to the saved object.

11. **[medium] `gameOver` can run more than once per frame.**
    - Evidence: `src/main.js:51` and `src/main.js:53` are inside `update()`, which doesn't return after the first call.
    - Impact: if the player hits a storm and falls in the same frame, or two storms overlap, `data.gems += …` (`src/main.js:60`) is double-counted.
    - Fix: return after the first `gameOver`.

12. **[medium] Frame-bound movement and a fixed 960×540 canvas.**
    - Evidence: `src/main.js:39-42` uses per-frame constants with no delta time. `index.html:10` has a fixed size, and `style.css:2` does no scaling.
    - Impact: the game runs about 2× fast on 120/144 Hz displays. It won't fit small screens or iframes of other sizes, and there is no touch input at all (`src/input.js` is keyboard only). Poki lists mobile as a major audience.
    - Fix: use a fixed-timestep loop, scale the canvas to the container, and add touch controls.

13. **[low] Key handling gaps.**
    - Evidence: `src/input.js:6` and `src/main.js:39-40` match lowercase `"w"`, `"a"` and `"d"` only. Caps Lock breaks them.
    - Impact: arrow and space keys are not `preventDefault`ed, so the embedded page can scroll. The game also never clears `keys` on blur, so keys can stick.
    - Fix: use `e.code` and call `preventDefault`.

14. **[low] Hygiene.**
    - Evidence: `package.json:6` has no real build, lint or test script, and there is no `.gitignore` or lockfile. The assets are placeholder rectangles (`src/main.js:68-74`) and `sprites.png` (`assets/manifest.json:6`) isn't used anywhere in the code. A `README.md` claims the SDK is "already in index.html", but the integration is incomplete.
    - Fix: either use `sprites.png` or drop it, and add a build script.

## What is healthy
- The Poki SDK sits behind `src/sdk.js`, and the gameplay code doesn't import it directly (`src/main.js:1` only uses the wrapper). Fixing the SDK guards is a one-file change.
- The module split is clean (`world.js`, `input.js`, `save.js`, `audio.js`).
- Collision and world generation are simple and pure (`src/world.js`).

## Handoff
**Changed:** nothing (audit only).
**Evidence:** I read every tracked file (`README.md`, `package.json`, `index.html`, `style.css`, `assets/manifest.json` and all of `src/*.js`).
**Verify:** to reproduce #1, block `game-cdn.poki.com` in devtools and reload. You get a blank canvas and a console error. To reproduce #5, die and restart three times, then press space once. You'll see several `jump` and ad calls.
**Open:** I did not run the game in a browser, build a bundle or measure real load time. The asset sizes come from `manifest.json`, not from files on disk. The `assets/` folder holds only the manifest, so the audio and sprite files themselves are missing from the repo. The game would 404 on every asset, which is another reason the audio and sprite loads need checking.
**Next:** fix #1–#3 first, since together they are the difference between a game that loads and one that doesn't. Then add the lifecycle calls (#4) and the input and restart fix (#5).