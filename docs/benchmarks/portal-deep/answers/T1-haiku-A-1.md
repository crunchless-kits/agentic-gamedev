I read all 12 tracked files and made no edits. Nothing was run in a browser, so the findings come from reading the code. The Poki-specific requirements below are from memory, so check them against Poki's current submission guidelines before you rely on them.

**Ranked problems**

**Blockers (fix before submitting)**

1. **Audio and sprite assets are missing from the repo.** `assets/` contains only `manifest.json`. `music.wav`, `jump.wav`, and `gem.wav` are loaded by `src/audio.js:1` and `src/audio.js:3`, and `sprites.png` is listed in `assets/manifest.json:6`. The game will run silently, and the build will be incomplete.
2. **The leaderboard request uses plain HTTP.** `src/net.js:1` fetches `http://scores.lumengames.example.com/...`. Poki serves games over HTTPS, so the browser will block this as mixed content. The `.example.com` host also looks like a placeholder.
3. **Boot has no error handling, so one failure leaves a black screen.** In `src/main.js:87-96`, `boot()` awaits `initSdk()` and then `fetchTopScores()` with no try/catch and no fallback. If the leaderboard request fails (item 2), `newRun()` and `loop()` never run. `src/sdk.js:3` and `src/sdk.js:7` reference the global `PokiSDK` directly, so a blocked or failed SDK script throws a ReferenceError at the same point.
4. **The soundtrack is a 54 MB uncompressed WAV.** `assets/manifest.json:3` says so itself. Convert it to OGG or MP3. Poki's size budget is tight, and this file will load slowly on mobile.
5. **The Poki SDK integration is incomplete.** Gameplay is never reported with `gameplayStart()` or `gameplayStop()`, which Poki requires for ad fill and reporting. Audio is not muted around `commercialBreak()` (`src/sdk.js:6-8`, called from `src/main.js:32`). The `index.html:7` script is also loaded synchronously in the head, with no `defer` or `async`.

**High**

6. **Restarting stacks keyboard listeners and can trigger multiple ads.** `bindKeys(jump)` is called inside `newRun()` (`src/main.js:23`), and `newRun()` runs again on every restart (`src/main.js:33`). Each restart adds another `keydown` listener in `src/input.js:4-7`, so one key press calls `jump()` several times. While `restart()` is waiting on `showAd()` (`src/main.js:31-34`), `state.over` is still true. A second press, or key auto-repeat, calls `restart()` again, which starts another commercial break.
7. **`gameOver()` is not idempotent.** It is called from the storm loop (`src/main.js:51`) and from the fall check (`src/main.js:53`) with no guard. Because `update()` only returns early at the top of the frame (`src/main.js:38`), two storms or a storm plus a fall in the same frame call it twice. That adds the taken-gem count to `data.gems` twice (`src/main.js:60`) and saves twice (`src/main.js:61`).
8. **The level is wider than the canvas.** `src/world.js:3` places islands at x up to 1020, and the canvas is 960 wide. Island 7 is fully off-screen, and island 6 is partly off-screen. The player's x position is never clamped (`src/main.js:39-40`), so the player can walk out of view.

**Medium**

9. **A debug log runs every frame.** `src/main.js:54` calls `console.log` at 60 Hz. Remove it. It is a performance cost, and it floods the console.
10. **Movement and physics depend on frame rate.** Speed, gravity, and storm velocity are applied per frame (`src/main.js:39-42` and `src/main.js:49-50`). On 120 Hz or 144 Hz displays the game runs faster. Use delta time.
11. **Input handling has gaps.** `src/input.js:4-7` never calls `preventDefault()`, so Space and the arrow keys can scroll the page. Nothing clears `keys` on window blur (`src/input.js:8-10`), so a key released while the window is unfocused stays "held". Uppercase `A`, `D`, and `W` are not handled (`src/main.js:39-40` and `src/input.js:6`).
12. **Audio promises are unhandled.** `music.play()` (`src/audio.js:6`) and `s.play()` (`src/audio.js:12`) return promises that can reject, for example when autoplay is blocked before a user gesture. The rejection goes unhandled.
13. **Corrupt save data stops the game from booting.** `JSON.parse` in `src/save.js:5` throws on malformed data, and `load()` is called in `boot()` (`src/main.js:89`) with no try/catch. `localStorage` access can also throw inside sandboxed iframes, which is how many portals host games.
14. **The footer links off-site, and the URL is a placeholder.** `index.html:11` links to an external "More games" page on a `.example.com` domain. Poki's guidelines usually discourage links that take players off the platform, so confirm this before submitting.

**Low**

15. **Scores are fetched but never submitted.** `src/net.js` only reads the leaderboard. Nothing posts the player's score, so the leaderboard never fills.
16. **The canvas does not scale.** It is a fixed 960×540 (`index.html:10`, `style.css:2`), so it will be clipped on small screens.
17. **`sprites.png` is unused.** It is listed in the manifest (`assets/manifest.json:6`), but the game draws rectangles. Remove it, or use it.
18. **There is no favicon.** Add one, so the browser does not request a missing `favicon.ico`.

**Suggested order:** fix 1–5 first, since they can block submission. Then 6–8, which are real gameplay bugs. Items 9–18 are cleanup.