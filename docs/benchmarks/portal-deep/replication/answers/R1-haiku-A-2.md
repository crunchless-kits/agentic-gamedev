The audit is done. I did not edit any files. This is a static read of all 12 tracked files. I did not run the game in a browser.

## Ranked problems (most severe first)

1. **Audio and sprite assets are not in the repo.** `audio.js:1-3` loads `assets/music.wav`, `jump.wav` and `gem.wav`. Only `assets/manifest.json` is tracked, and the `.wav` files are not on disk. The game will 404 on sound. Blocker.

2. **Placeholder and insecure network URLs can stop the game from booting.**
   - `net.js:1` uses `http://scores.lumengames.example.com/...`. That is a placeholder domain, and `http://` is blocked as mixed content on an HTTPS page.
   - `main.js:90` awaits `fetchTopScores()` with no catch, and `main.js:96` calls `boot()` with no catch. If the fetch fails, the game never starts.
   - `sdk.js:3` calls `PokiSDK.init()` with no guard. If the SDK script fails to load, boot dies the same way.

3. **Ads can stack and fire repeatedly.**
   - `main.js:23` calls `bindKeys(jump)` on every `newRun()`, and `input.js:4` adds a new `keydown` listener each time. After N game-overs, one Space press calls `restart()` N times, which means N `showAd()` calls.
   - `input.js:6` does not check `e.repeat`. Holding Space after game-over re-triggers `restart()`. `main.js:27` still sees `state.over` true while the ad is awaited (`main.js:31-32`), so the repeats stack.

4. **Music is 54.5 MB.** `assets/manifest.json:29` describes `music.wav` as "full soundtrack, uncompressed". Poki's requirements page targets an initial download under 8 MB. Re-encode to OGG or MP3.

5. **No Poki gameplay events.** Nothing calls `gameplayStart` or `gameplayStop`. Relevant spots are `main.js:57-62` (game over), `main.js:87-94` (boot), and `main.js:31-34` (restart). Poki expects `gameplayStart` on first player input and `gameplayStop` on game over or pause. Also confirm the SDK's loading-finished call against Poki's docs.

6. **Keyboard-only, fixed-size canvas.** `input.js:1-11` has no touch or pointer input. `index.html:22` and `style.css:2` fix the canvas at 960×540 with no scaling. Mobile players cannot play at all.

7. **Debug logging every frame.** `main.js:54` calls `console.log` at 60 Hz. Poki asks for debug code to be stripped before publishing. Remove it.

8. **Physics depends on frame rate.** `main.js:39-42`, `main.js:45`, `main.js:49-50` and `main.js:53` move and integrate per frame with no delta time. On 120 Hz or 144 Hz displays the game runs about 2–2.4× fast.

9. **Gems and score can double-count on one death.** In `main.js:48-52`, two overlapping storms in the same frame each call `gameOver()` (`main.js:51`). `main.js:59-61` then adds `data.gems` and saves twice.

10. **Unhandled autoplay rejections.** `audio.js:6` (`music.play()`) and `audio.js:12` (`s.play()`) return promises that are not handled. `main.js:92` starts music before any user gesture, so browsers reject it and log an uncaught error.

11. **Storage can crash boot.** `save.js:4-5` calls `localStorage.getItem` and `JSON.parse` with no try/catch. Corrupt data or a sandboxed iframe that blocks storage throws, and `main.js:89` then fails the boot.

12. **Keys stick when focus is lost.** `input.js:8-10` only clears a key on `keyup`. If the window loses focus while a key is held, the player keeps moving. Clear `keys` on `blur`.

13. **Space and arrows scroll the page.** `input.js:6` does not call `preventDefault()`.

14. **Outbound "More games" link.** `index.html:23` opens `lumengames.example.com` in a new tab, which is also a placeholder. I could not confirm Poki's outbound-link rule. Check it before submitting.

15. **Leaderboard is read-only.** `net.js` only fetches. No code submits scores, so the "Top" value on `main.js:77` never reflects real play.

16. **Unused asset.** `assets/manifest.json:32` lists `sprites.png` (412 KB), but no code references it. Remove it or wire it in.

17. **Minor input bug.** `input.js:5` uses `e.key`, so Shift+A produces `"A"` and the `keys.a` check in `main.js:39` misses it.

## Not verified
- I did not run the game, so the physics and ad-timing points are from reading the code.
- The 8 MB initial-download figure and the gameplay-event rules come from Poki's requirements and SDK pages, as summarised in search results: [sdk.poki.com/new-requirements](https://sdk.poki.com/new-requirements) and [sdk.poki.com/sdk-documentation](https://sdk.poki.com/sdk-documentation). I did not open the pages themselves.
- Poki's outbound-link policy was not found in search. Item 14 needs a check against Poki's developer docs.