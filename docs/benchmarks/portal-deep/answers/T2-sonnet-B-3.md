**Decision: NO-GO.** The build isn't ready to submit to Poki. I read the whole repo (11 tracked files) and didn't run the game.

**Blockers**

1. **The asset files are missing.** `assets/` holds only `manifest.json`. `music.wav`, `jump.wav`, `gem.wav` and `sprites.png` aren't there, though `src/audio.js` loads three of them. Audio would fail to load, which `src/audio.js` doesn't handle. I couldn't check the sprite file, since nothing in `src/` references it.
2. **The music is 54.5 MB of uncompressed WAV.** `assets/manifest.json` lists `music.wav` as 54,525,952 bytes, "full soundtrack, uncompressed". That is far too heavy for a web-portal initial load. It needs compressing to OGG or MP3 and probably trimming or lazy-loading.
3. **The Poki SDK is wired up incorrectly.**
   - There is no `PokiSDK.gameLoadingFinished()` call and no `gameplayStart()` or `gameplayStop()`. Poki expects these. `src/sdk.js` and `src/main.js` only call `init` and `commercialBreak`.
   - `initSdk()` has no error handling. If an ad blocker blocks the SDK script, `PokiSDK` is undefined and `boot()` throws, so the game never starts. Poki's docs say to continue the game when init fails.
   - `restart()` awaits `showAd()`. The break is also fired when the game ends, but nothing signals gameplay has stopped.
4. **Input is broken after a restart.**
   - `newRun()` calls `bindKeys(jump)` every time. Each restart adds another pair of keydown and keyup listeners, so after N restarts one key press fires `jump()` N times.
   - The listener bound at boot calls `jump()` on game over, which runs `restart()`. Each stacked listener then runs `restart()` again, and each one awaits an ad. That means multiple ad breaks and several runs started at once.
5. **The game fails if the network is down or blocked.** In `boot()`, `fetchTopScores()` is awaited, and `src/net.js` fetches `http://scores.lumengames.example.com/...`. That URL is plain HTTP (mixed content on an HTTPS portal) and on a placeholder `.example.com` domain. A failed fetch or a non-JSON response throws, `boot()` rejects, and the game never starts. Poki also generally forbids calls to external services.
6. **An external "More games" link in the footer.** `index.html` links to `lumengames.example.com`. Poki doesn't allow outbound promotion or links to other sites.

**Should fix before submitting**

- `src/main.js` has `console.log("frame", ...)` in `update()`. It logs every frame, about 60 lines per second.
- `startMusic()` is called at boot with no user gesture. Browsers block autoplay, so `music.play()` rejects. Nothing handles the error and there's no mute control. Sound should start only after the first input.
- `load()` in `src/save.js` calls `JSON.parse` with no try/catch. Corrupt data would crash boot. `localStorage` can also throw in sandboxed iframes, which is how Poki embeds games.
- The canvas is a fixed 960×540. There's no scaling for different embed sizes and no mobile or touch input.
- `README.md` says the SDK script tag is already in `index.html`. It is, but the SDK usage above is incomplete.

**What looks fine**

- The game logic is small and self-contained, with no obvious gameplay bug.
- The SDK script tag is the right v2 URL.

Fix items 1–6 first, then re-check. The audio and SDK-failure fixes are the most important. I haven't edited any files.