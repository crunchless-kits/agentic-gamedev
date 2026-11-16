The audit is done and I made no edits. The biggest blockers are that the game can show a black screen on boot, and that the four asset files it needs aren't in the repo.

I read all 12 tracked files and confirmed the asset situation on disk. I did not run the game in a browser or check Poki's current submission rules, so the Poki items below are from memory of their SDK and policy expectations. Verify those against Poki's docs before you submit.

## Ranked problems

1. **Any boot-time failure leaves a black screen.** The leaderboard URL uses `http://` on an `https` Poki page, which browsers block as mixed content. The host `scores.lumengames.example.com` is also a placeholder under the reserved `example.com` domain, so it won't resolve. `fetchTopScores` has no error handling, and `boot()` has no `try`/`catch`, so the rejection stops `newRun()` and `loop()` from ever running.
   - `src/net.js:1` (http URL and placeholder host), `src/net.js:4-5` (no `res.ok` check, no catch)
   - `src/main.js:87-94` (`boot()` has no catch; `fetchTopScores` at line 90 is awaited before the game starts)

2. **Missing assets.** `assets/manifest.json` lists `music.wav`, `jump.wav`, `gem.wav` and `sprites.png`. None of them is in the repo or on disk, only the manifest is. The game will ship silent and throw unhandled rejections.
   - `src/audio.js:1-3` (loads the missing files)
   - `assets/manifest.json:2-7`

3. **Restart fires multiple ads and stacks key listeners.** `bindKeys` adds a new `window` listener on every `newRun()`, and nothing removes the old ones. After the first restart, one space press calls `jump()` more than once. Holding space or pressing it repeatedly on the game-over screen also calls `restart()` again, which calls `showAd()` again before the previous ad has finished.
   - `src/main.js:23` (`bindKeys(jump)` inside `newRun`), `src/main.js:26-34` (`jump`/`restart` with no in-flight guard)
   - `src/input.js:3-7` (listener added and never removed)

4. **Poki SDK integration is incomplete.** The wrapper exposes only `init` and `commercialBreak`. There are no gameplay start/stop calls, so Poki can't track active play. The ad callback is ignored, so the music keeps playing during a break. The first ad only appears after the first death, never before the first run.
   - `src/sdk.js:2-7` (no gameplay start/stop; the commercial-break callback is not passed)
   - `src/main.js:31-34` (no audio mute or pause around `showAd`)
   - `src/main.js:92` (music starts with no mute or pause hook)

5. **Music file is 54 MB uncompressed.** That is the single largest load-time cost and likely the main size problem for a portal build. Transcode to OGG or MP3.
   - `assets/manifest.json:3`
   - `src/audio.js:1`

6. **Gems can be double-counted on the same frame.** `gameOver()` can run more than once in one `update()`. A storm hit at line 51 doesn't break the loop, and the fall check at line 53 can also fire. Each call adds the taken gems to `data.gems` again and re-saves.
   - `src/main.js:48-53` (no `break`/guard after `gameOver()`)
   - `src/main.js:57-62` (not idempotent)

7. **No touch or mobile controls, and the canvas doesn't scale.** Input is keyboard-only. The canvas is fixed at 960×540 with no scaling and no viewport meta tag, so it will be cramped or overflow on phones.
   - `src/input.js:4-6` (keyboard only)
   - `index.html:10` (fixed canvas size) and `index.html:2-5` (no viewport meta tag)
   - `style.css:2` (centers but doesn't scale)

8. **Physics is frame-rate dependent.** Movement, gravity and storm speed are per-frame constants with no delta time. On a 120 Hz display the game runs about twice as fast. Background tabs and ad pauses also change the effective speed.
   - `src/main.js:39-42`, `src/main.js:49-50`, `src/main.js:81-85`

9. **Autoplay and unhandled promise.** `startMusic()` is called at boot with no user gesture, so browsers will block it. `play()` returns a promise that is never caught, and music is never retried after a user gesture.
   - `src/audio.js:5-7`, `src/audio.js:9-13`
   - `src/main.js:92`

10. **Per-frame console logging.** `console.log` runs 60 times a second. It costs performance and clutters the console Poki reviewers may look at.
    - `src/main.js:54`

11. **Unguarded `localStorage`.** `JSON.parse` on a corrupt value throws and kills boot. In some sandboxed iframe contexts, `localStorage` access itself throws.
    - `src/save.js:3-6` (`load`), `src/save.js:8-10` (`save`)

12. **Player can walk off-screen horizontally.** Horizontal position has no clamp, so the player can move past the left and right edges.
    - `src/main.js:39-40`

13. **Fall speed is unbounded.** `vy` grows by 0.5 every frame with no terminal velocity. This is mostly harmless today but makes the tunnelling and landing logic less predictable.
    - `src/main.js:41-42`, `src/main.js:45`

14. **No pause on focus loss, and no mute control.** Music keeps playing when the tab is hidden, and there is no in-game mute.
    - `src/main.js:81-85`, `src/audio.js:5-7`

15. **External "More games" link to a placeholder domain.** The link points to `lumengames.example.com`, which won't resolve. Also confirm that Poki allows an out-link from inside the game at all.
    - `index.html:11`

16. **Unused asset.** `sprites.png` is listed in the manifest but never drawn. The game uses plain rectangles.
    - `assets/manifest.json:6`, `src/main.js:65-74`

17. **Restart prompt doesn't match the controls.** The prompt says "Press space", but `w` and `ArrowUp` also restart. Minor.
    - `src/main.js:78`, `src/input.js:6`

## What I'd fix first
Items 1–4 block a submission. Fix the URL and boot error handling, supply or remove the assets, make the key/ad restart path idempotent, and add gameplay start/stop and audio muting around ad breaks. Items 5–9 are needed for a good Poki review, and 10–17 are polish.