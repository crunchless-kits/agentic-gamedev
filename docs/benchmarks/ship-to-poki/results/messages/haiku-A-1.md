Skyhop is patched for the Poki rules I could verify, but it is not ready to submit yet. The biggest blocker is that the audio and sprite files are missing from the repo. I made the changes in the working tree and did not commit them.

I checked the rules against Poki's current developer docs (developers.poki.com), which the old sdk.poki.com links redirect to.

**What I changed**

- **Startup would have failed.** `boot()` awaited a leaderboard fetch to `http://scores.lumengames.example.com`. Poki blocks external requests, so the game would never have started. I deleted `src/net.js` and removed the "Top" score from the HUD. Best score is still saved locally.
- **Outbound link removed.** The "More games" footer link pointed off-site. It's gone, and the "Made by Lumen Games" credit stays.
- **Poki SDK calls added.** `gameLoadingFinished` fires after init. `gameplayStart` fires on the first input. Death calls `gameplayStop`, then `commercialBreak` (audio muted during the ad), then `gameplayStart` on restart. Start and stop are guarded so they never repeat. Without the SDK loaded, the calls are no-ops.
- **Audio.** Music starts on the first press, since browsers block autoplay. Failed `play()` promises are caught, so a missing file no longer produces unhandled errors.
- **Keyboard.** Space and arrows no longer scroll the page. Holding jump no longer auto-repeats jumps. Escape pauses and resumes. Caps Lock no longer breaks the WASD keys.
- **Touch and mobile.** Previously the game was keyboard-only. Now the left third of the canvas holds left, the right third holds right, and a tap in the middle jumps. The canvas scales to fit the viewport at 16:9.
- **Storage.** `localStorage` access is wrapped in try/catch for incognito and blocked storage.
- **Bugs fixed along the way.** Key listeners were re-bound on every restart, which stacked duplicate handlers. A storm and a fall in the same frame could count gems twice. Ads could be queued by repeated presses. The per-frame `console.log` is removed.

I ran a syntax check on every module, but I did not run the game in a browser, so the touch layout, ad flow, and audio are unverified.

**Still open (needs you)**

1. **Assets are missing.** `assets/music.wav`, `jump.wav`, `gem.wav`, and `sprites.png` are not in the repo. The game runs silent without them. Also, `music.wav` is 54 MB uncompressed. Poki wants a small initial download, so convert it to ogg or mp3 and update the path in `src/audio.js`. `assets/manifest.json` is stale and `sprites.png` is unused.
2. **Thumbnails.** Poki requires static and animated thumbnails for global release. None exist in the repo.
3. **Verify the Poki SDK script URL.** I kept `https://game-cdn.poki.com/scripts/v2/poki-sdk.js` without confirming it against the current docs.
4. **Browser test.** Run it in a browser and on a phone, check the ad break and mute behavior, and use Poki's test tooling if you have access.
5. **Letterboxing.** The canvas keeps 16:9 with bars at other aspect ratios. The requirements text could be read as wanting the game to fill the screen, so check this against Poki's review.
6. **Design choices to playtest.** The touch zones, pausing when the tab is hidden, and the world staying frozen until the first input are my decisions. Adjust them if you disagree.

Nothing is committed. If you want the changes in git, I can commit them when you say so.