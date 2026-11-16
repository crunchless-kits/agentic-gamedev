Audit of Skyhop for Poki submission. I read all 11 tracked files and edited nothing.

## Ranked problems

**Blockers (likely rejection or a broken game)**

1. **The game won't start if the leaderboard fetch fails.** `src/net.js:3-5` and `src/main.js:90`
   - `fetchTopScores()` has no try/catch, and `boot()` awaits it before `newRun()` and `loop()`. A failed fetch leaves a blank canvas.
   - The URL is `http://scores.lumengames.example.com/...` (`src/net.js:1`). That host is a placeholder, so the fetch will fail. It is also plain HTTP, which is blocked as mixed content on an HTTPS page.
   - Poki also generally disallows calls to external servers. Remove the leaderboard, or wrap it in try/catch and don't block boot on it.

2. **The music file is 54.5 MB.** `assets/manifest.json:3` and `src/audio.js:1`
   - It's an uncompressed WAV, far over Poki's initial-download budget, and it hurts load time.
   - Convert it to OGG/MP3 at roughly 1–2 MB and stream it.

3. **The Poki SDK lifecycle is incomplete.** `src/sdk.js`, `src/main.js:87-94`
   - `gameLoadingFinished()` is never called, so Poki can't measure load time.
   - `gameplayStart()` is never called, and `gameplayStop()` is not called in `gameOver()` (`src/main.js:57`). Poki requires both.
   - `src/sdk.js:3` calls `PokiSDK.init()` with no `.catch`. If an ad blocker blocks the SDK script, `PokiSDK` is undefined or the promise rejects, and the game never boots. The usual pattern is `init().catch(() => {})`, then continue.

4. **Audio autoplay is not handled.** `src/audio.js:6,12` and `src/main.js:92`
   - `startMusic()` runs at boot with no user gesture, so browsers reject `music.play()`. That throws an unhandled promise rejection, and music never starts.
   - Start the music on the first key press or click. Add `.catch()` to `play()` calls.

5. **External outbound link in the footer.** `index.html:11`
   - Poki rejects links to other sites and "more games" promotion. Remove the footer link.

**Major bugs**

6. **`bindKeys` is called on every restart, so key listeners stack up.** `src/main.js:23`
   - After N restarts there are N+1 `keydown` handlers, each calling `jump()`. Bind once in `boot()`.

7. **The restart flow has bugs.** `src/main.js:26-34`
   - Holding or mashing space while dead calls `restart()` repeatedly, which queues multiple ads and multiple `newRun()` calls.
   - `state.over` stays true during the ad, so the game is frozen with no feedback. Add a "restarting" guard.
   - A commercial break is shown after every death with no gameplay in between. Poki restricts how often you can call it.

8. **Gameplay is not stopped for ads, and sound is not muted during them.** `src/main.js:32`
   - Poki requires the game to pause and mute while an ad plays.

9. **Gameplay runs at a frame-rate-dependent speed.** `src/main.js:81-85`
   - The update uses fixed per-frame increments, with no delta time. On 120/144 Hz monitors the game runs 2–2.4× faster.

10. **The game is not focus-aware.** `src/input.js`, `src/main.js`
    - Keys are stuck down after alt-tab, because `keyup` is never received. There is no blur reset and no pause when the tab is hidden.
    - Arrow keys and space aren't `preventDefault`ed, so the page scrolls in the iframe.

**Moderate**

11. **Debug logging every frame.** `src/main.js:54`
    - `console.log("frame", ...)` runs at 60 fps. Remove it.

12. **Save data can crash the game.** `src/save.js:3-10`
    - `localStorage` can throw in sandboxed iframes or with third-party cookies blocked.
    - `JSON.parse` throws on corrupt data.
    - An old save missing `best` or `gems` yields NaN.
    - Wrap these in try/catch. Poki also offers its own storage options.

13. **Sound effects fail or stutter.** `src/audio.js:9-13`
    - An unknown `name` throws, and `s.play()` returns a rejected promise.
    - A single `Audio` element per effect cuts off overlapping sounds.

14. **Keyboard handling is inconsistent.** `src/input.js:6`, `src/main.js:39-40`
    - `e.key === "w"` is case-sensitive, so Caps Lock or Shift breaks it.
    - `keys.a` and `keys.d` have the same problem.
    - There is no touch or mobile control. Poki expects mobile support, or the game must be flagged desktop-only.

15. **Collision is fragile.** `src/main.js:45`
    - The player can walk off the sides of the screen, because x is never clamped.
    - Thin islands and a high `vy` can tunnel through. The landing check is weak.

**Minor**

16. **No loading or start screen.** `src/main.js:87-94`
    - The game starts immediately. Poki prefers a play-button gate, which also solves the audio gesture problem (#4).

17. **The canvas is fixed at 960×540.** `index.html:10`, `style.css:2`
    - It isn't scaled to the iframe, so it will be cropped or letterboxed on small screens.

18. **Missing assets and metadata.** `assets/manifest.json:6`
    - `sprites.png` is listed but never used. Wasted 412 KB, or the art is missing.
    - There is no favicon, and the HTML has no viewport meta tag.

19. **`package.json` and README housekeeping.**
    - The `package.json` version is 0.9.0.
    - The README says the SDK script tag is "already in index.html". It is, but the script URL should be verified against Poki's current docs.

I didn't run the game, so these come from reading the code. #1, #3 and #4 are the most likely to cause a black screen on first load. Fix those first, then #2 and #5 for review approval.