# Decision: NO-GO

I read every file in the repo. I didn't run the game, and no asset files are present, so the assets are checked from the manifest only. Several blockers are certain from the code alone.

## Blockers

1. **Boot fails if the leaderboard request fails** (`src/net.js:3-5`, `src/main.js:90`).
   - The leaderboard is a plain `http://` URL on an `.example.com` host, so the fetch fails.
   - `boot()` awaits `fetchTopScores()` with no try/catch, so `newRun()`, `startMusic()` and `loop()` never run. The game shows a blank canvas.
   - The plain-HTTP request from an HTTPS page is also blocked as mixed content.
   - Poki requires games to work without external servers and to make no calls to non-Poki domains.

2. **The soundtrack is about 52 MB** (`assets/manifest.json:3`).
   - `music.wav` is 54,525,952 bytes, uncompressed. Poki wants a small initial download, and the manifest's own note says "uncompressed".
   - `src/audio.js:1` also loads it up front. It should be compressed to ogg or mp3 and loaded lazily.

3. **The Poki SDK lifecycle is incomplete** (`src/sdk.js`, `src/main.js`).
   - There is no `gameLoadingFinished()`, no `gameplayStart()` and no `gameplayStop()` anywhere in `src/`. Poki requires these calls.
   - `initSdk()` calls `PokiSDK.init()` without handling failure, such as an ad blocker blocking the script. It also never calls `setDebug`.
   - The ad in `restart()` (`src/main.js:32`) is awaited with no error handling. A rejection would stop the restart.
   - Nothing pauses the game or mutes audio during ads.

4. **The footer links to another site** (`index.html:11`).
   - "More games" points to `lumengames.example.com`. Poki doesn't allow external links or branding that sends players away.

5. **Audio starts without a user gesture** (`src/main.js:92`, `src/audio.js:6`).
   - `startMusic()` runs at boot, so browsers will reject `play()` until the user has interacted. The unhandled promise rejection is also uncaught.
   - Music and sound effects have no mute control, and nothing mutes them during ads.

## Other problems

- **Restart bug** (`src/main.js:23`): `newRun()` calls `bindKeys(jump)` every time. Each restart adds duplicate key listeners, so a jump fires several times per key press.
- **Restart race** (`src/main.js:26-34`): during `await showAd()`, `state.over` is still true. Extra key presses queue more restarts and more ads.
- **Debug logging** (`src/main.js:54`): `console.log("frame", …)` runs every frame.
- **Corrupt save** (`src/save.js:4`): `JSON.parse` on a bad `localStorage` value throws, and that also blocks boot. `localStorage` can throw outright in some iframes.
- **Controls** (`src/input.js`): the README says WASD, but `e.key` is case-sensitive, so a held Shift or Caps Lock breaks `w`, `a` and `d`. There is no touch support, and Poki games run on mobile.
- **Missing pieces**: there is no responsive canvas scaling, no pause on tab blur, and the frame loop isn't time-based, so it runs faster on high-refresh-rate displays.
- **Housekeeping**: the version is 0.9.0, and the repo has no build step, tests or CI. The `start` script uses `npx serve`, which is fine for dev only.

## Evidence that checks out

- The Poki SDK script tag is in `index.html:7` and `PokiSDK.init()` is wired up.
- Saves use `localStorage` and are namespaced under `skyhop-save`.
- The core gameplay code in `world.js` and the `update()` loop is coherent.

## What would flip this to GO

1. Remove the leaderboard fetch, or wrap it in try/catch with a fallback.
2. Compress the music to under about 2 MB and load it after the first interaction.
3. Add the `gameLoadingFinished`, `gameplayStart` and `gameplayStop` calls. Guard the SDK and ad calls, and mute and pause around ads.
4. Remove the external link.
5. Fix the duplicate `bindKeys` call and the restart race, and remove the per-frame `console.log`.

Then retest in Poki's test mode with the SDK loaded and with it blocked. Since the plan is to submit next week, items 1 to 4 are a few hours' work and look achievable.