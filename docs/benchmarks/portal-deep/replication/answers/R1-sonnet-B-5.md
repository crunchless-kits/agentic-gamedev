# Audit: Skyhop (v0.9.0)

**Stack:** plain JavaScript with ES modules, no bundler, no TypeScript, no lockfile. The TypeScript and lockfile checks don't apply.
**Build:** there is no build step. `package.json:6` only runs `npx serve .`. I didn't run the game in a browser. Everything below comes from reading the code.

## Ranked problems to fix

1. **[blocker] A failed leaderboard fetch stops the game from ever starting.**
   - `src/main.js:90` awaits `fetchTopScores()` before `newRun()` and `loop()`, with no try/catch.
   - `src/net.js:1` points at a plain-`http://` `.example.com` URL, which is mixed content inside Poki's HTTPS iframe. `src/net.js:4-5` has no `res.ok` check before `res.json()`.
   - Any network error, bad status or non-JSON reply leaves the player on a blank canvas.
   - Poki also restricts third-party network calls. Remove the leaderboard, or make it optional and non-blocking with a timeout.

2. **[blocker] The Poki SDK isn't integrated to Poki's requirements, and it crashes when the SDK is blocked.**
   - `src/sdk.js:2` calls `PokiSDK.init()` with no guard. Ad blockers are common on Poki, and when the script is blocked this throws a `ReferenceError` and `boot()` dies (`src/main.js:88`).
   - `PokiSDK.init()` rejects when ads are blocked, and the rejection is unhandled. Poki expects the game to continue anyway.
   - There are no calls to `gameLoadingFinished()`, `gameplayStart()` or `gameplayStop()` anywhere. Poki's review requires them.
   - `commercialBreak()` (`src/sdk.js:7`) has no try/catch and no audio mute or input pause around the ad.

3. **[blocker] The 54.5 MB uncompressed `music.wav` blows the size budget.**
   - Evidence: `assets/manifest.json:3`, loaded at `src/audio.js:1`.
   - It will fail Poki's size and load-time guidance and hurt mobile and slow connections badly.
   - Convert it to a roughly 1–2 MB OGG or MP3. Also convert `jump.wav` and `gem.wav` (`manifest.json:4-5`), and consider streaming or lazy-loading the music.

4. **[high] Restarting gets worse each time because `bindKeys` is called on every run.**
   - `src/main.js:23` calls `bindKeys(jump)` inside `newRun()`, so each restart adds another set of `keydown` listeners (`src/input.js:4,8`).
   - After N restarts one keypress jumps N times and calls `restart()` N times. That means multiple ad requests and multiple `newRun()` calls.
   - `restart()` (`src/main.js:31-34`) also doesn't clear `state.over` until the ad finishes. Mashing space during the ad queues more ads.
   - Fix: bind the keys once in `boot()`, and add a "restarting" guard.

5. **[high] Game speed depends on the monitor refresh rate.**
   - `src/main.js:81-85` runs `update()` once per `requestAnimationFrame` with fixed per-frame constants (`p.x += 4`, `vy += 0.5`, `vx` values).
   - On 120/144 Hz screens the game runs 2–2.4× faster. Use a fixed timestep with an accumulator.

6. **[high] Audio autoplay is unhandled, and nothing pauses or mutes audio.**
   - `src/main.js:92` calls `startMusic()` at boot with no user gesture.
   - `src/audio.js:6` doesn't catch the `play()` promise, so browsers block it and the music silently never starts. It should start on the first input.
   - `src/audio.js:12` also doesn't catch `play()`. Setting `currentTime = 0` on a shared element cuts off overlapping sounds.
   - There is no `visibilitychange`/blur handling anywhere. The loop and music keep running in a hidden tab, and there is no mute control.

7. **[medium] Input has several gaps.**
   - There is no `preventDefault`, so space and arrow keys scroll the host page (`src/input.js:5`).
   - Keys are matched case-sensitively. With Caps Lock or Shift held, `A`/`D`/`W` don't work (`src/input.js:5`, `src/main.js:39-40`).
   - There is no touch or mobile input at all. Poki lists mobile as a target, and the README controls are keyboard only.
   - Keys stay "stuck" if focus is lost mid-press, because there is no blur reset (`src/input.js:8`).

8. **[medium] Save handling can crash or lose data.**
   - `src/save.js:5` does `JSON.parse` with no try/catch, so a corrupt value crashes boot.
   - `src/save.js:4,9` doesn't guard `localStorage`, which can throw in restricted iframes or private mode.
   - There is no schema version, and the save is only written at game over (`src/main.js:57-62`). Closing the tab mid-run loses the progress. Poki's SDK also has no storage of its own, so keep the guard and fallback.

9. **[medium] `console.log` runs every frame.**
   - `src/main.js:54` logs the player's position and score 60 or more times a second. Remove it, since it's slow and floods the console.

10. **[medium] There is an external branding link in the page.**
    - `index.html:11` links to another site with the text "More games", plus studio branding. Poki doesn't allow external links or cross-promotion in submitted builds. Remove the footer.

11. **[low] The canvas doesn't scale to the viewport.**
    - `index.html:10` fixes the canvas at 960×540 with no resize, aspect-fit or devicePixelRatio handling. It will look small or blurry in Poki's variable-size iframe and on phones.

12. **[low] Gameplay hygiene issues.**
    - The player can walk off-screen horizontally because there is no clamp (`src/main.js:39-40`).
    - `assets/sprites.png` (`manifest.json:6`, 412 KB) is never loaded, since everything is drawn with `fillRect`. Either use it or drop it.
    - Per-frame `state.gems.filter` is only on death, so it's fine.

## What is healthy
- The code is small and modular, and the Poki calls are isolated in `src/sdk.js`.
- The rendering and collision code allocates nothing per frame beyond the `console.log`, and the sprite count is tiny.
- There are no `any`, `ts-ignore` or similar hacks to clean up. The game logic is simple and self-contained.

## Handoff
**Changed:** nothing (audit only).
**Evidence:** read every tracked file (`index.html`, `package.json`, `style.css`, `README.md`, `assets/manifest.json`, all of `src/*.js`). Ran `git ls-files`.
**Verify the top finding:** block `scores.lumengames.example.com`, or run offline. The canvas never renders because `boot()` rejects at `src/main.js:90`.
**Open:** I didn't run the game in a browser, so frame rate and behavior under Poki's iframe are unconfirmed. I didn't check the asset files themselves (only the manifest sizes, since `assets/` has only `manifest.json` tracked and the audio and sprite files aren't in the repo). I didn't check Poki's current requirements online, so confirm the SDK and link rules against their docs.
**Next:** fix items 1, 2 and 4 together (boot robustness, SDK lifecycle, single key binding), then compress the audio (item 3).