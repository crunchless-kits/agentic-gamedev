I read every file in the repo and didn't run the game. I found nothing to confirm in the visuals or at runtime, so these are static findings. I didn't edit anything.

## Ranked problems

**Blockers (fix before submitting)**

1. **`assets/manifest.json:3`: the music file is 54.5 MB of uncompressed WAV.** That is far over Poki's initial-download budget, and it loads eagerly from `src/audio.js:1`. Convert it to OGG or MP3 (roughly 2–4 MB) and lazy-load it. Also, none of the files the manifest lists are in the repo. The `assets/` folder holds only `manifest.json`, so make sure the real assets get bundled.
2. **`src/net.js:1` and `src/main.js:90`: an external HTTP leaderboard blocks boot.**
   - The URL is `http://`, which is blocked as mixed content on Poki's HTTPS pages. Poki also disallows calls to your own servers.
   - `fetchTopScores()` has no `try/catch`. When the request fails, `boot()` throws before `newRun()` and `loop()` run, so the player gets a blank canvas.
   - Remove the leaderboard, or at minimum catch the error and continue without it. The `Top` readout at `main.js:77` would go too.
3. **`src/sdk.js:1-8`: the Poki SDK integration is incomplete.**
   - There are no `PokiSDK.gameLoadingFinished()`, `gameplayStart()` or `gameplayStop()` calls. Poki requires them. Call `gameplayStart` on the first input and on each restart, and `gameplayStop` in `gameOver()` (`main.js:57`).
   - `PokiSDK` is a bare global with no guard. An ad blocker blocks the script tag at `index.html:7`, and then `initSdk()` throws a `ReferenceError`, so the game never starts. Wrap the calls in `try/catch` and make the wrapper a no-op when the SDK is missing.
   - `commercialBreak()` at `main.js:32` should mute the audio first and unmute it after. Poki requires this.
4. **`index.html:11`: the footer has an external "More games" link and "Made by Lumen Games" branding.** Poki rejects outbound links and cross-promotion. Remove the footer.

**Bugs that hurt gameplay or ads**

5. **`src/main.js:23`: `bindKeys(jump)` runs inside `newRun()`.** Every restart adds another pair of window listeners.
   - After N restarts, one space press fires `jump()` N times.
   - Because `jump()` calls `restart()` when the run is over, this can trigger several ad breaks and several `newRun()` calls from one key press.
   - Bind the keys once, in `boot()`.
6. **`src/main.js:27` and `src/main.js:31-34`: nothing guards `restart()` against re-entry.** `state.over` stays true while the ad plays. Any key press during that time, including key-repeat, starts another ad request. Add a `restarting` flag.
7. **`src/audio.js:6` and `src/audio.js:12`: `music.play()` and `s.play()` return promises that are never handled.**
   - Browsers reject them without a user gesture, and `startMusic()` is called from `boot()` before any input. The music may never start, and you get unhandled-rejection errors.
   - Start the music on the first key press or click, and add `.catch(() => {})`.
   - Re-triggering one shared `Audio` element with `currentTime = 0` also cuts off overlapping sounds.

**Poki quality requirements**

8. **`src/input.js:4-7`: the game never calls `preventDefault()`.** Space and the arrow keys scroll the page inside Poki's iframe. Also, `"w"`, `"a"` and `"d"` are matched case-sensitively, so they stop working when Caps Lock or Shift is on. Normalize with `e.key.toLowerCase()`, or use `e.code`. Held-key repeat also re-fires `onJump`, so ignore `e.repeat`.
9. **`src/main.js:41-42`: physics is tied to the display refresh rate.** Gravity and movement step once per `requestAnimationFrame`. On a 120/144 Hz monitor the game runs about 2× faster than at 60 Hz. Use a fixed timestep or scale by delta time.
10. **`src/save.js:4-9`: `localStorage` access and `JSON.parse` are unguarded.** Storage can throw in a third-party iframe when the browser blocks storage, and a corrupted save throws on parse. Either one crashes `boot()` at `main.js:89`. Wrap them in `try/catch` and fall back to defaults.
11. **`src/main.js:54`: `console.log("frame", ...)` runs every frame.** This is leftover debug output that floods the console and costs performance. Remove it.

**Polish**

12. **`index.html:10` and `style.css:2`: the canvas is a fixed 960×540.** It doesn't scale to the Poki iframe or to mobile, and there is no touch input at all. Poki expects the game to fit any viewport, and most of its traffic is mobile.
13. **No pause or blur handling.** The game keeps running and the music keeps playing when the tab loses focus. Add a `visibilitychange` handler that pauses and mutes.
14. **`src/main.js:77-78`: the game-over text is drawn at a hard-coded x-position (380).** The "Press space" prompt also doesn't make sense for mobile or touch players.

I can fix these in order when you're ready. Items 2, 3, 5 and 6 are the ones most likely to fail Poki's review or break the game on launch.