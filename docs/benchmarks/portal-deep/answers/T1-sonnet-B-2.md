# Audit: Skyhop
Stack: plain JavaScript (ES modules), HTML5 canvas 2D, no bundler, no `package.json` dependencies, no TypeScript. `npm start` runs `npx serve .`.
Build: not applicable, since there is no build step. I did not run the game in a browser, so every finding comes from reading the code.

## Findings (ranked)

1. [blocker] The 52 MB uncompressed WAV soundtrack.
   Evidence: `assets/manifest.json:3` lists `assets/music.wav` at 54,525,952 bytes. `src/audio.js:1` loads it with `new Audio(...)`. The two sound effects are also WAV (`manifest.json:4-5`).
   Impact: The total is about 55 MB, and the music alone is about 52 MB. That is far over what Poki accepts for a web game's initial download. It would also make load times very slow on mobile.
   Fix: Re-encode the music as OGG or MP3 (about 2–3 MB) and the effects as OGG, then update the paths in `src/audio.js`.
   Route to: `cl-web:web-harness` (audio and assets).

2. [blocker] The game never starts if the Poki SDK fails to initialise.
   Evidence: `src/main.js:88` runs `await initSdk()` and `src/sdk.js:3` returns `PokiSDK.init()` with no handling. Ad blockers are common on portals. If the script is blocked, `PokiSDK` is undefined and `boot()` throws. If `init()` rejects, the same thing happens.
   Impact: Players with an ad blocker get a black screen. Poki's guidance is that the game must still run when the SDK fails.
   Fix: Wrap the init in try/catch and continue. Guard `showAd` the same way.
   Route to: `cl-core:cl-port` (Poki adapter).

3. [blocker] No `gameplayStart`, `gameplayStop` or `gameLoadingFinished` calls.
   Evidence: `src/sdk.js:1-8` only exposes `init` and `commercialBreak`. A grep of `src/` finds no other Poki calls.
   Impact: Poki requires these events, and QA will reject a build without them. They also drive ad timing and Poki's metrics.
   Fix: Call `gameLoadingFinished` after boot. Call `gameplayStart` at run start and `gameplayStop` at game over, and again around ads.
   Route to: `cl-core:cl-port`.

4. [blocker] The leaderboard fetch blocks boot, and it is insecure.
   Evidence: `src/net.js:1` uses a plain `http://` URL on an `.example.com` host. `src/net.js:4-5` has no try/catch and no timeout. `src/main.js:90` awaits it before `newRun()`.
   Impact: Portals serve over HTTPS, so the browser blocks the request as mixed content. The fetch throws and the game never starts. Poki also generally disallows calls to your own external servers.
   Fix: Remove it, or make it optional with a fallback and move it off the critical path.
   Route to: `cl-web:web-game-developer`.

5. [high] Key listeners stack up on every restart, which causes multiple ads and runs.
   Evidence: `src/main.js:23` calls `bindKeys(jump)` inside `newRun()`, so it runs again on each restart. `src/input.js:4,8` add `window` listeners every time.
   Impact: After N restarts, one Space press calls `restart()` N times while `state.over` is still true. That fires N `commercialBreak` calls and N new runs. It breaks Poki's ad pacing, and the jump input also fires N times.
   Fix: Bind once in `boot()`.
   Route to: `cl-web:web-game-developer`.

6. [high] The "More games" link goes to an external site.
   Evidence: `index.html:11` has a footer with "Made by Lumen Games" and a link to `https://lumengames.example.com/more`.
   Impact: Poki disallows external links and promotion of other sites or branding inside games. QA will flag it.
   Fix: Remove the footer.
   Route to: `cl-core:cl-port`.

7. [high] Music starts without a user gesture, and audio errors are unhandled.
   Evidence: `src/audio.js:6` calls `music.play()` from `boot()` (`src/main.js:92`) before any input. `src/audio.js:12` does the same for effects.
   Impact: Browsers reject autoplay, so the rejected promise is unhandled and the music never plays. Audio is also not muted while an ad runs, and there is no mute control, which Poki requires.
   Fix: Start audio on the first keypress. Catch `play()` rejections. Mute during ads and add a mute toggle.
   Route to: `cl-web:web-harness`.

8. [high] There is no touch or mobile support, and the canvas does not scale.
   Evidence: `src/input.js` handles only keyboard events. The canvas is fixed at 960×540 (`index.html:10`, `style.css:2`). There is no resize or devicePixelRatio handling.
   Impact: The game is unplayable on phones, and Poki has a large mobile audience. On small windows the canvas is cropped.
   Fix: Add on-screen or touch controls and scale the canvas to fit the viewport.
   Route to: `cl-design:game-ui-ux-designer` and `cl-web:web-game-developer`.

9. [high] The game does not pause when the tab is hidden or an ad runs, and its speed depends on frame rate.
   Evidence: `src/main.js:81-85` runs `update()` once per `requestAnimationFrame`, with no delta time. There is no `visibilitychange` handling, and `commercialBreak` does not pause the game.
   Impact: On a 144 Hz display the game runs 2.4 times faster than on 60 Hz. Players can't be sure of fair physics, and the game keeps running behind an ad.
   Fix: Use a fixed timestep and pause on hidden or ad.
   Route to: `cl-web:web-game-architecture`.

10. [medium] Save loading can crash the game.
    Evidence: `src/save.js:5-6` calls `JSON.parse` with no try/catch. `localStorage` access is unguarded in `load()` and `save()`.
    Impact: A corrupt save, or storage blocked in a third-party iframe, throws during boot and blocks the game. Blocked storage is a common case on portals.
    Fix: Wrap in try/catch and fall back to defaults. Add a version field to the save data.
    Route to: `cl-release:release-hub` (save checks).

11. [medium] Game-over rewards can be counted twice in one frame.
    Evidence: In `src/main.js:48-53`, `gameOver()` can run more than once per frame, from a storm overlap and from `p.y > 560`. Nothing guards it, because `state.over` is only checked at the start of `update`. `src/main.js:60` then adds the gem count again.
    Impact: The persisted `data.gems` total is inflated.
    Fix: Return early in `gameOver()` if `state.over` is already set.
    Route to: `cl-web:web-game-developer`.

12. [medium] A `console.log` runs on every frame.
    Evidence: `src/main.js:54`.
    Impact: It floods the console and slows low-end devices, and it leaves debug output in a release build.
    Fix: Delete the line.

13. [low] Input handling is case-sensitive and not fully mapped.
    Evidence: `src/main.js:39-40` reads `keys.a` and `keys.d`. `src/input.js:6` jumps on `w`, `ArrowUp` and Space.
    Impact: With Caps Lock or Shift held, `e.key` is `"A"`, so movement stops working. Space and the arrow keys also scroll the page, because `preventDefault` is never called.
    Fix: Use `e.code` and call `preventDefault` on game keys.

14. [low] Missing hygiene items.
    Evidence: `package.json` has no build, lint or test scripts. `index.html` has no viewport meta tag and no `lang` attribute. There is no error handling on asset loads, and `assets/sprites.png` (`manifest.json:6`) is never referenced by the code.
    Fix: Add the viewport meta and `lang`, and remove or use the unused sprite sheet.

## What is healthy
- The code is small and modular. `world.js`, `save.js`, `input.js` and `audio.js` each have one job (`src/`).
- Poki access is confined to `src/sdk.js`, so the SDK is not scattered through gameplay code.
- The Poki SDK script tag is present in `index.html:7` and uses the v2 URL.
- Collision and world generation are simple, pure functions (`src/world.js`).
- The sprite sheet is small (412 KB).

## Handoff
Changed: nothing (audit only).
Evidence: I read all 11 tracked files (`README.md`, `package.json`, `index.html`, `style.css`, `assets/manifest.json` and `src/*.js`).
Verify: To reproduce finding 2, block `poki-sdk.js` in DevTools and reload. The canvas stays blank and the console shows a `PokiSDK is not defined` error. For finding 5, die and restart three times, then die and press Space once. Several ads fire.
Open:
- I did not run the game in a browser, so there are no measured frame rates or load times.
- I did not check `assets/` on disk. The sizes come from `manifest.json`, and the actual audio files are not in the repo.
- I could not confirm Poki's current size limit or review rules. The requirements above come from my knowledge of Poki's guidelines, so check them against the current Poki developer docs.
Next: Fix the four blockers, which are the audio size, SDK init failure, the Poki lifecycle events and the leaderboard fetch. Then do finding 5 (stacked listeners), because it breaks ad pacing.