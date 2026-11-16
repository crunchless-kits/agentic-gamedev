# Decision: NO-GO

I read all 12 files in the repo. I didn't run the game, and I haven't checked Poki's current requirements. The points below that cite Poki's rules come from what I know of them, so confirm them against the current Poki docs.

## Blockers

1. **The music file is far too big.** `assets/manifest.json:3` lists `music.wav` at 54,525,952 bytes (about 52 MB), uncompressed. Poki wants a small initial download, and its total size limits are tight. Convert it to OGG or MP3 and the file should shrink about 10x. `src/audio.js:1` loads it eagerly.

2. **The leaderboard call uses plain HTTP and can break boot.**
   - `src/net.js:1` points at `http://scores.lumengames.example.com/...`. Poki serves games over HTTPS, so the browser blocks this as mixed content. The host is also a placeholder `.example.com` domain. Poki also restricts third-party network calls.
   - `fetchTopScores()` has no try/catch, and `boot()` (`src/main.js:90`) awaits it before `newRun()` and `loop()`. When the fetch fails, the game never starts. This is a black screen on a failed request.

3. **The Poki SDK flow is incomplete.**
   - There is no `PokiSDK.gameLoadingFinished()` call.
   - There are no `gameplayStart()` or `gameplayStop()` calls. Poki requires them around active play, and the game-over screen and restart should trigger them.
   - `initSdk()` (`src/sdk.js:3`) has no error handling. Ad blockers block the SDK script, so `PokiSDK` is undefined or `init` rejects, and `boot()` dies. Poki's pattern is to continue the game even when `init` fails.
   - `showAd()` (`src/sdk.js:7`) has the same problem, so `restart()` would hang or throw.

4. **There is an outbound promotional link.** `index.html:11` has a "More games" link to `lumengames.example.com`. Poki doesn't allow external links or branding that sends players away from the platform.

## Should fix before submitting

- **Audio autoplay is not handled.** `startMusic()` calls `music.play()` at boot (`src/main.js:92`) with no user gesture and no `.catch`. Browsers reject this, which gives an unhandled promise rejection and no music. Sound effects in `src/audio.js:9-13` have the same problem. Start audio after the first input, and mute it during ads.
- **`bindKeys(jump)` is called inside `newRun()`** (`src/main.js:23`). Every restart adds another set of listeners, so each space press fires `jump()` multiple times, and `restart()` runs repeatedly. That leads to repeated `showAd()` calls and the wrong game state.
- **Key handling is incomplete.**
  - `bindKeys` doesn't `preventDefault` on space or the arrow keys, so the page can scroll in an iframe.
  - Movement uses `keys.a` and `keys.d`, but `keys` is keyed on `e.key`, so Shift or Caps Lock (`"A"`) breaks it.
- **There is a `console.log` in the hot loop** (`src/main.js:54`). It runs every frame, which hurts performance and floods the console.
- **Save handling has no safety.**
  - `JSON.parse` in `src/save.js:6` throws on corrupted data.
  - `localStorage` can throw in sandboxed iframes or private mode.
  - Poki recommends its own storage handling, and I'm not sure it works with `localStorage` here.
- **`gameOver()` can fire more than once.** `update()` returns early after game over, so this is mostly benign. The two storm clouds can both overlap the player in the same frame, though, and the second hit would double-count `data.gems`.
- **The physics step is tied to frame rate.** There is no delta time, so the game runs about 2x faster on 120/144 Hz displays.
- **The package is unversioned and has no build.** It's v0.9.0 and the README calls it a pre-submission build. There is no minification, bundling or zip step.
- **The asset files aren't in the repo.** The manifest lists `music.wav`, `jump.wav`, `gem.wav` and `sprites.png`, but none exist in the tree, and the code never loads `sprites.png`. As committed, every audio load 404s. If the files exist elsewhere, I couldn't verify their sizes.

## What looks fine

- The Poki SDK script tag is present (`index.html:7`).
- The canvas is a fixed 960x540 with no scaling or responsive handling. That's acceptable, but Poki prefers fitting the container.
- The code is small, has no obvious dependencies, and has no third-party trackers.

## Path to Go

1. Compress the music and lazy-load it.
2. Remove the external leaderboard, or make it HTTPS and wrap it in try/catch with a timeout.
3. Add `gameLoadingFinished`, `gameplayStart` and `gameplayStop`, and make SDK init and ad failures non-fatal.
4. Remove the "More games" link.
5. Fix the duplicated key bindings, the audio unlock, and the `console.log`.
6. Test the game with an ad blocker on and in an iframe.