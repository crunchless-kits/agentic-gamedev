I audited the whole project and made no edits. The repo has 12 tracked files, and I read all the game code. The main issue is that three of the four assets the game loads are missing from the repo and the disk, so the build can't ship as-is.

## Ranked problems

**Blockers (fix before submitting)**

1. **Missing assets.** `src/audio.js:1,3` loads `assets/music.wav`, `assets/jump.wav`, and `assets/gem.wav`, and none of them exist on disk or in git. Only `assets/manifest.json` is present. Sound will fail silently, and the `play()` promise rejections will be unhandled. Also, `assets/sprites.png` is listed in the manifest but the code never uses it.
2. **Oversized soundtrack.** `assets/manifest.json:3` lists `music.wav` at 54,525,952 bytes (about 52 MB) and notes it is uncompressed. Convert it to OGG or MP3 at a small bitrate. Check Poki's bundle size limit in their docs. Either way, a 52 MB download is bad on mobile.
3. **No error handling in boot.** `src/main.js:87-94` has no try/catch. If `initSdk()` fails (ad blocker, CDN outage, or `PokiSDK` undefined from `src/sdk.js:3`), or `fetchTopScores()` fails (`src/main.js:90`), or `load()` throws (`src/save.js:5`), `boot()` rejects and the canvas stays blank.
4. **Incomplete Poki SDK integration.** `src/sdk.js:6-7` and `src/main.js:31-34` call `commercialBreak()` but nothing calls `gameplayStart`/`gameplayStop`, and nothing mutes audio around the ad. Poki's SDK docs require these, so check them. If `commercialBreak()` rejects, `restart()` never reaches `newRun()` and the player is stuck on the game-over screen.
5. **External placeholder domains.** `src/net.js:1` points to `http://scores.lumengames.example.com/...`, and `index.html:11` links to `https://lumengames.example.com/more`. `example.com` is a reserved placeholder domain, so both need real URLs.
6. **Mixed content.** `src/net.js:1` uses `http://`. Poki serves over HTTPS, so browsers will block the request.

**High**

7. **Ads stack on restart.** `src/main.js:23` calls `bindKeys(jump)` inside `newRun()`, and `newRun()` runs on every restart. Each restart adds another `keydown` listener (`src/input.js:4`). Holding space also auto-repeats `keydown` and never checks `e.repeat`, so one death can trigger several `showAd()` calls and several `newRun()` calls. Fix: bind keys once, and ignore repeats or guard restart with a flag.
8. **Double game-over counts gems.** `src/main.js:51` and `src/main.js:53` can both call `gameOver()` in the same frame (two storms, or a storm plus a fall). `gameOver()` at `src/main.js:57-61` then adds the taken-gem count to `data.gems` and saves again, so gems are double-counted. Guard it with `if (state.over) return;`.
9. **Per-frame `console.log`.** `src/main.js:54` logs every frame, which floods the console and costs performance. Remove it before submission.
10. **Unguarded localStorage.** `src/save.js:4-5` can throw on corrupted JSON, and Poki's iframe can throw when storage is blocked. `load()` has no try/catch. A throw here also leaves `data` undefined, so `draw()` crashes on `data.best`.

**Medium**

11. **Frame-rate-dependent physics.** `src/main.js:39-53` moves and accelerates by fixed per-frame amounts with no delta time, so the game runs about 2x fast on 120 Hz monitors.
12. **Unhandled audio promises.** `src/audio.js:6` (`music.play()` before any user gesture, so autoplay is blocked) and `src/audio.js:12` (`s.play()`) return promises that are never caught.
13. **Space scrolls the page.** `src/input.js:6` never calls `preventDefault()`, so space and arrows scroll the page during play.
14. **Stuck keys on blur.** `src/input.js:8-10` only clears keys on `keyup`. Switching windows while holding a key leaves it stuck.
15. **No horizontal clamp.** `src/main.js:39-40` never limits `p.x`, so the player can walk off either side of the 960-wide canvas.
16. **No pause when hidden.** `src/main.js:81-85` keeps running the loop and physics when the tab is hidden. Pause on `visibilitychange`.
17. **Fixed-size canvas.** `index.html:10` and `style.css:2` use a fixed 960×540 canvas with no scaling. Poki's layouts usually need responsive sizing.
18. **Possibly off-policy footer link.** `index.html:11` links out to another site with `target="_blank"`. Check Poki's rules on outbound links.
19. **No score submission.** `src/net.js` only reads the leaderboard. Nothing posts a score, so `topScores` is always the same static data. Confirm this is intended.

**Low**

20. **Dead asset entry.** `assets/manifest.json:6` lists `sprites.png`, which nothing references, and the manifest itself is never read by code.

## Verification notes

- I confirmed the missing assets by listing `assets/` and running `git status --ignored`. There is no `.gitignore`.
- The line numbers above are from the current files. The game logic in items 7–8 is traced from the code, not run. I did not launch the game or open it in a browser, so the frame-rate and autoplay items are based on reading the code.
- Items 4 and 18 depend on Poki's current policy, which I did not check. Look those up before you rely on them.