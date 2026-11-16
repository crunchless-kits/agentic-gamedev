I read all 12 tracked files and made no edits. I didn't run the game in a browser, and I didn't check Poki's current requirements against their docs. Items marked "verify" depend on that. The ranking puts anything that breaks the build or fails review first.

**Blockers (fix before submitting)**

1. **Audio files are missing.** `src/audio.js:1,3` loads `assets/music.wav`, `jump.wav`, and `gem.wav`, but `assets/` contains only `manifest.json`. Only the manifest is tracked in git. `src/audio.js:12` (`s.play()`) then rejects with an unhandled promise.
2. **Poki SDK integration is incomplete.** `src/sdk.js:2-8` and `src/main.js:87-94` never call `gameLoadingFinished`, `gameplayStart`, or `gameplayStop`. `src/main.js:32` runs the commercial break with no audio mute or game pause around it. Verify the exact call list in Poki's SDK docs.
3. **The SDK load failure crashes the game.** `index.html:7` loads the SDK from a CDN with no fallback. If it is blocked or fails, `PokiSDK` is undefined, so `src/sdk.js:3` throws and `boot()` never reaches `newRun()`. Ad blockers can cause this.
4. **No touch or mobile input.** `src/input.js:3-10` handles keyboard events only. Poki traffic is heavily mobile, and the README describes arrow keys and space only.
5. **The canvas does not scale.** `index.html:10` fixes the canvas at 960×540, and `style.css:2` has no responsive sizing, so it overflows on small or portrait screens.
6. **The leaderboard URL is insecure and a placeholder.** `src/net.js:1` uses `http://` and `scores.lumengames.example.com`. An HTTPS Poki iframe will block the mixed-content request, and `.example.com` is not a real host.
7. **A failed leaderboard fetch blocks the game.** `src/net.js:3-5` has no `catch`, no timeout, and no check on the response. `src/main.js:90` awaits it before `newRun()`, so a failed or hung request means a black screen.
8. **Restarting repeats ads and duplicates input listeners.** `src/main.js:27` calls `restart()` on each key press while `state.over` is true, and `src/main.js:31-34` awaits `showAd()` without a guard. `src/main.js:23` calls `bindKeys` on every `newRun()`, and `src/input.js:3-7` adds new listeners each time. After one restart, each space press fires `jump()` twice, so several ad calls and `newRun()` calls can overlap. Holding space also auto-repeats into this path.
9. **Game over can run twice in one frame.** `src/main.js:51` can call `gameOver()` once per overlapping storm, and `src/main.js:53` can call it again for a fall. `gameOver()` at `src/main.js:57-61` has no guard, so gems are counted twice and `save()` runs twice.

**High**

10. **Movement depends on frame rate.** `src/main.js:36-55` applies per-frame constants, and `src/main.js:81-85` drives it with `requestAnimationFrame` without a delta time. On a 120 Hz display the game runs at twice the speed.
11. **A `console.log` runs every frame.** `src/main.js:54` logs at up to 60 Hz. Remove it.
12. **The music file is too large.** `assets/manifest.json:3` lists `music.wav` at 54.5 MB, uncompressed. Use OGG or MP3 at a much smaller size. Check Poki's bundle size limit.
13. **Ads play on every death.** `src/main.js:32` runs a commercial break on each death. Verify Poki's minimum interval between breaks and gate the ad on time played.
14. **Storage access is unguarded.** `src/save.js:4` and `src/save.js:9` have no `try`/`catch`, so a blocked `localStorage` in a restricted iframe throws. `src/save.js:5` also throws on corrupt JSON, and `boot()` never reaches `newRun()`.

**Medium**

15. **Autoplay will fail.** `src/main.js:92` calls `startMusic()` at boot without a user gesture. `src/audio.js:6` ignores the rejected promise, so browsers will block the music silently.
16. **Keys can get stuck and arrow keys scroll the page.** `src/input.js:6` does not call `preventDefault()`, so space and arrows scroll the iframe. `src/input.js:8-10` has no reset on window blur, so a missed `keyup` leaves the player moving.
17. **The player can leave the screen sideways.** `src/main.js:39-40` has no horizontal clamp to the canvas.
18. **External link in the footer.** `index.html:11` opens `lumengames.example.com` in a new tab. Verify whether Poki allows this, and replace the placeholder domain either way.

**Low**

19. Dead assets: `assets/manifest.json:6` lists `sprites.png`, which the code never uses. Remove it or wire it up.

**Suggested order:** items 1–3 first, then 8 and 9, since those change game state or ad behavior. Item 4 is required for a mobile-first portal submission. Items 2 and 13 need Poki's current docs to confirm the exact calls and ad rules.