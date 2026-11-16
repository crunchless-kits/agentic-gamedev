I read every source file, the manifest, and the HTML/CSS. I did not run the game in a browser, so these findings come from reading the code. I did not edit anything. I confirmed with `git ls-files` that the four assets listed in the manifest are not in the repo.

## Ranked problems

**Ship-blockers**

1. **Audio assets are missing from the repo.** `assets/` contains only `manifest.json`. `music.wav`, `jump.wav`, `gem.wav`, and `sprites.png` are absent. The game loads the first three at `src/audio.js:25-27`. The unhandled promise rejections from `play()` and `music.play()` are at `src/audio.js:30` and `src/audio.js:36`. Commit the files or remove the references.

2. **Boot has no error handling, so one failure leaves a blank canvas.** `boot()` at `src/main.js:87-93` has no try/catch, and the game loop starts only after every await succeeds. Any of these throws stop the game:
   - `initSdk()` throws if the Poki SDK script didn't load, because `PokiSDK` is undefined (`src/sdk.js:19`). The SDK is a synchronous script in `index.html:12`, so a slow or blocked CDN delays the page.
   - The leaderboard fetch fails (`src/net.js:4-5`).
   - `JSON.parse` fails on corrupt save data (`src/save.js:11`).

   Wrap each await, fall back to defaults, and start the loop regardless.

3. **Placeholder and insecure endpoints.** `src/net.js:1` points at `http://scores.lumengames.example.com/...`. `index.html:16` links to `lumengames.example.com`. The leaderboard URL is plain HTTP, so it will be blocked as mixed content on Poki's HTTPS page. Its failure also hits item 2. Replace both with real HTTPS URLs.

4. **Poki integration is incomplete.** `src/sdk.js:22-24` calls only `commercialBreak()`. The game does not call gameplay start/stop, and it does not pause the loop or mute audio during the break. Music keeps playing under the ad. Check the current Poki SDK docs for the exact required calls; I could not verify them from here.

**High**

5. **Restart triggers ads repeatedly.** At `src/main.js:26-27` and `src/main.js:31-34`, every `jump()` call while `state.over` is true calls `restart()`, which awaits `showAd()`. Holding space fires keydown repeatedly, and `src/input.js:21-23` does not check `e.repeat`. Pressing space during the ad can stack more commercial breaks.

6. **Key listeners accumulate.** `newRun()` calls `bindKeys(jump)` at `src/main.js:23`, and `bindKeys` adds new window listeners each time (`src/input.js:21`, `src/input.js:25`). After N restarts, each key press fires `jump` N+1 times.

7. **Gems can be double-counted at game over.** `update()` does not return after `gameOver()` is called. A player overlapping two storms in one frame (`src/main.js:48-52`), or one storm plus falling below the screen (`src/main.js:53`), calls `gameOver()` more than once. Each call adds the taken gems again at `src/main.js:60`. Add a guard at the top of `gameOver()`.

8. **Physics depends on frame rate.** Movement and gravity are per-frame, with no delta time (`src/main.js:36-42`, `src/main.js:81-85`). A 120 Hz display runs the game at about double speed.

9. **An exception in `update()` freezes the game.** `loop()` at `src/main.js:81-85` calls `requestAnimationFrame` only after `update()` and `draw()` return. Any throw, such as `save()` failing from `localStorage` in a sandboxed iframe (`src/save.js:15`), stops the loop permanently. Wrap the body in try/finally, or schedule the next frame first.

10. **Music does not reliably start.** `startMusic()` runs at boot with no user gesture (`src/main.js:92`, `src/audio.js:29-31`). Browser autoplay policy blocks it, and the rejection is ignored, so there is no retry. Start music on the first key press or click.

11. **Music file is far too large.** `assets/manifest.json:3` lists `music.wav` at 54,525,952 bytes, uncompressed. Convert it to OGG or MP3 to cut load time.

12. **No touch or mobile input.** `src/input.js:20-27` handles only keyboard events. The game-over prompt says "Press space" (`src/main.js:78`), and the canvas is fixed at 960×540 (`index.html:15`, `style.css:36`) with no scaling. Phone players cannot play.

**Medium**

13. **Console logging every frame.** `src/main.js:54` logs about 60 lines per second. Remove it.

14. **Unreachable island and gem.** `src/world.js:3` places island 7 at x=1020, past the 960-pixel canvas. Its gem at `src/world.js:8` (x=1060) is also unreachable. The player is not clamped horizontally either (`src/main.js:39-40`), so the player can walk off-screen.

15. **Key handling gaps.** `src/input.js:23` does not call `preventDefault`, so space and arrow keys scroll the page. `src/input.js:22` stores keys by exact `e.key` value, so Shift or Caps Lock breaks `a` and `d` (`src/main.js:39-40`).

16. **External link to another games site.** `index.html:16` opens an outside domain in a new tab. Poki's policies generally restrict this. Check the current guidelines before submitting.

17. **No score submission.** The leaderboard is read-only (`src/main.js:90`). Nothing posts scores to the server, so the "Top" value cannot change. This may be intended for v1, but confirm it.

**Low**

18. **Unused manifest entry.** `assets/manifest.json:5` lists `sprites.png`, which nothing in the code references.

Items 1–4 should be fixed before submission. I'd start with 1 and 2, because they can cause a blank or silent game on the first load.