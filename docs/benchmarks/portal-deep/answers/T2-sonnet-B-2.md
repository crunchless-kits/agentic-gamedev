# Decision: NO-GO

I read all 12 tracked files. I did not run the game in a browser, so these findings come from the code alone. There are no tests, no build step and no CI, so nothing else vouches for the build. The first four issues are blockers.

## Blockers

1. **The game can fail to start.**
   - `boot()` in `src/main.js:87-94` awaits `initSdk()` and then `fetchTopScores()` before it calls `newRun()` or `loop()`.
   - `src/net.js:3-5` does no error handling. It calls `http://scores.lumengames.example.com/...`, which is a placeholder domain, plain HTTP, and a third-party server.
   - Poki serves games over HTTPS, so the browser will block that request as mixed content. The `fetch` rejects, `boot()` throws, and the player gets a blank canvas.
   - `PokiSDK.init()` (`src/sdk.js:3`) also has no `catch`. Players with an ad blocker would hit the same blank screen, because the SDK rejects there.

2. **The 54.5 MB music file.**
   - `assets/manifest.json:3` lists `music.wav` at 54,525,952 bytes, noted as "full soundtrack, uncompressed".
   - That is far over Poki's initial-download guidance, which I recall as about 8 MB on desktop and less on mobile. Please check the current limit on Poki's site.
   - `src/audio.js:1` creates the `Audio` object at module load, so the download starts immediately.
   - The fix is to compress the soundtrack to OGG or MP3, which is typically a 10–20× reduction. It should also load lazily.

3. **The asset files aren't in the repo.**
   - `git ls-files` shows only `manifest.json` under `assets/`. `music.wav`, `jump.wav`, `gem.wav` and `sprites.png` are missing, so this commit can't produce a complete build.
   - I couldn't confirm the real sizes of the other three files.

4. **The Poki SDK lifecycle is incomplete.**
   - `src/sdk.js` only wraps `init` and `commercialBreak`.
   - There are no `gameLoadingFinished()`, `gameplayStart()` or `gameplayStop()` calls anywhere. Poki requires these, and its review checks them.
   - Audio isn't muted and input isn't paused around ads.
   - `restart()` at `src/main.js:31-34` calls `showAd()` with no try/catch. If the ad call rejects, the run never restarts.

## Other problems to fix before submitting

- **Duplicate input listeners.**
  - `newRun()` calls `bindKeys(jump)` on every restart (`src/main.js:23`), so each restart stacks another `keydown` listener.
  - After one death, a single space press calls `restart()` twice, which means two ad breaks and two `newRun()` calls.
  - Holding space while the game is over re-enters `restart()` during the `await showAd()` window, because `state.over` stays true.
- **Third-party link in the footer.** `index.html:11` links out to `lumengames.example.com/more` with `target="_blank"`. Poki doesn't allow outbound links or branding that pull players away from the portal.
- **Music autoplay.** `startMusic()` (`src/audio.js:5-7`) calls `music.play()` without a user gesture. Browsers reject this, and the rejection is never handled. The music won't play until the player interacts, and there's no mute control.
- **Keys and scrolling.**
  - There is no `preventDefault` for space or the arrow keys, so the host page can scroll while playing.
  - `a`/`d`/`w` are lowercase only, so they stop working with Caps Lock or Shift held.
- **Save data can throw.**
  - `JSON.parse` in `src/save.js:5` has no guard, so a corrupt entry crashes `boot()`.
  - `localStorage` can throw in sandboxed iframes, which is how Poki hosts games.
- **Speed depends on frame rate.** Movement and gravity are fixed per frame (`src/main.js:39-42`), with no delta time. The game runs about 2.4× faster on a 144 Hz display than on 60 Hz.
- **No touch controls and no scaling.** The canvas is a fixed 960×540. Mobile is a large share of Poki traffic.
- **Debug logging.** `console.log("frame", ...)` at `src/main.js:54` runs every frame.

## What is fine

- The SDK script URL (`https://game-cdn.poki.com/scripts/v2/poki-sdk.js`) looks right.
- Ads are only requested at a natural break (after a death).
- The game logic is small and simple.

## Path to GO

Fix items 1–4 first. That means:
- guard the SDK and network calls so boot never blocks on them (or drop the leaderboard);
- compress and lazy-load the audio;
- commit the real assets;
- add the SDK lifecycle calls.

Then fix the listener duplication and the footer link. After that, run a real browser test with an ad blocker on, offline, and on a 144 Hz display. I can make these fixes if you want. I haven't edited anything.