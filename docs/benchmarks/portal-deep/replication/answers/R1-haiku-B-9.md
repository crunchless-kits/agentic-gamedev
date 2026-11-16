Audit of Skyhop (`5cc6bbd`, 12 tracked files, about 200 lines of JS). I read every source file and didn't edit anything. I couldn't run the game, because the audio and sprite files it loads aren't in the repo. I also didn't check Poki's current policy text, so the SDK rules below come from my knowledge of their SDK and should be confirmed against their docs.

**Ranked problems**

1. **Blocker: referenced assets are missing.** `assets/music.wav`, `jump.wav`, `gem.wav` and `sprites.png` are not in the repo (only `assets/manifest.json` exists). `src/audio.js:1,3` loads files that aren't there, so there's no sound. Add them, or confirm they're uploaded separately.

2. **Blocker: ads stack up after each death.** `src/main.js:23` calls `bindKeys(jump)` inside `newRun()`, and `newRun()` runs again on every restart (`src/main.js:33`). `bindKeys` (`src/input.js:3-7`) adds a new `keydown` listener each time, and nothing removes the old ones. After N deaths, one space press fires `restart()` N+1 times, so N+1 `commercialBreak` calls are queued. Fix: bind the listener once at boot and guard `restart()` with a flag.

3. **Blocker: Poki SDK integration is incomplete.** `src/sdk.js` only wraps `init` and `commercialBreak`. Missing: `PokiSDK.gameLoadingFinished()` after boot (`src/main.js:87-94`), `gameplayStart()` when a run begins (`src/main.js:13-24`), and `gameplayStop()` on game over (`src/main.js:57-62`). Poki reviews these calls.

4. **Blocker: no audio mute or pause during commercial breaks.** `src/main.js:31-34` and `src/sdk.js:6-8` show the ad with no mute or pause of music or game state. Poki requires both during ads. Fix: mute the audio module around `showAd()`.

5. **Boot can fail completely.** `src/main.js:88-90` awaits `initSdk()` and `fetchTopScores()` with no `try/catch`. If the leaderboard request fails, `boot()` rejects and the game never starts. `src/sdk.js:3` also throws if `PokiSDK` is undefined, which happens if the CDN script at `index.html:7` fails to load. Add fallbacks so the game still runs without the leaderboard or the SDK.

6. **Leaderboard uses plain HTTP and a placeholder domain.** `src/net.js:1` fetches `http://scores.lumengames.example.com/...`. Browsers block HTTP from an HTTPS page, and `.example.com` is a placeholder domain. `src/net.js:4-5` also doesn't check `res.ok`. Replace with an HTTPS production URL, or remove the call before submitting. Also confirm Poki allows external network calls at all.

7. **Gems and score can be counted twice on death.** `gameOver()` (`src/main.js:57-62`) can run more than once in the same frame. It can be called from the storm loop (`src/main.js:51`) for each overlapping storm, and again from the fall check (`src/main.js:53`). Each call adds the taken gems to `data.gems` and saves. Fix: return early if `state.over` is already true.

8. **Unguarded localStorage.** `src/save.js:4-5` calls `JSON.parse` on whatever is stored with no `try/catch`, so a corrupt save throws on boot. `src/save.js:4,9` also throw when storage is blocked, which Poki's iframe can cause. Wrap both in `try/catch`.

9. **Debug logging left in the loop.** `src/main.js:54` logs every frame (`console.log("frame", ...)`). This spams the console and costs performance. Remove it.

10. **No touch controls.** `src/input.js:1-11` handles keyboard only, and nothing maps touch or pointer input. The game can't be played on phones, which Poki's audience uses heavily. Add tap-to-jump and on-screen left/right controls.

11. **External "More games" link in the footer.** `index.html:11` opens `lumengames.example.com` in a new tab. Poki generally doesn't allow links that send players off-portal. Remove it or check it against Poki's rules. The `example.com` domain is also a placeholder.

12. **Unhandled audio promise rejections.** `src/audio.js:6` (`music.play()`) runs at boot before any user gesture, so browser autoplay policy rejects it. `src/audio.js:12` has the same problem for jump and gem sounds. Neither promise is handled, so the console fills with errors. Catch them, and start music on the first user input.

13. **Oversized music file.** `assets/manifest.json:3` lists `music.wav` at 54.5 MB, uncompressed. Re-encode it as OGG or MP3 (a few MB) to keep the Poki package small and loads quick.

14. **Physics depends on frame rate.** Movement and gravity are per-frame, not per-second (`src/main.js:39-53`). On a 120 Hz or 144 Hz display the game runs faster. Multiply by a delta-time value.

15. **No viewport handling; fixed 960×540 canvas.** `index.html:2-5` has no viewport meta tag, and `index.html:10` and `style.css:2` fix the canvas size. On phones and small windows it won't scale to fit. Add the viewport meta and scale the canvas to the window.

16. **Player can leave the screen horizontally.** `src/main.js:39-40` has no clamp on `p.x`, so the player can walk off either edge.

17. **Keys can stick after focus loss.** `src/input.js:8-10` only clears keys on `keyup`. If the window loses focus while a key is held, the key stays "down" and the player keeps moving. Clear `keys` on `blur`.

18. **Holding space re-triggers jump and restart.** `src/input.js:6` fires `onJump` on every key-repeat event. Holding space on the game-over screen restarts the run and queues ads (this is what makes problem 2 worse). Ignore `e.repeat`.

19. **Leaderboard data is used without checks.** `src/main.js:77` reads `topScores[0]?.score` directly from the network response. If the response has a different shape, the HUD shows the wrong value or nothing.

**Smaller items:** no favicon (`index.html` has none), so the browser requests a 404. `src/main.js:77` shows "Top" from the leaderboard, but a run's score is never submitted, so the leaderboard is read-only.

Suggested order: 1–4 first (they break the Poki review or the basic game), then 5–8, then the rest.