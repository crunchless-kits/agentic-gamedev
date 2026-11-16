I fixed the code problems that would have broken Skyhop on Poki. The 52 MB soundtrack is still open. I haven't committed anything. I checked syntax only (`node --check` passes on every file) and haven't played the game in a browser.

## What I changed

**Startup and SDK (`src/sdk.js`, `src/main.js`)**
- The game used to hang on a black screen if the Poki SDK was blocked, which ad blockers often do. It now starts without the SDK.
- It also hung if the leaderboard request failed, which it always would. I removed the leaderboard request and deleted `src/net.js`, and the "Top" score no longer shows on screen. The leaderboard URL was plain `http://` (browsers block it inside Poki's HTTPS iframe), pointed at your own domain, and `lumengames.example.com` looks like a placeholder. I haven't added it back.
- I added the Poki lifecycle calls:
  - `gameLoadingFinished` once the game has loaded.
  - `gameplayStart` when a run begins.
  - `gameplayStop` on game over.
- Game audio now mutes while an ad is playing and comes back afterward.

**Bugs**
- Every restart added another set of key listeners, so jumps stacked up. Listeners are now attached once.
- Pressing space while an ad was loading could start several runs at once. Input is now ignored until the ad finishes.
- Game speed was tied to the screen's refresh rate, so it ran about 2.4 times faster on a 144 Hz monitor. It now runs at a fixed 60 Hz step.
- `console.log` ran every frame. I removed it.
- Arrow keys and space no longer scroll the portal page, and held keys reset when the window loses focus. Holding space no longer auto-repeats jumps.

**Audio (`src/audio.js`)**
- Music was started before any user input, which browsers block. It now starts on the first jump.
- Every `play()` call now handles a rejection instead of throwing an unhandled error.
- The soundtrack file is no longer preloaded.

**Saving (`src/save.js`)**
- Blocked `localStorage` or corrupted save data no longer crashes the game.

**Page**
- I removed the "Made by Lumen Games / More games" footer. Poki doesn't allow outbound links to other sites from a game, so this would likely have been rejected.
- The canvas now scales to fit the portal's iframe at 16:9 instead of staying 960×540.
- I changed the README line that said the SDK tag was already in place.

## Still open

1. **`assets/music.wav` is about 52 MB.** This is the biggest rejection and load-time risk. The audio and sprite files aren't in the repo (only `assets/manifest.json` is), so I couldn't convert them. Re-encode the soundtrack to compressed audio (OGG or MP3 at roughly 96–128 kbps would be a few MB), then change the filenames in `src/audio.js` and `manifest.json`. The two sound-effect WAVs are small, so they can stay.
2. **The leaderboard is gone.** If you want one, use Poki's own services, because external requests are generally discouraged.
3. **Testing in Poki's QA tool.** I couldn't test against the real portal. Before submitting, check it with `?gdhelp` / Poki's Inspector, and test on mobile.
4. **Touch controls.** The game is keyboard-only. Poki lists mobile-friendly games as preferred, and a keyboard-only game gets limited reach there. I haven't added touch controls.
5. **Rewarded ads and other SDK features.** None are used. That's fine for submission.
6. **Placeholder visuals.** The game draws plain colored rectangles. `sprites.png` is listed in the manifest but the code never loads it. Poki's reviewers may judge quality, so you may want to finish the art.