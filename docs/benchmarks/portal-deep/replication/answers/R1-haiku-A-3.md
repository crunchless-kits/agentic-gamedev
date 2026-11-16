I didn't edit anything. This is a static read of all 12 tracked files. I didn't run the game in a browser or check the Poki SDK's current API, so the Poki-specific items need checking against Poki's docs.

**Ranked problems (most severe first)**

1. **Audio and sprite assets are missing from the repo.** `assets/` contains only `manifest.json`. `src/audio.js:1` and `:3` load `music.wav`, `jump.wav` and `gem.wav`, which 404. `play()` at `src/audio.js:12` then rejects on every jump and gem pickup, and nothing catches it. `assets/sprites.png` is listed in the manifest but never used.

2. **Leaderboard fetch can stop the game from starting.** `src/main.js:90` awaits `fetchTopScores()` before `newRun()` and `loop()`. `src/net.js:1` uses `http://` (blocked as mixed content on an HTTPS Poki page) pointing at a placeholder `.example.com` host. `src/net.js:4-5` has no timeout or catch, and `src/main.js:87-96` has no catch around `boot()`. Any failure leaves a blank canvas.

3. **SDK init failure also kills boot.** `src/sdk.js:3` calls `PokiSDK.init()` directly. If the Poki script is blocked or offline, `PokiSDK` is undefined, and `src/main.js:88` throws before the game runs.

4. **Duplicate key listeners cause stacked ads and repeated restarts.** `src/main.js:23` calls `bindKeys(jump)` inside `newRun()`, and `src/input.js:4-7` adds a new `keydown` listener on every call. After N game overs, one space press runs `jump()` N times. While the game is over, that calls `restart()` N times at `src/main.js:27` and `:31-34`, which means N commercial breaks and N `newRun()` calls.

5. **Music file is about 52 MB uncompressed.** `assets/manifest.json:15` lists `music.wav` at 54,525,952 bytes and notes it is "uncompressed". Encode it as OGG or MP3. This is likely the largest load-time and bundle-size problem.

6. **Poki SDK integration is incomplete.** The only SDK call is `commercialBreak` (`src/sdk.js:6-8`). There is no loading-finished signal, no gameplay start/stop, and audio is not muted during ads. `src/main.js:31-34` also has no catch, so a rejected ad leaves the game stuck on game over. Check the exact call names against Poki's current SDK docs.

7. **Unthrottled console logging every frame.** `src/main.js:54` logs on every frame. It is slow and noisy, and it should be removed before submission.

8. **Music may never start.** `src/audio.js:6` calls `music.play()` at boot without a user gesture. Browsers usually reject that, the promise is unhandled, and nothing retries it.

9. **No touch controls and no canvas scaling.** Input is keyboard only (`src/input.js:4-6`). The canvas is fixed at 960×540 (`index.html:30`, `style.css:2`) with no scaling. Mobile players, a large share of Poki traffic, can't play.

10. **`localStorage` is unguarded.** `src/save.js:4-5` and `:9` have no try/catch. Sandboxed iframes can throw on storage access, and corrupt JSON makes `JSON.parse` throw. Either failure happens during boot at `src/main.js:89`.

11. **Game keys scroll the page.** `src/input.js:4-6` doesn't call `preventDefault()`, so space and the arrow keys scroll the page.

12. **Player can walk off-screen.** `src/main.js:39-40` has no clamp on `p.x`, so the player can leave the 0–960 play area.

13. **External "More games" link.** `index.html:31` links to an external site that opens in a new tab. Check it against Poki's submission rules. The URL is also a `.example.com` placeholder.

14. **`gameOver()` is not idempotent.** `src/main.js:57-62` can run more than once in a frame. The storm loop at `src/main.js:48-51` has no `break`, and the fall check at `:53` isn't guarded. Two calls would double-count gems and save twice. The current storm layout (`src/world.js:12`) makes a double hit unlikely, but the code is fragile.

15. **Keys are case-sensitive.** `src/main.js:39-40` and `src/input.js:6` only match lowercase `a`, `d` and `w`, so Caps Lock or Shift breaks movement.

16. **Keys can stick after focus loss.** `src/input.js:8-10` only clears keys on `keyup`, so a key held while the window loses focus stays pressed.

17. **Music licence is unverified.** The repo doesn't show that you have rights to `music.wav`. Confirm this before submitting.

**Fix first:** items 1–4. Items 1 and 2 can stop the game from running at all, and item 4 breaks the ad flow.