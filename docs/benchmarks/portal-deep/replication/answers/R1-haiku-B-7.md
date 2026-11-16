I read all 12 tracked files and did not edit anything. I did not run the game in a browser, so these findings come from reading the code. The Poki policy points come from my own knowledge, so check them against Poki's current developer docs before you submit.

## Ranked problems (most severe first)

**Blockers**

1. **Referenced audio files are missing from the repo.** `src/audio.js:1`, `src/audio.js:3` load `assets/music.wav`, `jump.wav`, and `gem.wav`. Only `assets/manifest.json` exists on disk. The manifest (`assets/manifest.json:3-5`) lists those files, so they were either never committed or they're stale. The game will run silently or throw on every sound.
2. **No Poki lifecycle calls.** `src/sdk.js:1-8` only wraps `init` and `commercialBreak`. Nothing calls `PokiSDK.gameLoadingFinished()`, `gameplayStart()`, or `gameplayStop()`. Poki expects these for ad timing and load tracking, so the submission is likely to be rejected or to earn no ad revenue. Wire them in `src/main.js:87-93` (loading finished and start), and in `src/main.js:57-62` (stop on game over).
3. **Music keeps playing during the commercial break.** `src/main.js:31-34` awaits `showAd()` and does not mute or pause audio. Poki requires audio to be muted during breaks. Mute around `src/main.js:32`.
4. **Boot can hang or fail with no game shown.** `src/main.js:88` awaits `initSdk()` with no try/catch, and `src/main.js:90` awaits `fetchTopScores()` before `newRun()` (line 91). If the SDK script is blocked, or the leaderboard request fails, `loop()` never starts and the player sees a black screen. Wrap both in try/catch with a timeout, and start the game regardless.

**High**

5. **Leaderboard uses plain HTTP on a placeholder domain.** `src/net.js:1` uses `http://scores.lumengames.example.com/...`. Poki serves games over HTTPS, so browsers will block this as mixed content. The `.example.com` host also looks like a placeholder that was never replaced. Use an HTTPS endpoint, and also fix `src/net.js:4-5` so a failed or non-JSON response doesn't throw.
6. **Listeners stack on every restart.** `src/main.js:23` calls `bindKeys(jump)` inside `newRun()`, and `src/input.js:4-10` adds new window listeners each time. After N restarts, each keypress fires `jump()` N times. A stale listener can also call `restart()` again.
7. **Pressing jump during a break starts another break.** `src/main.js:26-27` calls `restart()` whenever `state.over` is set, and `restart()` (`src/main.js:31-34`) has no in-flight guard. Mashing space, or holding it (key repeat, see item 14), can queue several `commercialBreak` calls. Add a `restarting` flag.
8. **Double-counted gems on game over.** `src/main.js:51` can call `gameOver()` more than once in the same frame, since the storm loop doesn't stop after `state.over` is set. Each call runs `src/main.js:60` again, adding the gem count twice, and `save()` runs twice. Guard `gameOver()` with an early return when `state.over` is already true.
9. **Corrupt save crashes boot.** `src/save.js:5` calls `JSON.parse` with no try/catch, and `src/save.js:4` and `src/save.js:9` touch `localStorage` directly, which can throw inside sandboxed iframes. Wrap both in try/catch and fall back to defaults.
10. **Unhandled audio promise and blocked autoplay.** `src/audio.js:6` calls `music.play()` on boot, before any user gesture. Browsers reject that promise, and nothing retries. `src/audio.js:12` also doesn't handle the rejection from `s.play()`. Start music on the first key press, and catch the promise.
11. **No touch or mobile controls.** `src/input.js:1-11` only handles keyboard events. Most Poki traffic is mobile, and those players cannot play at all. Add pointer or touch input that maps to jump and left/right.
12. **Space and arrow keys scroll the page.** `src/input.js:6` never calls `e.preventDefault()`, so inside the Poki iframe, space and arrows scroll the page during play.
13. **Frame-locked physics.** `src/main.js:36-55` moves by fixed pixels per frame with no delta time. On a 120 Hz monitor the game runs at double speed.
14. **Key repeat triggers jumps and restarts.** `src/input.js:6` and `src/main.js:28` don't check `e.repeat`. Holding space re-jumps on every repeat, and holding it after game over restarts repeatedly (see item 7).

**Medium**

15. **Uncompressed 54 MB soundtrack.** `assets/manifest.json:3` lists `music.wav` at 54,525,952 bytes, and `src/audio.js:1` preloads it on page load. Re-encode to OGG or MP3 to fit Poki's size and load-time expectations.
16. **Fixed 960×540 canvas with no scaling.** `index.html:10` and `style.css:2` don't scale to the viewport, so the game overflows or shrinks badly on phones and small windows.
17. **Player can leave the screen horizontally.** `src/main.js:39-40` has no clamp. Islands extend to x≈1120 (`src/world.js:3`), past the 960 px canvas, so the player can walk off-screen and be lost.
18. **Per-frame console spam.** `src/main.js:54` calls `console.log` every frame. Remove it.
19. **No pause on tab switch.** `src/main.js:81-85` keeps the loop running when the tab is hidden, and the music keeps playing. Pause on `visibilitychange`.
20. **External "More games" link in the footer.** `index.html:11` links to a third-party domain with `target="_blank"`. Poki restricts outbound links and cross-promotion inside games, so check this against Poki's current rules.

**Low**

21. **Unused asset in the manifest.** `assets/manifest.json:6` lists `sprites.png`, which no code references. Remove it, or wire it in.
22. **Keys can stick after focus loss.** `src/input.js:8-10` never clears `keys` on window blur, so the player can keep moving after alt-tabbing.
23. **Placeholder URL in the footer.** `index.html:11` points at `lumengames.example.com`. Replace it before submitting.

## Not verified

- I did not run the game, so items 1–4 are confirmed by reading only. Item 1 would be confirmed by checking `assets/` against the manifest in a real build.
- I did not check the current Poki SDK docs or submission rules. Items 2, 3, and 20 depend on them.