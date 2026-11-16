I read every tracked file and did not edit anything. I could not run the game, so these come from reading the code. I checked on disk that `assets/` contains only `manifest.json`, so the four files it lists are missing from the repo. The Poki SDK method names and the platform policy points below are from memory; confirm them against Poki's developer docs before you submit.

## Ranked problems (most severe first)

1. **Required audio and sprite assets are missing from the repo.** `src/audio.js:1`, `src/audio.js:3`. `assets/` holds only `manifest.json`, so `music.wav`, `jump.wav`, `gem.wav` and `sprites.png` are absent. The game will have no sound and the requests will 404. Nothing loads `sprites.png` at all (`assets/manifest.json:6`).

2. **Every restart stacks another keyboard listener.** `src/main.js:23` calls `bindKeys(jump)` inside `newRun()`, and `newRun()` runs on every restart (`src/main.js:33`). `bindKeys` (`src/input.js:3-7`) adds a new `window` listener each time and never removes the old ones. After a few deaths, one press of space calls `restart()` several times, which fires several `showAd()` commercial breaks and several `newRun()` calls. This is the most likely thing to break in real play.

3. **Boot blocks on an external leaderboard with no error handling or timeout.** `src/main.js:87-93` awaits `fetchTopScores()`. `src/net.js:1` uses `http://` on a placeholder domain (`scores.lumengames.example.com`). On Poki's HTTPS iframe that request is blocked as mixed content, and if it hangs or fails the game stays on a black screen. A slow or dead endpoint has the same effect.

4. **The Poki SDK integration is incomplete and boot depends on the SDK loading.**
   - `src/main.js:88` and `src/sdk.js:3` assume `PokiSDK` exists. If the SDK script is blocked, this throws and the game never starts.
   - The lifecycle calls are missing: `gameLoadingStart`/`gameLoadingFinished` around boot, and `gameplayStart`/`gameplayStop` around play.
   - `src/main.js:32` and `src/sdk.js:6-7` call `commercialBreak()` with no callback, so audio is not muted or paused during the ad.

5. **No touch controls.** `src/input.js:3-11` handles keyboard only, and the README documents keys only. Most Poki traffic is on mobile, where the game cannot be played at all.

6. **Physics depends on frame rate.** `src/main.js:36-55` moves and accelerates by fixed amounts per frame, with no delta time. `requestAnimationFrame` runs at the display refresh rate (`src/main.js:81-85`), so the game runs 2–3× faster on 120–144 Hz screens.

7. **Double-counted gems on death.** `src/main.js:51` and `src/main.js:53` can each call `gameOver()` in the same frame, and `update()` does not return afterwards. `gameOver()` (`src/main.js:60`) adds the taken-gem count to the persisted `data.gems` on every call, so a death where two storms overlap inflates the saved total.

8. **Music autoplay fails silently.** `src/audio.js:6` and `src/audio.js:12` do not handle the promise from `play()`. Browsers block autoplay before a user gesture, and `startMusic()` runs in `boot()` (`src/main.js:92`) before any input, so the soundtrack often never starts and nothing retries it.

9. **Fragile save loading can block boot.** `src/save.js:5` calls `JSON.parse` with no try/catch. Corrupted data, or a `null` value, throws during `load()` (`src/main.js:89`). `localStorage` can also throw in restricted iframes. Either case stops the game before it starts.

10. **Per-frame `console.log` in the game loop.** `src/main.js:54` logs about 60 lines a second. It hurts performance and will look unprofessional to a reviewer.

11. **Oversized music file.** `assets/manifest.json:3` lists a 54 MB uncompressed WAV. Converting it to Ogg or MP3 would cut the download size dramatically.

12. **External link in the footer.** `index.html:11` links to `lumengames.example.com` in a new tab. Poki's rules generally discourage links that take players off the platform, and the domain is a placeholder. Check the policy and remove or change it.

13. **Player can leave the play area horizontally.** `src/main.js:39-40` has no bounds check on `p.x`, so the player can walk off either edge.

14. **Input edge cases.**
   - `src/input.js:8-10` does not clear keys on window blur, so a key released outside the window leaves the player moving.
   - `src/input.js:6` and `src/main.js:39-40` compare against lowercase `w`/`a`/`d`, so Caps Lock or Shift breaks WASD.
   - `src/input.js:4-7` does not call `preventDefault()`, so space and the arrow keys also scroll the page.

15. **Fixed-size canvas.** `index.html:10` is a fixed 960×540 canvas, and `style.css:2` only centers it. There is no scaling and no viewport meta tag (`index.html:3-4`), so it can overflow small or portrait screens.

16. **Leaderboard is read-only.** `src/main.js:77` shows the top score, but nothing submits the player's score. This is a product gap rather than a bug, but it means the feature does nothing for players.

## Suggested order before submission

Items 1–4 are the blockers. The game may not run or may fail review without them. Items 5 and 6 matter most for Poki's audience and for the feel of the game. The rest are polish.