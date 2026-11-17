Skyhop now passes all 20 checks in the bundled portal preflight (it was 1 of 20 when I started). It still hasn't been through the real Poki Inspector, and the audio files are missing from the repo.

**What I changed**
- **`src/sdk.js`:** I rewrote the Poki adapter so it works when the SDK is blocked, missing or throwing, which Poki requires. It calls `gameLoadingFinished`, `gameplayStart` and `gameplayStop` as Poki's notes describe.
- **`src/main.js`:**
  - `gameplayStart` fires on the player's first input and `gameplayStop` on death.
  - Restart now runs `commercialBreak`, then `gameplayStart`, with audio muted and input disabled during the break.
  - The game loop uses a fixed 60 Hz timestep, because speed used to depend on frame rate.
  - It pauses and mutes when the tab is hidden.
  - I removed the per-frame `console.log`.
- **`src/input.js`:** Listeners are bound once instead of piling up on every restart. Arrow keys, space and the wheel no longer scroll the host page. I added basic touch controls (left third, right third, tap to jump).
- **`src/audio.js`:** Music starts on the first input, and a blocked or failed `play()` or a missing file no longer crashes the game.
- **`src/save.js`:** The save is wrapped in try/catch and validated, so incognito storage or a corrupt save no longer breaks boot.
- **`src/net.js`:** I deleted it and removed the leaderboard "Top" score. It fetched from an `http://` address and blocked boot on failure. Poki blocks external requests by default.
- **`index.html` and `style.css`:** I removed the "More games" external link and the footer, which Poki prohibits. I added a viewport meta tag, and the canvas now scales to a 16:9 frame.
- **`preflight.config.json`:** New, so the checks can be rerun.

**What is still open**
1. **Audio and sprite files are missing.** `assets/` only has `manifest.json`, with no `music.wav`, `jump.wav`, `gem.wav` or `sprites.png`. The game runs without them, but silently. Add the real files before you submit.
2. **The music is too big.** The manifest lists it at 54 MB uncompressed, and Poki warns players leave if loading takes over 10 seconds. Compress it to ogg or mp3 and consider loading it lazily.
3. **The Poki Inspector hasn't been run.** The preflight is a mock, and the Inspector is the real check. Drag the folder into it and confirm the event order. I also worked from the repo's Poki notes dated today and did not re-fetch the live docs.
4. **Touch and mobile are untested.** I only reviewed the touch controls by reading the code. Check them on a real phone or tablet.
5. **Leaderboard decision.** If you want it back, it must be https, and Poki reviews external leaderboards case by case. Otherwise, remove the unused `leaderboard` code paths from your plans.
6. **Web exclusivity.** Poki's terms say you can't publish the same game on other web portals. Check that with your plans, and have a lawyer review it if it matters.
7. **No ad-rewarded flow exists,** so there was nothing to wire there.

I haven't committed anything.