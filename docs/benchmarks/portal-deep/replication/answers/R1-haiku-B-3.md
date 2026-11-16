Audit is done. I didn't edit any files. The working tree is unchanged.

The repo is missing its assets. `assets/` contains only `manifest.json`, so the three sounds the code loads are not in the repo. I also haven't run the game in a browser, and I checked Poki's SDK requirements from memory, not against their current docs. Confirm those before submitting.

## Ranked problems

**Blockers (game may not start or can't be submitted as-is)**

1. **Audio and sprite files are missing from the repo.** `src/audio.js:1` and `:3` load `assets/music.wav`, `jump.wav`, and `gem.wav`, none of which exist. `assets/manifest.json:32` lists `sprites.png`, which doesn't exist and isn't used by any code. Check whether these files are on your machine but not committed, or are actually missing.
2. **A failed leaderboard fetch can prevent the game from starting.** `src/net.js:1` uses `http://` on an unrelated domain (`lumengames.example.com`). A Poki page is served over HTTPS, so the browser will block it as mixed content. `src/main.js:90` awaits that fetch with no try/catch, so `boot()` rejects before `newRun()` and `loop()` run, leaving a black canvas. `net.js:5` also doesn't check `res.ok` or validate the response.
3. **Boot has no error handling, so an SDK or storage failure gives a black screen.** `src/main.js:87-94` has no try/catch. If the Poki script is blocked, `src/sdk.js:99` throws a ReferenceError on `PokiSDK`. `src/save.js:4` can throw in a sandboxed iframe where `localStorage` is disabled, and `save.js:5` calls `JSON.parse` on corrupted data with no try/catch.
4. **No Poki lifecycle calls.** Nothing calls `gameLoadingFinished`, `gameplayStart`, or `gameplayStop`. From my knowledge of the Poki SDK these are required for submission. The natural places are after `boot()` finishes (`src/main.js:87-94`), on start and death (`main.js:26-29`, `:57-62`).
5. **Audio keeps playing during commercial breaks, and tab-hidden is not handled.** `src/main.js:31-34` shows the ad without pausing or muting. `src/audio.js:5-7` starts music and nothing stops it. Poki expects audio muted during ads and when the page is hidden.
6. **Music is 52 MB uncompressed.** `assets/manifest.json:29` lists `music.wav` at 54,525,952 bytes, and `src/audio.js:1` loads it eagerly. Convert it to OGG or MP3 at a much smaller size.
7. **The game is not responsive and has no touch controls.** `index.html:22` fixes the canvas at 960×540 and `style.css:36` does no scaling. `src/input.js:1-11` handles keyboard only, so mobile players, a large part of Poki's traffic, can't play.

**High (bugs that will show up in play)**

8. **Each restart adds another keydown listener, which causes repeated ad calls.** `src/main.js:23` calls `bindKeys(jump)` inside `newRun()`, and `src/input.js:4-7` adds a new listener every time. After N restarts, one press runs `jump()` N times, and when the game is over each call runs `restart()` → `showAd()` (`main.js:26-27`, `:31-34`). Holding space also repeats `keydown`, and `input.js:6` doesn't check `e.repeat`, so a held key can trigger repeated breaks.
9. **A failed ad leaves the game stuck on the game-over screen.** `src/main.js:31-34` awaits `showAd()` with no try/finally, so if it rejects, `newRun()` never runs.
10. **Ad frequency has no limit.** Every death triggers `restart()` → `showAd()` (`main.js:31-34`) with no minimum time between breaks. Check this against Poki's ad rules.
11. **Physics depend on frame rate.** `src/main.js:39-53` moves and accelerates by fixed per-frame amounts with no delta time, so the game runs at different speeds on 60 Hz and 120 Hz displays.
12. **`gameOver()` can run more than once per frame.** `src/main.js:51` and `:53` can both call it in the same frame, and `:60` adds the taken gems to `data.gems` each time. Gems are double-counted when the player touches two storms at once.
13. **Keys stick when the window loses focus.** `src/input.js:8-10` only clears a key on `keyup`. If focus is lost while a key is held, the key stays true, and the player keeps moving.
14. **Space and arrow keys scroll the page.** `src/input.js:6` never calls `preventDefault()`.
15. **Movement keys only work in lowercase.** `src/main.js:39-40` checks `keys.a`/`keys.d` and `input.js:6` checks `"w"`, so Shift or Caps Lock breaks them.
16. **The player can walk off-screen and be lost.** `src/main.js:39-40` doesn't clamp `p.x` to the 0–960 canvas width.
17. **Audio play promises are not caught.** `src/audio.js:6` and `:12` ignore the promises from `play()`. Autoplay is also blocked on a first visit, and `startMusic()` runs at `src/main.js:92` after an await with no user gesture.
18. **The game waits on the leaderboard before drawing.** `src/main.js:90` awaits `fetchTopScores()` before the first frame, and `net.js:4` has no timeout, so the screen stays black for as long as the request hangs.

**Medium / cleanup**

19. **Per-frame `console.log` in the hot loop.** `src/main.js:54` logs every frame. Remove it before submission.
20. **Placeholder external links.** `index.html:23` links to `lumengames.example.com/more` in a new tab, and `src/net.js:1` uses `scores.lumengames.example.com`. Replace or remove both. Poki may not allow links that leave the portal.
21. **`data.best` is not validated.** `src/main.js:59` and `:77` read `data.best` without checking the loaded value (`save.js:5`), so a malformed save can show `undefined` or `NaN`.
22. **Packaging.** `package.json:11` only runs `npx serve`. There is no build step and no `.gitignore`. Poki needs a zip with `index.html` at its root, so confirm the output folder and that no asset is missing from it.

## Next steps

Items 1–4 need fixing before submission. Start with item 1 because the other fixes can't be tested without the audio and sprite files. I can make these changes if you want, but this pass was read-only as you asked.