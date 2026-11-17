Skyhop is mostly ready for Poki, but it cannot ship yet: the audio and sprite files are not in the repo. Preflight passes all 20 checks, and nothing is committed.

**Changed**
- **Boot could fail:** `main.js` awaited the Poki init and an external leaderboard fetch with no guard, so a blocked SDK or request stopped the game from starting. The game now starts immediately, and SDK calls are no-ops if the SDK is missing or fails.
- **External requests:** removed the leaderboard fetch (it went to an `http://` host Poki blocks) and deleted `src/net.js`. Poki reviews externally hosted leaderboards case by case, so restore it only if they approve it.
- **Outgoing link:** removed the "More games" link from the footer.
- **SDK lifecycle:** added `gameLoadingFinished`, `gameplayStart` on first input, `gameplayStop` on every game over, and `commercialBreak` on restart followed by `gameplayStart`. Audio is muted and input ignored during the break, and there is a 60-second timeout so a stalled ad can't lock the game. I used the 2026-11-16 snapshot in the skill and did not re-fetch the live docs.
- **Restart bugs:** the key listeners were re-added on every run, and a key press during an ad could start a second ad. Listeners are now bound once and restart is guarded.
- **Frame rate and tab:** movement was per frame, so it ran faster at 144 Hz. It now uses a fixed 60 Hz step. The game also pauses and mutes when the tab is hidden.
- **Page scroll:** arrow keys, space and the wheel no longer scroll the page.
- **Touch:** tapping the middle of the canvas jumps, and holding the left or right side moves. Before, the game had no touch controls at all.
- **Scaling:** the canvas scales to fill the viewport at 16:9.
- **Storage and console:** `localStorage` calls are wrapped in try/catch, the per-frame `console.log` is gone, and the audio `play()` promises no longer produce unhandled rejections.
- **Config:** added `preflight.config.json` for the Poki preflight.

**Still open**
1. **Audio and sprites are missing.** `assets/` tracks only `manifest.json`. `music.wav`, `jump.wav`, `gem.wav` and `sprites.png` are not in git. The manifest also lists the music as 54 MB uncompressed. Add compressed files (OGG or MP3, a few MB total) before submitting. I can't convert them here because there is no ffmpeg.
2. **Poki Inspector run.** Drag the build folder into the Inspector and confirm the event order. I did not do this.
3. **Mobile.** The touch controls and 16:9 scaling are untested on a real phone. Preflight doesn't cover this.
4. **Preflight is not a real browser.** It runs the game in a fake browser, so a real-browser check is still worth doing.
5. **Web exclusivity.** Poki requires that you do not publish the game on other web portals. Confirm that before submitting.
6. **Lumen Games footer.** Confirm the studio name and any logo are cleared for Poki's loading screen.