I read all 12 tracked files and did not edit anything. These findings come from reading the code only. I did not run the game in a browser or test it on a phone, so treat the mobile and frame-rate items as likely rather than observed.

## Ranked problems

**Blockers (fix before submitting)**

1. **Audio and sprite files are missing from the repo.** `assets/` contains only `manifest.json`, but `audio.js:1` and `audio.js:3` load `music.wav`, `jump.wav`, and `gem.wav`, and `manifest.json:3-6` lists all four assets. Confirm they exist in the folder you'll zip. If they don't, the game ships silent, and `audio.js:6` and `audio.js:12` will throw unhandled rejections.
2. **The soundtrack is 54.5 MB of uncompressed WAV.** `assets/manifest.json:3` and `audio.js:1`. That's far too heavy for a portal bundle and will slow load time. Convert it to OGG or MP3 and check Poki's current size limit.
3. **Boot blocks on a leaderboard request that can fail.** `main.js:90` awaits `fetchTopScores()`, and `net.js:4-5` has no `catch` or timeout. If the request fails or hangs, the game never starts.
4. **The leaderboard URL is plain HTTP on a placeholder domain.** `net.js:1` uses `http://scores.lumengames.example.com`. Poki's HTTPS page will block it as mixed content, and `.example.com` is a reserved placeholder. Replace it with a real HTTPS endpoint that sends CORS headers.
5. **The game hard-fails if the Poki SDK doesn't load.** `sdk.js:3` and `sdk.js:7` call `PokiSDK` directly with no guard, and `main.js:88` awaits `initSdk()` with no catch. Ad blockers or a blocked CDN leave a blank canvas.
6. **No gameplay or loading signals are sent to Poki.** The only SDK calls are `init` and `commercialBreak`. There are no `gameLoadingFinished`, `gameplayStart`, or `gameplayStop` calls (`main.js:87-94`, `main.js:31-34`, `main.js:57-62`). Poki requires these for loading and gameplay tracking.
7. **Each game-over key press multiplies restarts and ad calls.** `bindKeys(jump)` runs inside `newRun()` (`main.js:23`), and `input.js:4-7` adds a new `keydown` listener every time. After a restart, a key press calls `jump()` once per listener, and each call runs `restart()`, which requests another ad. The listener count roughly doubles on each game-over press.
8. **Ads run with no audio mute or game pause, and no error handling.** `sdk.js:6-7` calls `commercialBreak()` with no callbacks, so music keeps playing during the ad (`audio.js:5-7` never pauses). `main.js:31-34` has no `try`/`catch`, so a rejected ad leaves the game stuck on the game-over screen.
9. **An ad fires on every death.** `main.js:27` and `main.js:31-32`. Poki expects spaced-out breaks, so this is likely to be rejected or throttled. Review the ad cadence against Poki's guidelines.
10. **There are no touch or pointer controls.** `input.js:1-11` is keyboard-only, and `main.js:78` tells the player to "Press space." Most Poki traffic is mobile, so the game is effectively unplayable there.
11. **Physics runs per rendered frame, not per unit of time.** `main.js:36-42` moves the player by fixed amounts each frame, and `main.js:84` calls `update()` on every `requestAnimationFrame`. On 120 Hz or 144 Hz monitors the game runs 2× to 2.4× too fast.
12. **The canvas is a fixed 960×540 with no scaling.** `index.html:10` and `style.css:2`. On smaller viewports it gets clipped or overflows.

**Gameplay and correctness**

13. **Gems are double-counted.** `main.js:51` can call `gameOver()` inside the storm loop, and `main.js:53` can call it again in the same frame. Each call runs `data.gems += ...` (`main.js:60`) and saves.
14. **Two islands are off-screen.** `world.js:3` places island 7 at x=1020 on a 960-wide canvas, so it's fully invisible. Island 6 at x=880 is partly cut off. Its gem (`world.js:8`) is unreachable.
15. **The player is not clamped to the screen.** `main.js:39-40` lets the player walk off either edge and disappear.
16. **Controls are case-sensitive and can stick.** `main.js:39-40` checks lowercase `a` and `d` only, so Caps Lock breaks movement. `input.js:8-10` never clears keys on window blur, so a key held during alt-tab stays pressed.
17. **Space and arrow keys scroll the page.** `input.js:4-7` never calls `preventDefault()`.

**Robustness and polish**

18. **Saved data can crash boot.** `save.js:5` runs `JSON.parse` with no guard, and `save.js:4` and `save.js:9` assume `localStorage` is available. Corrupt data or a sandboxed iframe leaves the game blank, since `main.js:89` runs this during boot.
19. **Audio autoplay is not handled.** `main.js:92` calls `startMusic()` before any user gesture. `audio.js:6` ignores the rejected promise, and nothing retries.
20. **The game keeps running when the tab is hidden.** `main.js:81-85` has no `visibilitychange` handling, so music and the game loop run in the background.
21. **There is an external link in the footer.** `index.html:11` links to "More games" on another domain, which opens in a new tab. Poki generally doesn't allow links that take players off the portal. Check their current rules.
22. **There is a per-frame `console.log`.** `main.js:54` writes 60 lines a second. Remove it before release.
23. **`sprites.png` is listed but unused.** `assets/manifest.json:6` is never referenced in the code.

## Suggested order

Start with items 1–2 (confirm assets and shrink the audio), then 3–7 (boot safety and Poki SDK integration), then 8–10 (ads and mobile). Items 11–12 are next. Gameplay bugs 13–17 and robustness items 18–23 can follow.