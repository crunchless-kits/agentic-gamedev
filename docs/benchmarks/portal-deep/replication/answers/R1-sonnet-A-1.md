Audit of Skyhop for Poki submission, ranked by severity. I read all 11 files and didn't edit anything. The line numbers come from the files as they are now.

## Blockers (likely rejection or a broken game)

1. **The 52 MB uncompressed music file** is listed in `assets/manifest.json:3` and loaded in `src/audio.js:1`. Poki enforces a small initial download size, and a 54,525,952-byte WAV will blow it. Convert it to OGG or MP3 (about 1–3 MB) and stream or lazy-load it.

2. **Music autoplay is blocked by browsers.** `src/main.js:92` calls `startMusic()` from `boot()` with no user gesture, and `src/audio.js:6` doesn't handle the rejected promise. The result is an unhandled rejection and no music. Start audio on the first key press or click. Also catch the `play()` rejections in `src/audio.js:12`.

3. **The game never calls Poki's gameplay events.** `src/sdk.js` has no `gameLoadingFinished()`, `gameplayStart()` or `gameplayStop()`. Poki requires these. Call `gameplayStart` when a run begins (`src/main.js:91`, after `newRun`) and `gameplayStop` in `gameOver()` (`src/main.js:57`). Call `gameLoadingFinished` after boot.

4. **The leaderboard fetch can hang the game on boot.** `src/net.js:1` uses plain `http://` on a placeholder `.example.com` domain. This is blocked as mixed content on HTTPS. It's also an external call, which Poki disallows. In `src/main.js:90` the `await fetchTopScores()` has no try/catch, so a failure or hang stops the game from starting at all. Remove it, or at least wrap it in try/catch with a timeout and don't await it.

5. **A failed `PokiSDK.init()` also stops boot.** `src/sdk.js:3` and `src/main.js:88` have no error handling. Poki's pattern is `init().then(...).catch(...)`, and the game should still run if the SDK is blocked (for example by an ad blocker). `showAd()` at `src/sdk.js:7` has the same problem. A rejection there leaves the player on the game-over screen.

6. **Input handlers pile up on every restart.** `src/main.js:23` calls `bindKeys(jump)` inside `newRun()`. Each restart adds another pair of `window` listeners, so after N restarts one space press fires `jump()` N times. Move `bindKeys` into `boot()`.

7. **Restart can run twice during the ad.** `src/main.js:27` calls `restart()` on every key press while `state.over` is true, and `restart()` awaits the ad. Mashing space during the ad queues several `newRun()` calls. Add a "restarting" guard. Also mute the audio during ads, since Poki requires it.

## Policy and compliance

8. **External outbound link.** `index.html:11` has a "More games" link to the studio's site. Poki prohibits links that take players off-platform, so remove the footer. The branding also eats canvas space.

9. **Debug logging in the game loop.** `src/main.js:54` runs `console.log` every frame, which is 60 lines a second. Remove it.

10. **Page scroll on keys.** `src/input.js:4` doesn't call `preventDefault()` for Space and the arrow keys, so the iframe page scrolls while playing.

## Robustness and polish

11. **`load()` can throw.** `src/save.js:5` has no try/catch around `JSON.parse` or `localStorage`. A corrupt save, or storage blocked in the iframe, crashes boot. `save()` at line 9 needs the same guard.

12. **Game-over can corrupt state and double-count.** `src/main.js:51` calls `gameOver()` once per storm and again at line 53. It's guarded only by the `return` at the top of the next frame, so a frame where the player touches two storms, or a storm and the pit, counts gems twice (line 60). Add an early return in `gameOver()` if `state.over` is already set. Separately, `data.gems` at line 60 counts the run's gems but not any spent ones. That's fine unless gems get a use later.

13. **Input is wrong in some cases.** `src/input.js:6` uses `e.key === "w"`, so Caps Lock or Shift (`"W"`) breaks jumping. `src/main.js:39-40` has the same problem for `a` and `d`. Use `e.code`, or lowercase the key. Keys also stay "stuck" if the window loses focus (`src/input.js:8`), so add a `blur` reset.

14. **No pause when the tab or iframe loses focus.** The `requestAnimationFrame` loop (`src/main.js:81`) keeps running and the music keeps playing. `src/main.js:41-42` also ties physics to frame rate, so 144 Hz monitors play about 2.4× faster than 60 Hz ones. Use a delta-time or fixed timestep.

15. **No touch or mobile input, and a fixed 960×540 canvas** (`index.html:10`). Poki lists mobile as a platform, and the canvas has no scaling or fit-to-container logic.

16. **Jump sound can throw.** `src/audio.js:11-12` leaves `play()` unhandled (see #2). It also resets and replays one `Audio` element, which cuts off rapid gem sounds.

17. **Package metadata.** `package.json:3` is version `0.9.0`, and `package.json:6` has `npx serve .` as the start script. Neither matters for submission, but it's a good moment to bump the version and add a build step that zips the game for upload.

The first seven items are the ones to fix this week. Items 1, 3 and 4 are the most likely to get the game rejected on review.