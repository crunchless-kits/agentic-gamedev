I read all 12 tracked files. I didn't edit anything, and I didn't run the game. Everything below comes from reading the code.

## Ranked problems

**Blockers (likely rejection or a broken game)**

1. **A failed leaderboard fetch stops the game from starting.** `src/main.js:90` awaits `fetchTopScores()`, and `src/net.js:3-5` has no try/catch and no `res.ok` check. The URL at `src/net.js:1` is plain `http://` on an `.example.com` host, so it will fail in production. That is mixed content under Poki's HTTPS, and Poki generally doesn't allow calls to your own server. The rejection stops `boot()` before `newRun()` and `loop()`, so the player gets a blank canvas. Remove the call or wrap it in a try/catch that falls back to `[]`.

2. **The Poki SDK integration is incomplete and fragile.**
   - `src/sdk.js:2-3` doesn't catch `PokiSDK.init()` rejecting, which is what happens with an ad blocker. `src/main.js:88` awaits it, so the game never starts for those players. Poki expects the game to run anyway.
   - There are no `PokiSDK.gameLoadingFinished()`, `gameplayStart()` or `gameplayStop()` calls anywhere. Poki requires them.
   - `src/sdk.js:6-7` calls `commercialBreak()` with no mute or pause around the ad. Audio should be silenced and input blocked during it.

3. **The download is far too large.**
   - `assets/manifest.json:3` lists `music.wav` at 54,525,952 bytes (about 52 MB, uncompressed). Poki's size guidance is a few MB for the initial load. Convert it to OGG or MP3, which should be under 2 MB, and stream or lazy-load it.
   - `src/audio.js:1` loads it eagerly at module import.
   - None of the four files in the manifest are tracked in git. Check that they exist in the build you upload.

4. **There is an external "More games" link and branding.** `index.html:11` links to `lumengames.example.com` with `target="_blank"`. Poki rejects outbound links and cross-promotion. Remove the whole footer.

**Serious bugs**

5. **Restarting piles up key listeners.** `src/main.js:23` calls `bindKeys(jump)` inside `newRun()`. Every restart adds another pair of `window` listeners (`src/input.js:4,8`). After N deaths one keypress fires `jump` N times, so each press during game over triggers several `restart()` calls. That means several `showAd()` calls and several `newRun()` calls. Bind once in `boot()`.

6. **Restart can fire repeatedly during an ad.** `src/main.js:27` and `src/main.js:31-34` leave `state.over` true while `await showAd()` runs. Held-key repeats, or any keypress, call `restart()` again and request more ads. Add a "restarting" guard. Also, space on the death screen restarts instantly, so a player still pressing jump skips the game-over screen.

7. **Music and sound errors are unhandled, and there's no mobile/browser audio handling.**
   - `src/audio.js:6` calls `music.play()` at boot, before any user gesture. Browsers block this and the promise rejects unhandled.
   - `src/audio.js:12` has the same problem for sounds.
   - There is no mute toggle and no pause when the tab loses focus. Poki expects both.

8. **There is no touch or mobile input.** `src/input.js` handles only the keyboard, and the canvas in `index.html:10` is a fixed 960×540 that doesn't scale. There is also no viewport meta tag. Poki lists mobile as a major traffic share. At minimum, add touch controls and scale-to-fit.

9. **Arrow keys and space scroll or focus the page.** `src/input.js:5-7` has no `preventDefault()`, so inside Poki's iframe the page will scroll on space and the arrow keys.

**Medium**

10. **Movement is tied to the frame rate.** `src/main.js:36-55` and `src/main.js:81-85` advance a fixed step per `requestAnimationFrame`. The game runs about 2.4× faster on a 144 Hz display than on 60 Hz. Use a delta-time or fixed-timestep loop.

11. **A `console.log` runs every frame.** `src/main.js:54` logs on every frame. Remove it. It costs performance and clutters the console.

12. **Saving and loading can crash.**
    - `src/save.js:4-5` calls `JSON.parse` with no try/catch. A corrupt or old save throws and stops boot.
    - `src/save.js:9` writes to `localStorage`, which can throw when storage is blocked in an iframe or private mode. Wrap both calls.
    - A save without `best` or `gems` would produce `NaN`.

13. **`gameOver()` can run more than once in a frame.** `src/main.js:51` runs inside the storms loop, and `src/main.js:53` follows it. If the player overlaps both storms, or hits a storm and falls off in the same frame, `data.gems` at `src/main.js:60` is counted twice. Return early if `state.over` is already set.

**Minor**

14. **The player isn't clamped horizontally.** `src/main.js:39-40` lets the player walk off-screen left or right.

15. **Key handling is case-sensitive and the jump key doesn't match the README.**
    - `src/main.js:39-40` and `src/input.js:6` compare `e.key` to lowercase `"a"`, `"d"` and `"w"`. With Caps Lock or Shift held, WASD stops working. Use `e.code`.
    - The README says space jumps, and the code does that, but `ArrowUp` and `w` also jump.

16. **The metadata is rough.** `package.json:3` is version `0.9.0`, and `assets/sprites.png` is listed in the manifest but nothing uses it, so drop it from the build. `README.md:5` tells readers the SDK script tag is "already in", but it is loaded from a hard-coded URL in `index.html:7`. Poki's guidelines may ask for a specific SDK loading approach, so check them.

If you want, I can fix these in order, starting with 1 through 6.