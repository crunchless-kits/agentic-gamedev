Skyhop is patched for the Poki rules I could check in the code, but it is not ready to submit. The audio files are missing from the repo, and I could not run the game in a browser, so treat the changes as verified by syntax check only.

**What I changed** (uncommitted, in the working tree)

- **External requests removed:** deleted `src/net.js`, which fetched scores over plain `http://` from an external server, and dropped the "Top" score display. The footer's "More games" link to another site is gone, along with the "Made by Lumen Games" credit line. The Poki SDK script tag stays, since it comes from Poki.
- **Poki SDK events:** `gameplayStart` fires once on the first input of a run, `gameplayStop` on game over and on pause, and neither fires twice in a row. Game over runs `gameplayStop`, then `commercialBreak`, then restarts. Audio is muted during the ad. Everything is a no-op if the SDK is missing, so the game still runs.
- **Pause:** Esc pauses and resumes, which Poki's keyboard rule asks for.
- **Bug fixes:**
  - `bindKeys` used to run on every new run, stacking listeners so jumps doubled. It now runs once at boot.
  - Two storms overlapping in one frame could count gems twice. Game over is now guarded.
  - Held space no longer auto-hops, and arrow keys and space no longer scroll the page.
  - Player x is clamped to the screen.
- **Audio:** music starts on first input, since browsers block autoplay. Failed `play()` calls are caught instead of left as unhandled rejections.
- **Storage:** `localStorage` access is wrapped in try/catch, which Poki requires for incognito.
- **Mobile:** added touch buttons (shown only on coarse-pointer devices), a viewport meta tag, and CSS scaling so the 16:9 canvas fits the window.
- **Cleanup:** removed the per-frame `console.log`. Updated the README controls.

**Still open, before submission**

1. **Audio and sprite files are not in the repo.** `assets/music.wav`, `jump.wav`, `gem.wav`, and `sprites.png` are missing, so the game runs silent. `manifest.json` also lists a 54 MB uncompressed WAV. Add compressed audio (OGG or MP3) and keep the initial download small. Poki's requirements say players leave if loading takes more than about 10 seconds. The manifest is stale and should be updated or removed.
2. **Thumbnails.** Poki requires static and animated thumbnails for a global release. None exist yet.
3. **Portrait mobile.** The canvas is letterboxed in landscape only. Poki wants the game to cover the full screen in portrait or landscape, so this needs layout work or a rotate prompt.
4. **Loading screen.** There isn't one. Poki allows a studio logo there, so the credit could go there instead of the removed footer.
5. **Testing.** Nothing ran in a browser, and I could not load the Poki SDK offline. Test with Poki's own testing tools, check the event sequence, and try the touch controls on a real device.
6. **Leaderboard.** Removed. If you want one back, it has to go through an approved route, since Poki bans external requests by default.

Nothing is committed. I did not run the Poki submission process or the Web Fit testing.