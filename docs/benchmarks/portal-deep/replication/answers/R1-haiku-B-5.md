I read all 11 project files and made no edits. The repo is small, so I audited it directly rather than running the audit skill. I did not run the game, and the Poki requirements below come from my knowledge of the Poki SDK. Check them against Poki's current technical requirements before submitting.

## Ranked problems

**Likely to block the submission or break play**

1. **No touch controls, and the canvas doesn't scale.** Input is keyboard-only (`src/input.js:3-10`). The canvas is a fixed 960×540 (`index.html:10`, `style.css:2`), and nothing scales it. Most Poki players are on phones, and they cannot play at all.
2. **Restart and ad logic is unguarded, so one key press can trigger several ads.** `jump()` calls `restart()` with no in-progress flag (`src/main.js:26-34`). Holding space, which auto-repeats, or pressing it again while the ad is showing, starts another `showAd()` and another `newRun()`.
3. **`bindKeys` runs again on every restart, so listeners pile up.** `src/main.js:23` adds a new keydown/keyup listener pair each run. After a few deaths, one press fires `jump()` several times. This is what makes problem 2 worse.
4. **Poki lifecycle calls are missing.** There is no `gameLoadingFinished`, `gameplayStart`, or `gameplayStop` anywhere (`src/sdk.js`, `src/main.js:87-94`). Audio is not muted or paused around `commercialBreak` (`src/main.js:32`, `src/audio.js`), and the game keeps running behind the ad.
5. **Startup has no fallback.** If the Poki SDK script is blocked, `PokiSDK` is undefined and `initSdk` throws (`src/sdk.js:3`). `boot()` has no catch (`src/main.js:87-96`), so a failed leaderboard fetch (`src/net.js:4`, awaited at `src/main.js:90`) leaves a blank screen.
6. **Two links break Poki's rules and will not work over HTTPS.**
   - The footer links out to an external site (`index.html:11`). Poki generally disallows links that take players off the portal.
   - The leaderboard uses `http://` (`src/net.js:1`). Browsers block this as mixed content on an HTTPS portal.
   - Both hosts are `example.com` placeholders and must be replaced.
7. **Assets are oversized, and the repo doesn't contain them.** `assets/music.wav` is 54.5 MB uncompressed (`assets/manifest.json:3`) and loads from `src/audio.js:1`. Compress it to OGG or MP3. `jump.wav`, `gem.wav`, and `sprites.png` are listed in the manifest but not present in the repo, and `sprites.png` is never used. Either this snapshot is incomplete or the build will fail.
8. **A `console.log` runs every frame.** `src/main.js:54` logs about 60 times a second. It costs performance and looks bad in review.
9. **Physics depend on frame rate.** Movement, gravity, and storm speed are per-frame, with no delta time (`src/main.js:39-42`, `src/main.js:49`). On 120 Hz or 144 Hz screens the game runs faster.
10. **Game-over can fire twice in one frame, which double-counts gems.** The storm loop has no `break` (`src/main.js:48-52`), and `gameOver()` runs again at `src/main.js:53`. Each call adds the taken gems to `data.gems` again (`src/main.js:60`).
11. **Keyboard input has three bugs.**
    - Movement and jump check lowercase keys only (`src/main.js:39-40`, `src/input.js:6`), so Caps Lock breaks them.
    - Keys stay "held" if the window loses focus before keyup (`src/input.js:8-10`), so the player keeps drifting.
    - Space and arrows scroll the page because there is no `preventDefault` (`src/input.js:4-6`).
12. **The player can walk off-screen, and some islands are unreachable.** Horizontal position is never clamped (`src/main.js:39-40`). Islands are placed out to x=1020 (`src/world.js:3`), past the 960px canvas, so the last gems can't be collected.
13. **localStorage is unguarded.** `JSON.parse` on a corrupt value throws (`src/save.js:5`). In some sandboxed iframes, touching `localStorage` throws outright (`src/save.js:4`, `src/save.js:9`). Either one stops boot (`src/main.js:89`).
14. **The game does not pause when the tab is hidden or loses focus.** The loop runs unconditionally (`src/main.js:81-85`). Poki expects the game to pause when the portal covers it.
15. **Autoplay promises are unhandled.** `music.play()` runs at boot, before any user gesture, so browsers will block it (`src/audio.js:6`, `src/main.js:92`). The rejection is not caught, and `s.play()` at `src/audio.js:12` has the same issue.
16. **Scores are read but never submitted, so the leaderboard is display-only.** Only `fetchTopScores` exists (`src/net.js`). If the leaderboard is part of the pitch, this is an incomplete feature.

## Suggested first pass

Fix items 2, 3, 4, and 5 first. They are the Poki integration and crash paths, and each is a small change. Items 1 and 9 are the largest pieces of work. Item 7 is quick but needs the real asset files, which are not in this repo.