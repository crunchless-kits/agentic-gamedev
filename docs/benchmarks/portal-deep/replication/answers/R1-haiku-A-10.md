I didn't edit anything. The tree has 12 tracked files and the work is about 160 lines of JS. The biggest blockers are the missing audio assets and a boot sequence that stops the game if the leaderboard or SDK is unreachable. I haven't run the game in a browser or checked these against Poki's current submission rules, so treat the Poki-policy items as things to confirm.

**Ranked problems**

1. **Audio files are missing from the repo.** `src/audio.js:1-3` loads `assets/music.wav`, `jump.wav`, and `gem.wav`, but only `assets/manifest.json` is tracked. Music never plays and sounds fail. Add the files, and check that `manifest.json` matches what you ship.

2. **Soundtrack is too large.** `assets/manifest.json:15` lists `music.wav` at 54,525,952 bytes, uncompressed. Re-encode it to OGG or MP3 and check the size against Poki's requirements.

3. **Boot stops if the network or SDK fails.** `src/main.js:87-94` awaits `initSdk()` and `fetchTopScores()` with no `try/catch`. If either rejects, `newRun()` and `loop()` never run and the canvas stays blank. Wrap them and let the game start anyway.

4. **Leaderboard uses plain HTTP on an HTTPS host.** `src/net.js:1` fetches `http://scores.lumengames.example.com/...`. Poki serves games over HTTPS, so the browser will block this as mixed content. The `.example.com` host is also a placeholder, so this is probably not a real endpoint.

5. **Placeholder external link.** `index.html:11` points to `https://lumengames.example.com/more` with `target="_blank"`. Poki generally restricts "more games" links out of the game, and this URL does not resolve. Remove it or replace it with a compliant link.

6. **Ad and key-listener bugs.**
   - `src/main.js:23` calls `bindKeys(jump)` inside `newRun()`, and `src/input.js:3-10` adds new `keydown`/`keyup` listeners every time. After N restarts, each press fires `jump()` N+1 times.
   - `src/main.js:27-34`: `restart()` awaits `showAd()` without a guard. Pressing space again while the ad is open calls `restart()` again, which can trigger a second commercial break.

7. **Missing Poki gameplay events and audio muting.** `src/sdk.js:6-7` only calls `commercialBreak()`. Nothing calls `gameplayStart()` or `gameplayStop()`, and `src/main.js:92` plays music during ads with no mute. Poki's SDK expects those calls and muting around ads. This is from memory, so confirm against their docs.

8. **Double-counted gems and game-over in one frame.** `src/main.js:51` and `:53` can each call `gameOver()` in the same frame. `gameOver()` at `src/main.js:57-62` then adds `state.gems.filter(...)` to `data.gems` again, so overlapping storms or falling off the screen can inflate the total.

9. **Per-frame console logging.** `src/main.js:54` logs every frame. It slows the game and clutters the console.

10. **Corrupt save data crashes boot.** `src/save.js:5` calls `JSON.parse` on whatever is in localStorage with no guard. A bad value throws and stops startup. Wrap it in `try/catch` and fall back to the defaults.

11. **Unhandled audio promise rejections.** `src/audio.js:6` and `:12` ignore the promise from `play()`. Autoplay restrictions reject it, which produces console errors. Catch the rejection.

12. **Arrow keys and space scroll the page.** `src/input.js:4-6` never calls `preventDefault()`, so space and arrows can scroll the page while playing.

13. **Keys stick after focus loss.** `src/input.js:8-10` only clears a key on `keyup`. If the window loses focus while a key is held, the key stays "down". Clear `keys` on `blur`.

14. **Jump and move keys are case-sensitive.** `src/input.js:6` checks only lowercase `"w"`, and `src/main.js:39-40` checks only lowercase `a` and `d`. Caps Lock or Shift breaks the controls.

15. **Fixed-size canvas.** `index.html:10` hard-codes 960×540 and `style.css:22` centers it with no scaling. On smaller or wider Poki viewports it will not fit well.