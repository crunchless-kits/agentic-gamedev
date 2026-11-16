I read all 12 tracked files and made no edits. I did not run the game in a browser, so these findings come from reading the code. The Poki requirements in items 6 and 7 are from memory and should be checked against the current Poki SDK docs.

## Ranked problems

**Blockers**

1. **Game assets are missing from the repo.** `assets/` contains only `manifest.json`. `audio.js:1` and `audio.js:3` load `assets/music.wav`, `jump.wav` and `gem.wav`, which don't exist, so sound and music fail. The manifest also lists `sprites.png`, which nothing uses. Commit the assets or remove the references.

2. **Placeholder domains will not resolve.** `net.js:1` points the leaderboard at `scores.lumengames.example.com`, and `index.html:23` links "More games" to `lumengames.example.com`. `example.com` is a reserved domain. Point these at real hosts.

3. **Any startup failure leaves a black screen.** `main.js:87-94` (`boot`) has no `try`/`catch`. It awaits `initSdk()` (`sdk.js:3`), which throws if the Poki script at `index.html:19` fails to load. It also awaits `fetchTopScores()` (`main.js:90`), which throws on network failure or a non-JSON response (`net.js:4-5`). `save.js:5` also throws if the saved JSON is corrupt. Each of these should fall back to a playable game.

**High**

4. **Key listeners stack on every restart.** `main.js:23` calls `bindKeys(jump)` inside `newRun()`, and `input.js:4-7` adds a new `window` listener each time. After N restarts, one space press calls `jump()` N times, and each call can trigger another `restart()` and another ad.

5. **Ads fire repeatedly and too easily.** `main.js:26-27` and `main.js:31-33` call `showAd()` on every space press after death. Nothing debounces it, and `input.js:6` ignores `e.repeat`, so holding space auto-repeats the call. During an ad, further presses can start more `commercialBreak()` calls. Gate the ad to one call per run and to natural breaks.

6. **Poki SDK lifecycle calls are missing.** `sdk.js` only wraps `init` and `commercialBreak`. Poki's integration also expects `gameLoadingFinished()` at startup, `gameplayStart()`/`gameplayStop()` around play, and pausing and muting the game and audio during a commercial break. Confirm the exact method names against the current SDK docs.

7. **Music autoplay is unhandled and the file is huge.** `audio.js:6` calls `music.play()` on boot with no user gesture, so browsers may reject it. The returned promise is ignored, and `audio.js:12` has the same issue for `s.play()`. `manifest.json:29` lists the soundtrack as a 54 MB uncompressed WAV, which will hurt load time. Convert it to OGG or MP3 and start music after the first input.

8. **Game over can double-count gems.** `main.js:51` calls `gameOver()` once per overlapping storm within a single frame. `gameOver()` at `main.js:57-61` has no guard, so `data.gems` can be incremented more than once and `save()` runs repeatedly. Add `if (state.over) return;` at the top of `gameOver`.

**Medium**

9. **Movement depends on frame rate.** `main.js:39-42` and `main.js:36` use fixed per-frame steps with no delta time. On a 120 Hz display the game runs at double speed.

10. **Per-frame console logging.** `main.js:54` logs every frame, which floods the console and costs performance.

11. **No response checks or data validation on the leaderboard.** `net.js:4-5` never checks `res.ok`. `main.js:77` assumes `topScores[0].score` exists.

12. **Leaderboard is read-only.** There is no score submission, so the "Top" value never reflects the player's own results. This is a feature gap rather than a crash, but reviewers will likely notice it.

13. **Possible policy issue with the external link.** `index.html:23` opens a new window to an outside site. Check Poki's guidelines on external links.

14. **Stuck keys after focus loss.** `input.js:8-10` only clears keys on `keyup`. If the window loses focus while a key is held, the key stays "pressed" until it is pressed and released again. Clear `keys` on `blur`.

**Low**

15. **Player is not clamped to the screen.** `main.js:39-40` lets the player move off the left and right edges.

16. **Canvas is not responsive.** `index.html:22` and `style.css:2` fix the canvas at 960×540 with no scaling, so it is cropped on smaller viewports.

17. **Key matching is case-sensitive.** `input.js:5` and `main.js:39-40` only match lowercase `a`/`d`/`w`, so Shift or Caps Lock breaks WASD.

18. **README is slightly inaccurate.** `README.md:3` mentions only arrows and WASD, but `input.js:6` also jumps on `ArrowUp`.