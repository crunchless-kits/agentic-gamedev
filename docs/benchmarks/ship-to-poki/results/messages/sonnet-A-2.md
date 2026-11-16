Skyhop is patched, but two things I couldn't fix are still open, and I haven't run it in a browser. I only syntax-checked `main.js`, so please play through one run, including a game over and restart, before you submit. I haven't committed anything.

## What I changed
- **Poki SDK (`src/sdk.js`, `src/main.js`)**
  - The game now boots even if the SDK is blocked by an ad blocker or fails to load. Before, `PokiSDK` was undefined and boot crashed.
  - I added the lifecycle calls Poki expects: `gameLoadingStart` and `gameLoadingFinished`, `gameplayStart` on the first input and after each restart, and `gameplayStop` on game over.
  - Ads now mute the audio while they play, and ad failures no longer block the restart.
- **Duplicate key listeners (`src/input.js`)**: `bindKeys` was called on every new run. After a few restarts, one space press fired several ads and restarts. Listeners now attach once, and a guard stops the restart from firing twice.
- **Autoplay (`src/audio.js`)**: Music used to start at load, which browsers block. It now starts on the first key press.
- **Audio on tab switch**: Sound is muted and the game pauses when the tab is hidden.
- **Leaderboard (`src/net.js`)**: The URL was plain `http`, which is blocked as mixed content on an https portal. A failed fetch also stopped the game from ever starting. The URL is now `https`, a failure returns an empty list, and the fetch no longer blocks startup.
- **External link (`index.html`)**: I removed the footer with the "More games" link to your own site. Poki rejects external links and branding.
- **Save data (`src/save.js`)**: `localStorage` access and the JSON parse are now wrapped, so corrupt or blocked storage can't crash the game.
- **Game speed (`src/main.js`)**: The game ran faster on 144 Hz monitors. It now uses a fixed 60 Hz update step.
- **Game over (`src/main.js`)**: Hitting two storms in one frame counted your gems twice. It now triggers once.
- **Smaller fixes (`src/main.js`, `src/input.js`)**:
  - I removed the `console.log` that fired every frame.
  - Space and the arrow keys no longer scroll the portal page.
  - Keys are case-insensitive, and held keys reset when the window loses focus.
  - There's now a "Press space to start" prompt.

## Still open
1. **`assets/music.wav` is 54 MB.** `assets/manifest.json` lists it, but the audio files and sprites aren't in the repo, so I couldn't convert it. Compress it to OGG or MP3 (roughly 1–2 MB) and update the path in `src/audio.js`. The other WAVs could also be compressed.
2. **Leaderboard host.** `scores.lumengames.example.com` is a placeholder domain. Poki generally doesn't allow calls to your own servers, so I'd remove the leaderboard (`src/net.js` and the "Top" label in `draw`). The game now degrades gracefully if you keep it, but review will probably flag it.
3. **Not tested on the portal.** Check it with Poki's SDK debug mode and their QA tooling. I also didn't check the game against Poki's responsive-size requirements. The canvas is a fixed 960×540 and doesn't scale to the viewport, so on small screens or mobile it won't fit. The game has no touch controls either.
4. **Possibly missing portal requirements.** Poki's checklist may also expect the game to be playable without a mouse click and to run from a single zipped build. `npx serve` is dev-only.