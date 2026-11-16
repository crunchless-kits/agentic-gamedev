# Audit: Skyhop (v0.9.0)
Stack: plain JavaScript, ES modules, Canvas 2D, no bundler, no TypeScript, no lockfile. The Poki SDK loads from a script tag.
Build: not applicable, since there is no build step. I did not run the game in a browser, and I read all 11 tracked files.

## Findings (ranked)

1. **[blocker] The soundtrack is a 54.5 MB uncompressed WAV.**
   Evidence: `assets/manifest.json:3` lists `assets/music.wav` at 54,525,952 bytes. It is loaded at `src/audio.js:1`.
   Impact: Poki has strict initial-load and total-size limits, and 54 MB will probably be rejected. Players on slow connections would also wait a long time before music starts. Re-encode it as OGG or MP3 (about 2–4 MB) and convert the SFX too.
   Route to: `cl-web:web-game-developer`, with the `cl-port` skill for Poki size limits.

2. **[blocker] A failed leaderboard fetch stops the game from starting.**
   Evidence: `src/net.js:1` uses a plain `http://` URL on a placeholder `.example.com` host. `src/net.js:4-5` has no try/catch, no `res.ok` check and no timeout. `src/main.js:90` awaits it inside `boot()`.
   Impact: the fetch rejects, `boot()` throws, and `newRun()` and `loop()` never run, so players get a black screen. The `http://` URL is also blocked as mixed content on an HTTPS page. Poki also expects games not to call external servers. Remove it or make it optional, so it never blocks boot and falls back to "-".
   Route to: `cl-web:web-game-developer`.

3. **[blocker] The game can't start if the Poki SDK is unavailable, and it doesn't follow Poki's SDK rules.**
   Evidence: `src/sdk.js:3` calls `PokiSDK.init()` with no guard, so an ad blocker or a script load failure raises a ReferenceError at `src/main.js:88`. `src/sdk.js:7` calls `commercialBreak()` with no guard. There is no `PokiSDK.gameLoadingFinished()`, `gameplayStart()` or `gameplayStop()` call anywhere.
   Impact: Poki requires `gameplayStart` and `gameplayStop` for QA and revenue tracking, and ad blockers are common. Wrap init in try/catch, continue if it fails, and call the lifecycle events. `commercialBreak` should also pause the audio and the game while it plays.
   Route to: `cl-core:cl-port` (Poki).

4. **[high] Restarting stacks key listeners and ads.**
   Evidence: `src/main.js:23` calls `bindKeys(jump)` inside `newRun()`, so each restart adds another pair of `keydown` and `keyup` listeners (`src/input.js:4,8`). `src/main.js:27` calls `restart()` on every jump keypress while `state.over` is true, and `restart()` awaits an ad at `src/main.js:31-32`.
   Impact: after N restarts a single key press fires N handlers. Holding space or pressing it twice during the ad queues several ad breaks and several `newRun()` calls. Poki can flag the repeated ads, and the player will see odd behaviour. Bind the keys once in `boot()` and add a "restarting" guard.
   Route to: `cl-web:web-game-developer`.

5. **[high] Audio breaks on autoplay and rapid repeats.**
   Evidence: `src/audio.js:6` calls `music.play()` from `boot()` (`src/main.js:92`) with no user gesture, and the returned promise is ignored. `src/audio.js:11-12` resets and replays one `Audio` element per sound, and `play()` is never caught.
   Impact: browsers block autoplay, so there will be no music until something retries it, plus an unhandled rejection in the console. Sounds cut themselves off on rapid jumps and gems. Poki needs audio to follow its mute and pause rules. Start the music on the first input, catch `play()` errors, and use WebAudio (or an element pool) for the SFX.
   Route to: `cl-web:web-game-developer`.

6. **[high] The game loop is frame-bound, and nothing pauses it.**
   Evidence: `src/main.js:36-55` and `src/main.js:81-85` advance by fixed amounts per `requestAnimationFrame` tick, such as `p.x -= 4`, `vy += 0.5` and `c.x += c.vx`. There is no delta time and no `visibilitychange` or blur handling.
   Impact: the game runs about 2.5 times faster on a 144 Hz display than on 60 Hz, which changes difficulty and jump physics. Throttled background tabs will behave inconsistently. Use a fixed-timestep accumulator, and pause the loop and the music when the tab is hidden.
   Route to: `cl-web:web-game-architecture`.

7. **[high] The save file isn't safe against bad data.**
   Evidence: `src/save.js:5` calls `JSON.parse` with no try/catch. `src/save.js:9` writes with no guard. There is no schema version, and no handling for `localStorage` being blocked.
   Impact: corrupt or blocked storage throws inside `boot()`. Poki's iframe can block storage in some browsers, which would give a black screen. Wrap the load and save calls and default the data. Add a `version` field before launch, because adding one after release is harder.
   Route to: `cl-web:web-game-developer`.

8. **[medium] A `console.log` runs every frame.**
   Evidence: `src/main.js:54`.
   Impact: it logs 60 lines a second to the console, which slows the game on weaker devices, and Poki QA will notice it. Remove it.
   Route to: `cl-web:web-game-developer`.

9. **[medium] There is no mobile or touch support, and the canvas doesn't scale.**
   Evidence: `src/input.js` only handles keyboard events. `index.html:10` fixes the canvas at 960×540, and `style.css:2` doesn't resize it. The README (`README.md:3`) describes keyboard-only controls.
   Impact: Poki has a large mobile audience, and the game is unplayable on phones. It also overflows small windows and ignores device pixel ratio, so it looks blurry on high-DPI screens. Add touch controls, CSS or JS scaling, and a DPR-aware canvas.
   Route to: `cl-web:web-game-developer`, with `cl-design:game-ui-ux-designer` for the controls.

10. **[medium] The footer links out to another site.**
    Evidence: `index.html:11` links to `lumengames.example.com/more` with `target="_blank"`.
    Impact: Poki forbids links to other sites or "more games" promotion inside the game, and the footer also takes vertical space. Remove it for the portal build.
    Route to: `cl-core:cl-port`.

11. **[medium] Input handling has gaps.**
    Evidence: `src/input.js:5` stores `e.key` as-is. `src/main.js:39-40` checks only lowercase `a` and `d`, while `src/input.js:6` checks only lowercase `w`.
    Impact: with Caps Lock or Shift held, WASD stops working. Space and the arrow keys also scroll the page inside the Poki iframe, because `preventDefault` is never called. Use `e.code` and call `preventDefault`. Keys can also stay stuck after focus is lost, so clear them on blur.
    Route to: `cl-web:web-game-developer`.

12. **[medium] The game has no start screen, so audio can't start properly.**
    Evidence: `src/main.js:87-94` goes straight from boot into play.
    Impact: the player has no "click to start" moment, which is also what unlocks audio (finding 5) and is where `gameplayStart` belongs (finding 3). I'd add a simple title screen.
    Route to: `cl-design:game-ui-ux-designer`.

13. **[low] Physics edge cases and hygiene.**
    Evidence: `src/main.js:45` uses a landing check that can tunnel through islands at high fall speed. `src/main.js:23` and `src/main.js:60` mean `data.gems` is added to the save but never shown. `package.json:6` uses `npx serve .` with no pinned version, and the project has no lockfile, tests, or `.gitignore`. The README has no licence or credits for `assets/sprites.png`, and the game never draws that sprite sheet.
    Impact: minor, but `sprites.png` (412 KB) is unused weight and licensing for any bundled assets should be confirmed before submission.
    Route to: `cl-web:web-game-developer`.

## What is healthy
- The code is small and modular: separate files for audio, input, save, SDK and world (`src/`).
- Platform code is isolated in `src/sdk.js`, so the Poki adapter is easy to extend.
- Collision and world generation are simple pure functions (`src/world.js:15-17`), and the player state is reset cleanly in `newRun()`.
- Drawing uses cheap rectangles, so draw-call and allocation cost is low.

## Handoff
Changed: nothing (audit only)
Evidence: read `README.md`, `package.json`, `index.html`, `style.css`, `assets/manifest.json` and `src/*.js`. I did not run the game or the `ts_health.mjs` script, because there is no TypeScript or build output. I also did not verify the asset sizes on disk. I took them from the manifest, since the asset files aren't in git.
Verify: for finding 2, serve the project, block `scores.lumengames.example.com`, and the game stays black. For finding 3, run it with the Poki script blocked. For finding 4, die and restart three times, then press space once and watch `restart()` fire repeatedly.
Open: the real asset files are missing from the repo, so I can't confirm the audio length or the sprite usage. I couldn't test against Poki's current size limits or the Poki QA checklist, so confirm the numbers in finding 1 against their developer docs.
Next: re-encode the music (finding 1) and decouple boot from the network and SDK (findings 2 and 3). Those three block submission.