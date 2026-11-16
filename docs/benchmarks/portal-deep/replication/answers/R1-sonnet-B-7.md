I read all 12 tracked files, so this audit covers the whole repo. I didn't run the game. I changed no files.

## Ranked problems

**Blockers (the game can fail to start, or breaks Poki's rules)**

1. **A failed network call stops the game from booting.** `src/main.js:90` awaits `fetchTopScores()` with no `try/catch`. `src/net.js:3-5` calls `fetch` on `http://scores.lumengames.example.com/...`. That URL is plain `http` from an HTTPS portal iframe, so it is blocked as mixed content. It is also an `.example.com` placeholder and doesn't resolve. `fetch` rejects, so `boot()` dies and `newRun()` and `loop()` never run. Players get a blank canvas. Wrap the call in a `try/catch` that falls back to `[]`. For Poki, I'd drop the external leaderboard entirely.
2. **The game crashes if the Poki SDK is blocked.** `src/sdk.js:3` and `src/sdk.js:7` call `PokiSDK` directly, and `src/main.js:88` awaits it. Ad blockers block the SDK script (`index.html:7`). Then `PokiSDK` is undefined, `initSdk` throws, and the game never starts. `showAd` throws the same way on restart. Guard both calls and always continue. Poki's own docs show `init().then(...).catch(...)` for this reason.
3. **The Poki lifecycle calls are missing.** `src/sdk.js` only wraps `init` and `commercialBreak`. There is no `gameLoadingFinished()`, `gameplayStart()` or `gameplayStop()` anywhere. The README says the SDK is "already" integrated, but this is the part Poki reviews. Call `gameplayStart` on the first input and on each restart. Call `gameplayStop` in `gameOver()` at `src/main.js:57`, and call it before the ad.
4. **The 52 MB uncompressed music file.** `assets/manifest.json:3` lists `music.wav` at 54,525,952 bytes, loaded at `src/audio.js:1`. That is far over Poki's initial-download guidance and will hurt load time and mobile. Convert it to OGG or MP3 (about 1–2 MB) and stream it. The WAV files aren't tracked in git, so the manifest is the only evidence of them (see item 16).
5. **Music autoplays before any user input.** `src/main.js:92` calls `startMusic()` at boot, and `src/audio.js:6` doesn't handle the rejected promise. Browsers block this. That causes an unhandled rejection, and Poki also forbids audio before the first interaction. Start music on the first key or click.
6. **The audio isn't muted during ads.** `src/main.js:32` runs `showAd()` while the music keeps playing. Poki requires muting and pausing during a commercial break. Add mute/unmute around the ad.
7. **An external link and branding in the footer.** `index.html:11` links to `lumengames.example.com` with `target="_blank"`. Poki doesn't allow outbound links or cross-promotion in the game. Remove the footer.

**Serious bugs**

8. **Listeners pile up on every restart, so each restart shows more ads.** `src/main.js:23` calls `bindKeys(jump)` inside `newRun()`. After the first restart there are two `keydown` handlers, then three, and so on. `jump()` also doesn't guard against re-entry, because `state.over` stays true during `await showAd()` (`src/main.js:27-34`). Pressing space during game over can trigger several ads and several `newRun()` calls. Bind keys once in `boot()`. Add a `restarting` flag.
9. **Speed depends on frame rate.** `src/main.js:36-55,81` moves by a fixed amount per `requestAnimationFrame`. On a 120 or 144 Hz display the game runs 2–2.4× faster, and gravity, jumps and storms all change. Use a fixed timestep or a delta-time multiplier.
10. **Keyboard input is fragile.** `src/input.js:5-9`:
    - It never calls `preventDefault()`, so space and the arrow keys scroll the page inside the portal iframe.
    - It stores `e.key` as-is, so Caps Lock or Shift turns `a` into `A` and movement stops (`src/main.js:39-40` checks lowercase `a` and `d` only).
    - Keys never clear on blur, so a key held while the tab loses focus stays stuck.
    - Auto-repeat fires `onJump` repeatedly while a key is held.
11. **There is no touch or mobile support.** Poki lists mobile as a major audience. There are no touch or pointer handlers (`src/input.js`), and the canvas is a fixed 960×540 (`index.html:10`) with no scaling to the viewport (`style.css:2`).
12. **The save code can throw.** `src/save.js:4-9`:
    - `JSON.parse` on corrupt data throws.
    - `localStorage` can throw in a sandboxed iframe or with third-party storage blocked.
    - A throw in `load()` is another way `boot()` dies (`src/main.js:89`).
    
    Wrap both functions in `try/catch` and fall back to defaults. Poki also offers its own storage options.

**Polish and cleanup**

13. **`console.log` runs every frame.** `src/main.js:54` logs about 60 lines per second. Remove it.
14. **Sound effects don't handle `play()` rejections.** `src/audio.js:9-12` sets `currentTime` and calls `play()` with no catch. There is also no mute toggle and no pause when the tab is hidden (`visibilitychange`).
15. **The player isn't bounded horizontally.** `src/main.js:39-40` lets the player walk off-screen left or right with no clamp. The game only ends when `p.y > 560` (`src/main.js:53`).
16. **The assets aren't in the repo.** `git ls-files` shows only `manifest.json`. `assets/*.wav` and `sprites.png` are missing, and nothing loads `sprites.png`. Either the assets are untracked, which risks a bad submission build, or the manifest is stale. There is also no build or zip step. `package.json:6` only runs `npx serve .`.
17. **Gems and best score are saved only at game over.** `src/main.js:57-62` saves only when the run ends. Closing the tab mid-run loses the gems collected. The 560 px fall check also has no margin for a different canvas size.

I'd fix 1–3 first, since the game likely doesn't load for a good share of players. Then do 4–8 before submitting. Items 9–12 are what a Poki QA tester is likely to catch.