Skyhop now has fixes for the main Poki rejection and breakage risks I found. I haven't run it in a browser or in the Poki Inspector, so none of this has been tested end to end. The only check was a syntax pass on all the JS files, which was clean. The changes are uncommitted in the working tree.

**What I changed**
- **`index.html`:**
  - Removed the "More games" footer link. It was an external link opening a new tab, which Poki forbids.
  - Added a viewport meta tag.
- **`src/sdk.js`:**
  - Rewrote the wrapper. Every call is now a no-op if the SDK is missing, blocked or rejects `init()`, so the game still starts without it.
  - Added `gameLoadingFinished`, `gameplayStart` and `gameplayStop`, which were missing entirely.
  - `commercialBreak` takes an on-ad-start callback and can't throw.
- **`src/main.js`:**
  - Wired the Poki lifecycle in the documented order:
    - Loading finished is sent once.
    - `gameplayStart` is sent on the first input.
    - `gameplayStop` is sent on death, on tab hide and before an ad.
    - After the ad, `gameplayStart` is sent again.
  - The simulation is paused and input ignored during an ad, and audio is muted when an ad actually plays.
  - Mashing space during an ad no longer stacks extra ads and restarts.
  - Replaced the frame-rate-dependent loop with a fixed 60 Hz step. Before, the game ran 2.4 times too fast on a 144 Hz monitor.
  - Removed the per-frame `console.log`.
  - Removed the leaderboard fetch from boot. It was plain `http://` to a `.example.com` host. On Poki's https page, the browser would block it as mixed content. A failed fetch also threw before the game started, so the game never started.
- **`src/input.js`:**
  - Key listeners were re-added on every restart, so each restart multiplied the jumps. They are now bound once.
  - Added touch controls (left third moves left, right third moves right, middle jumps), since mobile support is required.
  - Arrow keys and space no longer scroll the portal page, and keys release on window blur.
- **`style.css`:** The canvas now scales to the viewport and keeps its aspect ratio. I removed the footer style.
- **`src/audio.js`:**
  - Music now starts from the first input. Before, it started on load, where browsers block autoplay, and the unhandled rejection was thrown.
  - `play()` rejections are swallowed, and there's a mute switch for ads.
- **`src/save.js`:** `localStorage` access and `JSON.parse` are wrapped so blocked storage or a corrupt save can't crash boot.

**Still open**
1. **Assets are missing from the repo.** Only `assets/manifest.json` is tracked. `music.wav`, `jump.wav`, `gem.wav` and `sprites.png` aren't there. The code no longer crashes without them, but you need to confirm they ship in the submitted build.
2. **`music.wav` is about 54 MB, uncompressed.** That will fail the load-time and size expectations. Convert it to OGG or MP3, which should bring it to a few MB, and update the paths in `src/audio.js` and the manifest. I can't do the audio conversion here.
3. **Leaderboard:** `src/net.js` is now unused, and the "Top" score is gone from the HUD. If you want the leaderboard back, it needs an `https` endpoint, a timeout, a failure fallback and a check that Poki allows the request.
4. **Poki Inspector:** I couldn't run it. Drag the build into it and confirm the event order is load finished, `gameplayStart`, `gameplayStop`, `commercialBreak`, `gameplayStart`.
5. **Docs check:** I relied on the repo's Poki notes, last verified 2026-11-06, and didn't re-fetch the live docs. Re-check the current submission rules before you submit.
6. **Testing and policy:**
   - I haven't tried the touch controls on a real phone.
   - There's no mute button or rewarded-ad flow.
   - There's no consent handling, which only matters if you add tracking.