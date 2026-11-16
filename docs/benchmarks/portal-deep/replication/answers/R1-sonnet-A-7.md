I read all 11 tracked files (about 6 KB). I didn't run the game, and I edited nothing. The list is ranked by how likely each problem is to fail Poki review or break the game.

## Blockers

1. **`assets/music.wav` is about 52 MB** (`assets/manifest.json:3`, loaded at `src/audio.js:1`). The manifest itself notes it's uncompressed. That is far over Poki's size and load-time guidance for a 2D canvas game. Re-encode it to OGG or MP3 at about 1–2 MB. The jump and gem WAVs and the sprite sheet are small enough to leave alone.

2. **The game can hang on a blank screen at boot** (`src/main.js:90`, `src/net.js:3-5`). `boot()` awaits `fetchTopScores()` before `newRun()` or `loop()` run. The URL is `http://scores.lumengames.example.com/...`, which is a placeholder domain. It is also plain HTTP, so it is blocked as mixed content inside Poki's HTTPS iframe. The fetch rejects and nothing catches it, so the game never starts. There's no `res.ok` check either. Remove the leaderboard, since Poki generally disallows external calls. Otherwise make it non-blocking and wrap it in try/catch.

3. **The game dies if the Poki SDK fails to load or init** (`src/main.js:88`, `src/sdk.js:3,7`). An ad blocker, or the SDK script failing to load, throws on `PokiSDK` or rejects `init()`. Poki expects the game to still run in that case. Catch the failure in `initSdk` and `showAd`, and make both fall back to no-ops.

4. **Required Poki SDK lifecycle calls are missing** (`src/sdk.js`, `src/main.js`). Nothing calls `PokiSDK.gameLoadingFinished()`, `gameplayStart()` or `gameplayStop()`. `commercialBreak()` is called in `restart()` (`src/main.js:32`) with no `gameplayStop()` before it or `gameplayStart()` after it. Poki checks for these.

5. **The "More games" link to your own site** (`index.html:11`) will be rejected. Poki doesn't allow external links or other-portal branding. Remove the whole footer.

6. **The assets aren't in the repo.** `git ls-files` shows only `assets/manifest.json`, with no `.wav` or `.png` files. Either they're gitignored or untracked, or the audio will 404. `sprites.png` is also never loaded by any code. Confirm the files are in the upload folder, or drop the unused one.

## Bugs

7. **`bindKeys(jump)` runs inside `newRun()`** (`src/main.js:23`). Every restart adds another set of window listeners. After N restarts, one Space press on the game-over screen calls `restart()` N times, which means N `commercialBreak()` ads and N `newRun()` calls. There's also no guard against pressing Space again while the ad is showing. Bind the keys once in `boot()` and add a `restarting` flag.

8. **Music never starts, and the audio errors are unhandled** (`src/audio.js:6,12`, `src/main.js:92`). `startMusic()` runs at boot with no user gesture, so the browser's autoplay policy rejects `play()`. Start the music on the first keydown or click. Also catch the promises that `music.play()` and `s.play()` return, because rapid jump and gem sounds throw unhandled rejections.

9. **Save and load aren't defensive** (`src/save.js:4-9`). `localStorage` can throw when it's blocked or in private mode, and `JSON.parse` throws on corrupt data. Both calls sit in the boot path (`src/main.js:89`) and in `gameOver` (`src/main.js:61`). Wrap both in try/catch and merge with the defaults. Poki also recommends its own SDK storage over raw `localStorage`.

10. **Physics depends on frame rate** (`src/main.js:39-42,81-85`). Movement is per-frame with no delta time. On a 144 Hz monitor the game runs about 2.4× faster than on 60 Hz. Use a fixed timestep or scale by `dt`.

11. **The page scrolls and keys stick** (`src/input.js:4-10`). Space and the arrow keys have no `preventDefault()`, so the page scrolls inside the iframe. Keys stay "held" if the window loses focus, because there's no `blur` reset. Keys are stored by `e.key`, so `A` or `D` with Caps Lock or Shift won't match `keys.a` or `keys.d` at `src/main.js:39-40`. Lowercase them or use `e.code`.

## Polish

12. **`console.log` runs every frame** (`src/main.js:54`). It floods the console and costs performance. Remove it.

13. **`gameOver()` can run twice in one frame** (`src/main.js:51,53`). Two storms, or a storm plus a fall, would add `data.gems` twice (`src/main.js:60`). Return early if `state.over` is already set.

14. **No mobile or touch support, and the canvas doesn't scale** (`index.html:10`, `src/input.js`). Poki serves a lot of mobile traffic. The canvas is a fixed 960×540 and input is keyboard only. At minimum, scale the canvas to fit the iframe. Add touch controls if you want mobile approval.

15. **The player isn't clamped horizontally** (`src/main.js:39-40`). It can walk off-screen and be lost. The storm bounce is also only checked against `x` bounds, not clamped, so a storm can jitter at the edge.

If you want, I can fix these in order, starting with the blockers.