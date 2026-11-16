# Skyhop Poki audit (static review, no files edited)

I read all 11 tracked files. I did not run the game in a browser, and I checked Poki requirements from memory, not against their current docs. Confirm the items marked "verify" before submitting.

**Ranked problems**

1. **Blocker: audio files are missing from the repo.** `src/audio.js:1` and `:3` load `assets/music.wav`, `jump.wav` and `gem.wav`. `assets/` contains only `manifest.json`, so these requests will 404. The `play()` promises at `src/audio.js:6` and `:12` are also never caught.

2. **Blocker: a slow or failed leaderboard request stops the game from starting.** `src/main.js:88-93` awaits `initSdk()` and then `fetchTopScores()` before `newRun()` and `loop()`. `src/net.js:3-5` has no timeout and no try/catch. If the server is down or returns non-JSON, the user sees a black canvas.

3. **Blocker: insecure leaderboard URL.** `src/net.js:1` uses `http://`. Poki is served over HTTPS, so browsers will block the request as mixed content. The endpoint is also a third-party server on a `lumengames.example.com` domain. Verify whether Poki allows external network calls.

4. **Blocker: the Poki SDK is only partly integrated.** There are no `gameplayStart` or `gameplayStop` calls anywhere (`src/main.js:13-24` and `:57-62` are the natural places). Audio is not muted around `commercialBreak` (`src/main.js:31-34`, `src/audio.js`). `src/sdk.js:3` and `:7` call `PokiSDK` with no check that it loaded, so an ad blocker or failed script will throw. Verify the exact Poki requirements.

5. **High: the restart handler is registered again on every run.** `src/main.js:23` calls `bindKeys(jump)` inside `newRun()`, and `src/input.js:4-10` never removes listeners. After N restarts, each key press runs `jump()` N times. On the game-over screen that means N calls to `restart()`, each with its own `showAd()` and `newRun()` (`src/main.js:27`, `:31-33`).

6. **High: a held key can trigger repeated ads.** `src/main.js:27` calls `restart()` with no in-flight guard. Key auto-repeat from `src/input.js:6` (no `e.repeat` check) can fire many `commercialBreak` calls while the first one is still pending.

7. **High: a failed ad leaves the game stuck.** `src/main.js:32` awaits `showAd()` before `newRun()`. If the promise rejects, `restart()` throws before `newRun()`, `state.over` stays `true`, and the next key press repeats the failure.

8. **High: no touch or mobile controls, and the canvas does not scale.** `src/input.js:3-11` handles only keyboard events, and the HUD text says "Press space" (`src/main.js:78`). `style.css:2` and `index.html:10` fix the canvas at 960×540, and `index.html` has no viewport meta tag. Most Poki traffic is mobile, so verify the target audience and device mix before accepting this.

9. **High: the build is about 55 MB.** `assets/manifest.json:3` lists `music.wav` at 54,525,952 bytes, uncompressed. Verify Poki's size cap. Convert the music to OGG or MP3 at a few MB.

10. **Medium-high: physics depends on frame rate.** `src/main.js:36-55` moves the player and storms by fixed amounts per frame (gravity `+0.5`, speed `4`, storm `vx` of `2` and `-3`). On a 120 Hz display the game runs about twice as fast. Use a delta-time or fixed-step loop.

11. **Medium: debug logging runs every frame.** `src/main.js:54` logs player position and score about 60 times per second. Remove it before submission.

12. **Medium: space and arrow keys scroll the page.** `src/input.js:6` does not call `preventDefault()`, so inside the Poki iframe the page scrolls on space and arrow presses.

13. **Medium: the game-over score can be counted twice.** `src/main.js:51` calls `gameOver()` inside the storm loop without returning. If the player overlaps two storms in the same frame, `gameOver()` runs twice, which adds the gem count twice (`src/main.js:60`) and saves twice (`:61`).

14. **Medium: the save layer can throw at startup.** `src/save.js:4-5` calls `localStorage` and `JSON.parse` with no try/catch. Corrupt data or a sandboxed iframe that blocks storage will stop `boot()` (`src/main.js:89`).

15. **Medium: music autoplay is not handled.** `src/main.js:92` calls `startMusic()` at boot with no user gesture. Browsers block this, and the rejected promise at `src/audio.js:6` is unhandled.

16. **Medium: the game does not pause when the tab loses focus.** `src/main.js:81-85` keeps running when hidden. Poki expects gameplay to pause in that case.

17. **Medium: held keys can get stuck.** `src/input.js:8-10` only clears a key on `keyup`. If focus leaves the window while a key is held, the player keeps moving.

18. **Low: the footer links to an external site.** `index.html:11` links "More games" to an external domain with `target="_blank"` and no `rel="noopener"`. Poki often restricts external promotional links. Verify.

19. **Low: keys are case-sensitive.** `src/main.js:39-40` checks `keys.a` and `keys.d`, and `src/input.js:6` checks `"w"`. With Caps Lock on, A and D do nothing.

20. **Low: the leaderboard is read-only.** `src/net.js` only fetches. Scores are never submitted, so the "Top" value in the HUD (`src/main.js:77`) will never change from the player's own play. Confirm whether that is intended.

21. **Low: unused asset.** `assets/manifest.json:6` lists `sprites.png`, and nothing in the code references it.

**Suggested order:** fix 1–4 first, since they block submission. Then 5–9. Items 10–17 are quality and correctness. Items 18–21 are cleanup or product questions.

I can fix these in a follow-up. Tell me which tiers you want, and whether to keep the external leaderboard or drop it.