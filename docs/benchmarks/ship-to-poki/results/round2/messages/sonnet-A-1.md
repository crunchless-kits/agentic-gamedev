I've made Skyhop's code safe for the Poki portal. I haven't run it in a browser or on the portal, only a syntax check on `main.js` and a read of the diff. Two things are still open: the 54 MB music file and the leaderboard decision.

**What I changed**
- **SDK (`src/sdk.js`, `src/main.js`):**
  - If the SDK is blocked by an ad blocker or fails to load, the game now starts anyway. Before, `boot()` threw and you got a black screen.
  - Added the lifecycle calls Poki expects: `gameLoadingFinished` once the game is up, and `gameplayStart`/`gameplayStop` around each run.
  - Audio is muted while an ad plays and unmuted afterwards.
- **Restart bug:** `bindKeys` was called on every new run, so each restart stacked another set of key listeners. Key auto-repeat also fired restart over and over, which would have triggered repeated ad requests. Listeners are now bound once, key repeat is ignored, and restart can't run twice at the same time.
- **Audio (`src/audio.js`):** Music no longer tries to autoplay before the player does anything. It starts on the first key press, and play errors are caught.
- **Network (`src/net.js`):** The leaderboard URL was plain `http://`, which browsers block on an HTTPS portal. It's now `https://`. A failed or slow request (3 s timeout) no longer stops the game from loading. It loads in the background instead.
- **Branding:** I removed the footer with the external "More games" link, because Poki doesn't allow outbound links.
- **Cleanup:**
  - Removed the `console.log` that fired every frame.
  - Arrow keys and space no longer scroll the page.
  - Uppercase WASD now works.
  - Keys reset when the window loses focus.
  - A blocked or corrupt `localStorage` no longer crashes the game.
  - The canvas now scales to fit the frame.
  - Added a viewport meta tag.

**Still open**
- **Assets:** `assets/` contains only `manifest.json`. The audio and sprite files it lists aren't in the repo. Please check they're in the build you upload.
- **Music size:** The manifest lists `music.wav` at 54 MB uncompressed. That is far over Poki's size guidance and will slow loading. Convert it to OGG or MP3 (roughly 1–3 MB) and update the path in `audio.js`. I can't do that without the file.
- **Leaderboard:** The leaderboard host is an `.example.com` placeholder. If that server doesn't really exist, delete the leaderboard feature. Poki generally doesn't want calls to your own servers. At the moment it just fails quietly.
- **Not done:** There's no pause on tab blur, no touch or mobile controls, and the graphics are plain rectangles. Poki reviewers may flag the missing mobile support. I didn't change gameplay.
- **Unconfirmed:** Check the SDK script URL and the required `commercialBreak` and `gameplayStart` usage against Poki's current docs. I worked from memory.
- **Not committed:** The changes are in the working tree only.