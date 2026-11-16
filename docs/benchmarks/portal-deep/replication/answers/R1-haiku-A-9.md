I audited the game by reading every tracked file. I did not edit anything, did not run the game in a browser, and did not check Poki's current submission rules online, so the Poki-specific items are from memory and should be checked against Poki's docs.

## Ranked problems

**Blockers (fix before submitting)**

1. **Game never starts if the Poki SDK fails to load.** `src/sdk.js:3` and `src/sdk.js:7` call `PokiSDK` directly, with no fallback. `src/main.js:88` awaits `initSdk()` and `src/main.js:96` calls `boot()` with no `catch`. An ad blocker or a CDN hiccup leaves a blank canvas.

2. **Leaderboard fetch can block startup, and the URL is broken.** `src/net.js:1` uses `http://` on a site that will be served over HTTPS, so the browser blocks it as mixed content. The domain is `scores.lumengames.example.com`, which looks like a placeholder. `src/net.js:4-5` has no `catch` and no `res.ok` check. `src/main.js:90` awaits this before `newRun()` at `src/main.js:91`, so a failed fetch means no game.

3. **Audio files are missing from the repo.** `src/audio.js:1` and `src/audio.js:3` load `assets/music.wav`, `jump.wav`, and `gem.wav`. Only `assets/manifest.json` is tracked, so these files are absent from the snapshot. The manifest also lists `assets/sprites.png`, which nothing uses (`assets/manifest.json:2-5`). If the files exist on your machine, they need to be committed. If not, the audio is silently broken.

4. **Ads are shown on every restart, sometimes several times.** `src/main.js:23` calls `bindKeys(jump)` inside `newRun()`. `newRun()` runs again on every restart (`src/main.js:33`), and `src/input.js:4-7` adds a new window listener each time, so the listeners pile up. After a second death, one space press calls `restart()` twice, which calls `showAd()` twice (`src/main.js:26-27`, `src/main.js:31-32`). Nothing stops `restart()` from running again while an ad is still open.

5. **Holding space restarts the game with no delay.** `src/input.js:6` does not check `e.repeat`, so key auto-repeat fires `jump()` on every repeat. Holding space through a death triggers another restart and another ad.

6. **No touch controls and a fixed-size canvas.** The only input is keyboard (`src/input.js:4-7`; `README.md:3` says "Arrow keys or WASD"). Phone players cannot play at all. The canvas is fixed at 960×540 (`index.html:22`, `style.css:2`) with no scaling.

7. **Poki SDK lifecycle hooks are missing (verify against Poki's docs).** `src/sdk.js` only exposes `init` and `commercialBreak`. There is no gameplay start/stop call around the ad (`src/main.js:32`), no loading-finished call after boot, and no audio muting during the ad. The music keeps playing through the break.

8. **Ships a 54 MB uncompressed soundtrack.** `assets/manifest.json:2-3` lists `music.wav` at 54,525,952 bytes, marked "full soundtrack, uncompressed". Convert it to OGG or MP3. Size and load time will hurt the Poki listing.

**High (fix before submitting)**

9. **`localStorage` access is unguarded.** `src/save.js:4` can throw under sandboxed or third-party iframe storage restrictions, and `src/save.js:5` throws on corrupt JSON. Either one stops `boot()` (`src/main.js:89`).

10. **Audio promises are unhandled and autoplay is not handled.** `src/audio.js:6` and `src/audio.js:12` ignore the promise from `play()`. Browsers block `music.play()` until a user gesture, and `src/main.js:92` calls `startMusic()` at boot, so the music will usually be rejected with no retry.

11. **Debug logging runs every frame.** `src/main.js:54` calls `console.log` on every frame. It slows the game and spams the console on submission review.

12. **The player can walk off screen.** `src/main.js:39-40` changes `p.x` with no clamp to the 0–960 canvas.

**Medium**

13. **Physics depends on frame rate.** `src/main.js:39-42` and `src/main.js:45` use fixed per-frame constants with no delta time. Gameplay speed will differ on 120 Hz or 144 Hz displays.

14. **`gameOver()` is not idempotent.** `src/main.js:51` can call it once per overlapping storm in the same frame, and `src/main.js:60` adds the gem count each time. Two storms overlapping in one frame double-count gems and save twice.

15. **Keys stick after focus is lost.** `src/input.js:8-10` only clears a key on `keyup`. If the player releases a key outside the window, the character keeps moving.

16. **The leaderboard is read-only.** `src/net.js` only fetches scores. Nothing submits a score, so the "Top" value in `src/main.js:77` never reflects the player's results.

17. **External link to a placeholder domain.** `index.html:23` links to `lumengames.example.com` in a new tab. Poki's rules on outbound links are strict, and this link goes nowhere useful.

**Low**

18. **Possible draw-loop crash on a bad leaderboard response.** `src/main.js:77` uses `topScores[0]?.score`. If the response is `null`, `topScores[0]` throws every frame. `src/main.js:90` does not validate the shape.

19. **Key matching is case-sensitive.** `src/input.js:6` only matches lowercase `"w"`, so Caps Lock or Shift+W does not jump.

**Next step:** Items 1–8 need fixes before submission. Fixing 4 and 5 together is one change in `src/input.js` and `src/main.js`. Two things I could not confirm from here: whether the audio files exist outside this repo (item 3), and Poki's current SDK requirements (item 7).