I read every file in the repo and made no edits. The game is about 160 lines, so the list below is from reading the code. I did not check Poki's current submission guidelines or SDK docs, so the Poki-specific items need confirming against them.

## Ranked problems

**Blockers**

1. **Audio and sprite assets are not in the repo.** `assets/manifest.json:2-5` lists `music.wav`, `jump.wav`, `gem.wav` and `sprites.png`, but only `manifest.json` exists on disk or in git. `src/audio.js:1-3` will fail to load these. Add the files or the build will ship without sound.
2. **The game may never start.** `src/main.js:87-96` awaits `initSdk()`, `load()` and `fetchTopScores()` in sequence with no `try`/`catch`, so any failure leaves a blank canvas. The failure points are:
   - `src/net.js:1` uses `http://scores.lumengames.example.com`. That is a reserved placeholder domain, and it is plain HTTP, which HTTPS pages block as mixed content.
   - `src/net.js:4` has no timeout, so a hung request blocks `newRun()` at `src/main.js:91` indefinitely.
   - `src/sdk.js:3` calls `PokiSDK.init()` with no guard, so it throws if the Poki script is blocked.
   - `src/save.js:4-5` throws if `localStorage` is unavailable (common in sandboxed iframes) or if the stored JSON is corrupt.
3. **Each death can trigger several ads.** `src/input.js:3-7` adds new `keydown`/`keyup` listeners every time `bindKeys` runs. `src/main.js:23` calls it from `newRun()`, which runs on every restart (`src/main.js:33`). After the first restart, one key press calls `jump()` multiple times. While the game is over, each call runs `restart()` (`src/main.js:26-34`), so each press queues another `showAd()`. Holding the key auto-repeats and makes it worse.
4. **A failed ad leaves the player stuck.** `src/main.js:31-34`: if `PokiSDK.commercialBreak()` rejects, `newRun()` never runs and the game-over state persists. There is also no guard against concurrent restarts (see item 3).
5. **Poki SDK integration is incomplete.** `src/sdk.js:1-8` and `src/main.js:88-93` never call the loading-finished, gameplay start or gameplay stop hooks. Audio also keeps playing during the commercial break. Check these against Poki's SDK requirements.
6. **Touch and mobile are unsupported.** Controls are keyboard-only (`src/input.js:4-7`). `index.html:15-20` has no viewport meta tag, and the fixed 960×540 canvas (`index.html:22`, `style.css:2`) is not scaled to fit the screen. Many Poki players are on phones, so this is probably a rejection or a high-churn problem.
7. **The game loop can stop permanently.** `src/main.js:77` reads `topScores[0]?.score`. If the leaderboard returns `null`, this throws. `loop()` at `src/main.js:81-85` calls `requestAnimationFrame` after `draw()`, so the exception stops the loop and the game freezes.

**High**

8. **Debug logging runs every frame.** `src/main.js:54` calls `console.log("frame", …)` at 60 fps. It hurts performance and floods the console. Remove it.
9. **Physics depends on frame rate.** Movement and gravity are per frame (`src/main.js:39-53`), and the loop is `requestAnimationFrame` (`src/main.js:84`). On 120 Hz displays the game runs about twice as fast. Use delta time.
10. **The music file is too big.** `assets/manifest.json:3` describes `music.wav` as 54,525,952 bytes (about 52 MiB) uncompressed. Convert to OGG or MP3, which should be a few MB.
11. **Music starts without a user gesture.** `src/main.js:92` calls `startMusic()` at boot, and `src/audio.js:6` does not handle the promise. Browsers will block autoplay, and the rejection goes unhandled. The same applies to `src/audio.js:12`.

**Medium**

12. **Arrow keys and Space scroll the page.** `src/input.js:4-7` never calls `preventDefault()`.
13. **Caps Lock breaks WASD and jump.** `src/input.js:6` and `src/main.js:39-40` compare `e.key` against lowercase letters only, so `W`, `A`, `S` and `D` fail.
14. **Keys can get stuck.** `src/input.js:8-10` has no `blur` handler, so a key released outside the window stays held.
15. **The footer links to a placeholder domain.** `index.html:23` links to `lumengames.example.com`. Check Poki's rules on outbound links in the footer.
16. **The player can leave the screen.** `src/main.js:39-40` does not clamp `p.x`. The player can walk off the sides.

**Low**

17. `assets/sprites.png` is listed in the manifest but never used.
18. Music keeps playing when the tab is hidden, since nothing listens for `visibilitychange`.

Items 1–7 are the ones I would fix before submitting. Items 3 and 4 are one fix in `restart()`/`bindKeys` if you want to combine them.