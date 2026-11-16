I read all 12 tracked files and edited nothing. I didn't run the game, so these come from reading the code. They're ranked by how likely they are to block the Poki submission or break the game.

## Blockers

1. **`assets/manifest.json:3`: the soundtrack is a 54.5 MB uncompressed WAV.** This is far over what Poki accepts for load size and will fail on load time. Encode it as OGG or MP3 at about 1–2 MB, and update `src/audio.js:1` to match.
   - Only `assets/manifest.json` is tracked in git. `music.wav`, `jump.wav`, `gem.wav` and `sprites.png` are missing from the repo, so check they're actually in the build you upload.

2. **`src/net.js:1` and `src/main.js:90`: the game can't start if the leaderboard fetch fails.**
   - The URL is plain `http://` on an `.example.com` host. Browsers block it as mixed content inside Poki's HTTPS iframe.
   - `fetchTopScores()` has no `try/catch` and no `res.ok` check, so any failure rejects `boot()`. `newRun()` and `loop()` never run, and the player sees a blank canvas.
   - Poki also generally disallows calls to your own backend. Remove the leaderboard, or at minimum wrap it so failure is non-fatal.

3. **`src/sdk.js:2` and `src/main.js:88`: the game never starts if `PokiSDK.init()` rejects.** That is what happens with an ad blocker, and Poki expects the game to keep running anyway. Catch the rejection and continue.

4. **`src/sdk.js` and `src/main.js:91`: required SDK lifecycle calls are missing.**
   - There is no `PokiSDK.gameLoadingFinished()` after load.
   - There is no `gameplayStart()` when a run begins.
   - There is no `gameplayStop()` on game over.
   - `commercialBreak()` at `src/main.js:32` has no `beforeCallback` to mute audio and pause. Poki's review checks all of these.

5. **`index.html:11`: the footer has an external "More games" link and branding.** Poki forbids links to other sites and promotion of other portals. Remove the footer.

## Serious bugs

6. **`src/main.js:23`: `bindKeys(jump)` runs on every `newRun()`.**
   - Each restart adds another set of `keydown` listeners.
   - After N restarts, one spacebar press calls `jump()` N times. On the game-over screen, that calls `restart()` N times, so it shows N ads and starts N runs.
   - Move `bindKeys` into `boot()`.

7. **`src/main.js:27` and `src/main.js:31`: nothing stops repeated restarts.** `state.over` stays true while `await showAd()` runs, so extra space presses queue more ads and more `newRun()` calls. Add a "restarting" guard.

8. **`src/main.js:81`: physics are tied to the frame rate.** There is no delta time, so the game runs about 2.4× faster on 144 Hz monitors and slower on weak devices. Use a fixed timestep.

9. **`src/audio.js:6` and `src/audio.js:12`: audio isn't safe to autoplay.**
   - `music.play()` runs from `boot()` with no user gesture. Browsers block that, and the rejected promise is unhandled.
   - `play()` has the same unhandled rejection.
   - Start music on the first input.
   - There is no mute button, which Poki expects.

## Moderate

10. **`src/main.js:51` and `src/main.js:53`: `gameOver()` can run more than once per frame.** If the player touches both storms, or a storm and the pit, `data.gems += ...` at line 60 runs twice and inflates the saved gem total. Return early once `state.over` is set.

11. **`src/save.js:4-10`: `localStorage` access is unguarded.**
    - `getItem` and `setItem` can throw in sandboxed iframes or private mode.
    - `JSON.parse` throws on corrupt data.
    - Any of these crashes boot at `src/main.js:89` or `gameOver()`.
    - Wrap them in `try/catch`, with an in-memory fallback.

12. **`src/main.js:54`: `console.log` runs every frame.** That's 60+ lines per second. Remove it.

13. **`src/input.js:5-9`: keyboard handling has three problems.**
    - Space and the arrow keys don't call `preventDefault()`, so the page scrolls inside Poki's frame.
    - Keys are stored by `e.key`, so `"A"` and `"D"` (Shift or Caps Lock) don't match the `keys.a` and `keys.d` checks in `src/main.js:39-40`, and the player can't move.
    - Keys stay stuck after the window loses focus, for example when an ad shows. Clear `keys` on `blur`.

14. **`index.html:10`: there's no touch or mobile support.** The canvas is a fixed 960×540 with no scaling and no touch controls. There's also no viewport meta tag. Poki is heavily mobile, so expect a rejection or poor placement without this.

## Minor

15. **`index.html:4-8`:** add a viewport meta tag and a `rel="noopener"` attribute (moot if the footer is removed per #5).
16. **`src/main.js:78`:** the game-over text is positioned with hardcoded pixel coordinates and isn't centered.
17. **`package.json`:** the version is 0.9.0, and the `npx serve .` script downloads a package at run time. That's fine for dev, but keep it out of the upload.

Fixing #1–#6 should be the first priority. #6 and #7 are the most likely to be noticed by reviewers, because the ad spam shows up on the second restart.