# Audit: Skyhop
Stack: plain JavaScript (ES modules), HTML5 canvas 2D, no bundler, no TypeScript, no lockfile. I skipped the TS checks.
Build: there is no build step (`package.json:6` only runs `npx serve .`). I didn't run the game or a browser, so everything below comes from reading the code.

## Findings (ranked)

1. [blocker] The 54.5 MB uncompressed WAV soundtrack is loaded at boot.
   Evidence: `assets/manifest.json:3` (54,525,952 bytes, "uncompressed"), `src/audio.js:1`. The file is not in the repo (git tracks only `manifest.json`), so a fresh checkout has no audio.
   Impact: the game is about 55 MB against Poki's small-initial-download expectations, which is far over. Mobile and slow connections will stall or fail. Transcode to OGG/MP3 or AAC at about 1–3 MB, and make sure the assets are committed.
   Route to: `cl-platforms:publishing-liveops-engineer` (`cl-port` skill) with `cl-release:game-performance-engineer`.

2. [blocker] The Poki SDK lifecycle is missing, and a blocked SDK crashes the game.
   Evidence: `src/sdk.js:1-8` never calls `PokiSDK.gameLoadingFinished()`, `gameplayStart()` or `gameplayStop()`. `src/sdk.js:3` calls `PokiSDK.init()` with no guard and no `.catch`. `src/main.js:88` awaits it first in `boot()`.
   Impact: Poki's review requires the gameplay events, and ad pacing and metrics depend on them. If an ad blocker stops `poki-sdk.js` loading, `PokiSDK` is undefined, `boot()` throws, and the player gets a blank canvas. The documented pattern is to `init().then(start).catch(start)`.
   Route to: `cl-core:cl-port` (Poki).

3. [blocker] The leaderboard fetch can hang boot or kill it, and it is an insecure call to an external host.
   Evidence: `src/net.js:1` uses `http://scores.lumengames.example.com/...` (a placeholder domain, and plain HTTP). `src/net.js:3-5` has no try/catch, no `res.ok` check and no timeout. `src/main.js:90` awaits it before `newRun()`/`loop()`.
   Impact: Poki serves over HTTPS, so mixed content blocks the request. The fetch rejects, `boot()` throws, and the game never starts. Poki also restricts external network calls from hosted games. Make the fetch non-blocking and failure-tolerant, or remove it.
   Route to: `cl-web:web-game-developer`.

4. [high] Restart handling is broken: key listeners pile up and one key press can trigger several ads.
   Evidence: `src/main.js:23` calls `bindKeys(jump)` inside `newRun()`, so each restart adds another pair of window listeners (`src/input.js:4,8`). `src/main.js:27-33`: while `restart()` awaits `showAd()`, `state.over` is still true. Each extra space press, or each duplicate listener, calls `restart()` again.
   Impact: after N restarts, every jump fires N times, and the game-over screen can queue several `commercialBreak()` calls and `newRun()` calls. Poki flags ad spam. Bind the keys once in `boot()`, and add an `isRestarting` guard.
   Route to: `cl-web:web-game-developer`.

5. [high] The game speed depends on the monitor refresh rate.
   Evidence: `src/main.js:81-85` runs `update()` once per `requestAnimationFrame`, and the update uses fixed per-frame steps (`main.js:39-42`, speed 4, gravity 0.5).
   Impact: a 144 Hz display runs the game 2.4× faster than 60 Hz, which is the same difficulty bug as a different game. Use a fixed-timestep accumulator.
   Route to: `cl-web:web-game-architecture`.

6. [high] There is no pause when the tab is hidden or during ads, and audio and input are not muted during ads.
   Evidence: no `visibilitychange` or `blur` handler anywhere in `src/`. `src/main.js:32` awaits the ad while the loop keeps running, and the music keeps playing (`audio.js`).
   Impact: the player can die during an ad break, and music plays over ad audio. Poki requires muting and halting gameplay during ads. Stuck keys also persist after a blur, because `keys` is only cleared on `keyup` (`input.js:8-10`).
   Route to: `cl-web:web-game-developer`.

7. [high] There is no mobile or touch support, and the canvas doesn't scale.
   Evidence: `index.html:10` has a fixed `960×540` canvas and no viewport meta tag. `style.css:2` has no scaling rule. `src/input.js` handles keyboard only.
   Impact: Poki is more than half mobile traffic. On a phone the game is unplayable and cropped, and the player can't start or restart it. It also has no DPR handling, so it will look blurry on high-DPI screens.
   Route to: `cl-design:game-ui-ux-designer` with `cl-web:web-game-developer`.

8. [high] Music is autoplayed before any user gesture and play promises are unhandled.
   Evidence: `src/main.js:92` → `src/audio.js:6` `music.play()` runs straight after boot. `src/audio.js:12` `s.play()` has no `.catch`.
   Impact: browsers block it, so the player gets no music, and a rejected promise appears in the console. Start the music on the first key press or tap. Sound effects reuse one `Audio` element (`audio.js:11`), so rapid gems cut each other off.
   Route to: `cl-web:web-game-developer`.

9. [medium] The external "More games" link breaks Poki's rules.
   Evidence: `index.html:11` (`lumengames.example.com/more`, `target="_blank"`).
   Impact: Poki disallows outbound links and cross-promotion of other sites, which is a likely review rejection. Remove the footer link, or the whole footer.
   Route to: `cl-core:cl-port`.

10. [medium] The save code is fragile and has no version.
    Evidence: `src/save.js:5` has an unguarded `JSON.parse` and `localStorage` access. `save.js:9` has no try/catch.
    Impact: corrupt data or blocked storage (iframes with third-party storage restrictions, private mode) throws in `boot()` at `main.js:89`, so the game fails to start. There is no schema version for future updates. Wrap it in try/catch with a default, add a `v` field, and consider the SDK's storage.
    Route to: `cl-release:release-hub` (save checks).

11. [medium] Input handling has several gaps.
    Evidence: `src/input.js:5-6` compares `e.key` case-sensitively, so with Caps Lock or Shift `"W"` and `"A"` fail (`main.js:39-40` also uses lowercase `a`/`d`). There is no `preventDefault`, so space and the arrow keys scroll the host page inside Poki's iframe. `ArrowUp`/`w` jump but `README.md:3` doesn't say so.
    Impact: input becomes unresponsive for some players, and the page scrolls during play. Use `e.code` and call `preventDefault`.
    Route to: `cl-web:web-game-developer`.

12. [medium] A per-frame `console.log` runs while playing.
    Evidence: `src/main.js:54`.
    Impact: about 60 log lines per second slows the game with DevTools open and spams the Poki QA console.
    Route to: `cl-web:web-game-developer`.

13. [low] There are no bounds or edge cases in the gameplay.
    Evidence: `src/main.js:39-40` has no clamp, so the player can leave the screen sideways. `main.js:45` can tunnel at high `vy`. `main.js:51` calls `gameOver()` inside the storm loop and doesn't stop the loop. The failure message at `main.js:78` is hard-coded.
    Route to: `cl-web:web-game-developer`.

14. [low] There is no packaging, versioning or QA setup.
    Evidence: there is no build step, minification or lockfile (`package.json`), and no tests. The game can't be zipped reproducibly, and `npx serve` pulls from the network.
    Impact: Poki takes a zip, and the version is hand-managed at `0.9.0`.
    Route to: `cl-web:web-harness`.

## What is healthy
- The Poki SDK is loaded from the official URL and wrapped in one file, so the provider code is isolated (`src/sdk.js`, `index.html:7`). Gameplay code only calls `showAd`.
- The code is small and modular (`world.js`, `save.js`, `input.js`), with no globals except the `PokiSDK` global.
- The sprites at 412 KB and the SFX at about 60–90 KB are a sane size (`assets/manifest.json`).
- The draw loop doesn't allocate anything heavy per frame. `makeIslands`/`makeGems` run only on restart.

## Handoff
Changed: nothing (audit only)
Evidence: I read all 12 tracked files (`README.md`, `package.json`, `index.html`, `style.css`, `assets/manifest.json`, `src/*.js`) in full. I did not run `ts_health.mjs` (the project is plain JS, and there is no build or `tsc` to run). I did not use the five-scout fan-out because the project is under 150 lines.
Verify: for #3, block `scores.lumengames.example.com` (or serve over HTTPS) and load the page, and boot never reaches `loop()`. For #2, block `poki-sdk.js` and you get a `ReferenceError` and a blank canvas. For #4, die and restart three times, then press space once and watch for multiple `commercialBreak` calls.
Open: the audio and sprite files are missing from the repo, so I can't verify their real sizes. I haven't run the game in a browser, so I haven't checked the rendering, frame rate or ad behavior. Poki's current technical requirements may have changed, so check them in the Poki developer portal before submitting.
Next: fix the three blockers first (compress the audio and commit the assets, add the SDK lifecycle with a failure fallback, and drop or harden the leaderboard fetch). Then fix the restart/listener bug (#4) and add the pause, mute and mobile handling. You have a week, which is enough for all of this.