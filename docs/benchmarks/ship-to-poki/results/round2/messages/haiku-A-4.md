I made the code changes, but Skyhop isn't ready to submit yet. The four audio/sprite files it loads are missing from the project, and I couldn't verify the Poki SDK calls against current docs.

**Changed (uncommitted, in the working tree):**

- **`index.html`**: removed the "More games" link to an external site. Poki doesn't allow links that send players off the portal.
- **`src/main.js`**:
  - Keyboard listeners were bound on every restart, stacking duplicates. They're now bound once at boot.
  - Game-over could double-count gems when two checks fired in the same frame. It's now guarded.
  - Removed the per-frame `console.log`.
  - Added a guard so repeated space presses can't stack ad breaks, and music pauses during an ad.
  - The leaderboard no longer blocks the game from starting.
  - Added the Poki hooks: `gameLoadingFinished`, `gameplayStart` on the first input, `gameplayStop` on game over.
  - Music starts on first input, since browsers block autoplay.
- **`src/sdk.js`**: every Poki call is guarded, so the game still runs if the SDK script fails to load. Ads take mute/unmute callbacks.
- **`src/net.js`**: the leaderboard URL is now `https://` (the `http://` URL would be blocked as mixed content on Poki's https page). Failures return an empty list.
- **`src/save.js`**: `localStorage` errors are caught.
- **`src/audio.js`**: rejected `play()` promises are caught, and unknown sound names are ignored.
- **`src/input.js`**: letter keys are normalised so Shift/CapsLock work. Space and arrows no longer scroll the page. Held keys are cleared on window blur. Jump ignores key-repeat.

All modules pass `node --check`. I did not run the game in a browser.

**Still open, in priority order:**

1. **Missing assets.** `assets/music.wav`, `jump.wav`, `gem.wav`, and `sprites.png` are referenced in the manifest and code but aren't in the repo or on disk. Without them there's no sound. Please send the files.
2. **Music size.** `music.wav` is 54.5 MB uncompressed. Re-encode it to OGG or MP3 and update the path in `src/audio.js`. There's no ffmpeg on this machine, so I couldn't do it.
3. **Leaderboard endpoint.** `scores.lumengames.example.com` is a placeholder. Confirm the real HTTPS endpoint exists and allows requests from Poki's domain, or remove the feature. Also check whether Poki allows third-party score servers.
4. **Poki SDK method names.** I used the v2 names (`init`, `gameLoadingFinished`, `gameplayStart`, `gameplayStop`, `commercialBreak`) from memory. Check them against Poki's current developer docs.
5. **Poki guidelines I haven't checked.** The game is keyboard-only, so it needs touch controls for mobile. The canvas is fixed at 960×540 with no scaling. Confirm against Poki's current rules.
6. **`assets/manifest.json`** lists `sprites.png`, which the code never uses. Drop it or leave it.

I haven't committed anything since you didn't ask me to. Say the word and I'll commit, or I can do the touch controls and scaling next.