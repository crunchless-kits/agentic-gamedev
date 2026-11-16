# Skyhop pre-Poki audit (ranked)

I read every file in the repo and edited nothing. I didn't run the game. Only `assets/manifest.json` exists in `assets/`. The listed `.wav` and `.png` files aren't in the checkout, so I couldn't check them, and the sizes below come from the manifest.

## Likely rejection blockers

1. **`assets/manifest.json:3`: `music.wav` is 54.5 MB of uncompressed audio.** This is far beyond Poki's size guidance, and it blocks loading. Compress it to OGG or MP3 and aim for a few MB. `jump.wav` and `gem.wav` (lines 4–5) should be compressed too.
2. **`src/sdk.js:2-8` and `src/main.js:88`: the SDK integration is incomplete and fragile.**
   - `PokiSDK.init()` rejects when an ad blocker is present, and `boot()` awaits it with no catch. The game never starts for those players. Poki expects the game to run anyway.
   - There are no `gameLoadingFinished()`, `gameplayStart()` or `gameplayStop()` calls. Poki requires them.
   - `commercialBreak()` is called at `main.js:32` without pausing gameplay or muting audio.
3. **`index.html:11`: the footer has an external "More games" link and developer branding.** Poki disallows outbound links and branding. Remove the footer.
4. **`src/net.js:1` and `src/main.js:90`: the game fetches `http://scores.lumengames.example.com/...` and has no error handling.**
   - Plain `http` is blocked as mixed content on Poki's HTTPS pages.
   - Any network failure rejects `fetchTopScores()`, which aborts `boot()`. The game never starts.
   - Poki also generally disallows calls to third-party servers. Remove the leaderboard, or wrap it in try/catch and make it optional.

## Real bugs

5. **`src/main.js:23`: `bindKeys(jump)` runs inside `newRun()`, so each restart adds another set of key listeners.** After N restarts, one keypress fires `jump()` N times. At game over, that means multiple `restart()` calls and multiple ads.
6. **`src/main.js:27-33`: nothing stops `restart()` from running more than once.** `state.over` stays true while `await showAd()` is pending, so every keypress during the ad queues another `newRun()` and another ad. Add a "restarting" guard.
7. **`src/audio.js:6` and `:12`: `play()` results are never handled.**
   - `startMusic()` runs at the end of the async `boot()`, outside any user gesture. Browsers block it, and the rejected promise goes unhandled.
   - Start the music on the first keypress instead.
   - Also add a mute control, and mute the audio during ads.
8. **`src/main.js:81-85`: physics advance once per `requestAnimationFrame` call, with no delta time.** The game runs 2.4 times faster on a 144 Hz monitor. Use a fixed timestep.
9. **`src/main.js:51-53`: `gameOver()` can run more than once in a frame.** `update()` doesn't stop after the first call, so overlapping both storms, or a storm plus a fall, adds `data.gems` twice and saves twice. Return after the first call.

## Polish and robustness

10. **`src/main.js:54`: `console.log` runs every frame.** Remove it.
11. **`src/input.js:5`: no `preventDefault()` on Space or the arrow keys.** In Poki's iframe the page can scroll while you play. The check is also case-sensitive, so `"W"` with Caps Lock or Shift doesn't jump, and `main.js:39-40` has the same problem with `keys.a` and `keys.d`. Use `e.code`.
12. **`src/save.js:4-9`: `JSON.parse` and `localStorage` have no try/catch.** Corrupt or blocked storage (third-party iframe, private mode) throws and kills `boot()`. Fall back to defaults.
13. **`index.html:10` and `style.css:2`: the canvas is a fixed 960×540 and doesn't scale.** It overflows on small windows and mobile. Poki wants the game to fit any viewport.
14. **`src/input.js:6`: key auto-repeat re-fires `onJump`.** Holding Space at game over triggers a restart immediately.
15. **`package.json:6`: `npx serve .` is the only script, and there's no build or zip step.** Poki wants a zipped build, and `README.md` and `package.json` shouldn't ship in it.

If you'd like, I can fix items 1–9 next.