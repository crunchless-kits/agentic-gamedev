**Decision: NO-GO.** Several problems would fail Poki review or break the game for players. I only read the code and ran no browser test. Every item below comes from the source files.

**Blockers**

1. **The leaderboard can crash the game at startup.**
   - `src/net.js:1` fetches `http://scores.lumengames.example.com/...`. The URL is plain HTTP, and the host is an `.example.com` placeholder.
   - Poki serves games over HTTPS, so the browser blocks the request as mixed content.
   - `boot()` in `src/main.js` awaits `fetchTopScores()` with no try/catch, so any failure rejects and the game never calls `newRun()` or `loop()`. Players would see a blank canvas.
   - Poki also expects games to avoid unneeded external network calls.

2. **The music file is too large.** `assets/manifest.json` lists `music.wav` at 54,525,952 bytes (about 52 MB), noted as "uncompressed". Poki has tight limits on initial download size, and this one file would blow past them. Compressing it to OGG or MP3 should bring it to a few MB.

3. **The footer has an external link.** `index.html` has a "More games" link to `lumengames.example.com` with `target="_blank"`. Poki doesn't allow outbound links or branding that sends players to other sites.

4. **The ad flow doesn't follow Poki's SDK requirements.**
   - `src/sdk.js` never calls `PokiSDK.gameLoadingFinished()` or `gameplayStart()`/`gameplayStop()`. Poki requires these.
   - The only ad is `commercialBreak()` on restart. It has no muting or pausing around the ad and no `.catch`.
   - `initSdk()` has no error handling. If an ad blocker stops the SDK from loading, `PokiSDK` is undefined and the game dies on boot.

**Bugs to fix before submitting**

5. **Audio starts without a user gesture.** `startMusic()` is called straight from `boot()`. Browsers block autoplay, and `music.play()` returns a rejected promise that nothing handles. Music should start after the first key press or click.

6. **`bindKeys(jump)` runs inside `newRun()`.** Every restart adds another set of key listeners. After N restarts one key press fires N jumps, and each one calls `restart()` or `showAd()` again when the game is over. Bind once in `boot()`.

7. **The loop logs every frame.** `console.log("frame", ...)` in `update()` writes about 60 lines per second. Remove it.

8. **Smaller issues**
   - `save.js` has no try/catch around `localStorage` or `JSON.parse`. It throws if storage is blocked in an iframe or the saved data is corrupt.
   - `keys.a` and `keys.d` are never set when Caps Lock is on, because `e.key` would be `"A"` and `"D"`.
   - The README says the Poki script tag "is already in index.html". That's true, but the game still doesn't meet the SDK requirements above.

**What's fine:** the game is small and playable. It has no obvious licensing problems, and the SDK script tag is present.

**To get to GO:** fix items 1–4 and 5–7, then test the game in a browser served over HTTPS with an ad blocker on and off.