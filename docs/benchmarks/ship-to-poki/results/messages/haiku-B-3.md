Skyhop's code is ready for Poki except for the audio files, which aren't in the repo. I changed the code to match Poki's current rules but haven't run it in a browser or the Poki Inspector, so the changes are verified by reading and by a Node test of the SDK adapter only. Nothing is committed.

## What I changed

- **Poki SDK adapter (`src/sdk.js`)**: the only module that touches the SDK. If the SDK is missing or `init()` fails, every call becomes a no-op and the game still starts. Init has a 5 s timeout. Breaks have a 60 s timeout so a stuck ad can't freeze the game.
- **Lifecycle (`src/main.js`)**: `gameLoadingFinished` fires after the first frame. `gameplayStart` fires on the first input, `gameplayStop` on game over. Restart runs `commercialBreak` with audio muted, then `gameplayStart`. The game also pauses when the tab is hidden.
- **Bugs fixed in `main.js` and `input.js`**: key handlers were re-added on every restart, so presses stacked up and could trigger several restarts and ads at once. Restart now has a busy guard. Game over could also fire twice in one frame and double-count gems. The per-frame `console.log` is gone.
- **Outgoing links and external requests**: removed the "More games" link from the footer. Removed the leaderboard fetch from boot, since Poki blocks external requests and the URL was plain `http`.
- **Mobile**: added the viewport meta tag, scaled the canvas to fit the screen at 16:9, and added basic touch controls. Holding the left or right third moves, and tapping the middle third jumps or restarts.
- **Audio (`src/audio.js`)**: added `setMuted` for ads. `play()` rejections are caught, so the browser's autoplay block no longer throws unhandled errors. Music starts on first input.
- **Storage (`src/save.js`)**: `localStorage` calls are wrapped in try/catch, as Poki requires.
- **Arrow keys and space** no longer scroll the page inside the portal frame.
- **Poki notes (`.claude/skills/poki-integration/references/poki-sdk-notes.md`)**: added the requirements I checked today (2026-11-16), with the source URLs.

I checked the SDK rules against Poki's live requirements and HTML5 SDK pages. The adapter passed a Node test with a fake `PokiSDK` for the no-SDK, init-failure, happy-path, and stuck-ad cases.

## What is still open

1. **Audio files are missing from the repo.** `assets/music.wav`, `jump.wav`, `gem.wav`, and `sprites.png` are not tracked; only `manifest.json` is. The game will run silently until they are added.
2. **The music file is too big.** The manifest lists `music.wav` at 54.5 MB uncompressed. Poki says players leave if loading takes more than 10 seconds. Re-encode it to OGG or MP3 and update the path in `audio.js`. I have no encoder here.
3. **Leaderboard:** `src/net.js` is now unused. Delete it, or keep it for other portals. Its host is an `example.com` placeholder either way.
4. **Portrait phones:** the 16:9 canvas letterboxes when held upright. Poki asks for full-screen cover in portrait or landscape, so this needs a design decision.
5. **Touch controls** are a first pass. They need a playtest on a real phone.
6. **Credit line:** "Made by Lumen Games" is still in the footer. Poki allows a logo on the loading screen; confirm the text is acceptable during review.
7. **Not yet done:** run the build folder through the Poki Inspector and confirm every lifecycle event fires in order; play-test in a browser; measure performance on a low-end phone. Poki requires the game to run without critical issues for at least 85% of users.
8. `sprites.png` is unused. I left it in place rather than delete an asset.