Skyhop is patched for the Poki-breaking problems I could fix from the code. It is not ready to submit yet. The audio and sprite files are missing from the repo, so the game as it stands will have no sound and no art, and I could not run it in a browser to test.

**What I changed**

- **Missing assets are tolerated.** Audio `play()` errors are swallowed, so a missing `.wav` no longer produces unhandled rejections.
- **Poki SDK lifecycle is wired in.** The game now calls `gameLoadingFinished`, `gameplayStart`, and `gameplayStop` (on game over, during ads, and when the tab is hidden). `commercialBreak` runs with audio muted. If the SDK is missing, the calls become no-ops so the game still runs locally.
- **Ad re-entry is guarded.** Pressing space on the game-over screen can no longer stack multiple ads.
- **Duplicate input bindings are fixed.** `bindKeys` used to run on every restart, which stacked listeners and caused extra jumps. Input is now bound once at boot.
- **Double game-over is fixed.** Two storms hitting in the same frame used to count the gems twice. Game over now runs once.
- **Music starts after a user gesture.** Browsers block autoplay, so music now starts on the first key press or tap.
- **Tap-to-jump is added.** Mobile had no input at all. A tap jumps, but there are still no on-screen left/right controls.
- **Stuck keys are cleared on window blur.**
- **The external "More games" link is removed** from the footer, because Poki doesn't allow links that navigate away from the game.
- **The leaderboard fetch can't stop boot.** It has a 3-second timeout, returns an empty list on any failure, and is skipped if the response is not an array.
- **Save loading is hardened.** Corrupt or blocked `localStorage` no longer throws.
- **Per-frame `console.log` is removed.**
- **Responsive canvas.** A viewport meta tag is added and the canvas scales down to fit narrow screens.

I checked that all modules parse with `node --check`. I did not run the game in a browser, so the gameplay changes are untested.

**Still open (needs you before submission)**

1. **Audio and sprite files are missing.** `assets/` only contains `manifest.json`. The code loads `music.wav`, `jump.wav`, and `gem.wav`, and the manifest lists `sprites.png`. Add them back.
2. **The music is 54 MB uncompressed.** Re-encode it as OGG or MP3 at a much smaller size. I could not do this without the source file and an encoder.
3. **The leaderboard host is `http://scores.lumengames.example.com`.** It is blocked as mixed content on Poki's https page, so it will always fall back to "-". Either move it to https and get Poki's approval for an external backend, or remove it.
4. **Confirm the Poki SDK method names against Poki's current v2 docs.** I used `init`, `gameLoadingFinished`, `gameplayStart`, `gameplayStop`, and `commercialBreak` from memory and did not check them.
5. **Check the game against Poki's current technical requirements.** I have not verified them against the live rules, so there may be other items on the checklist I can't see from the repo.
6. **Mobile has no left/right controls.** Only tap-to-jump works on touch.
7. **The "Made by Lumen Games." credit** is text only now. Confirm that's the wording you want on the portal.

I have not committed anything. Say the word if you want the changes committed on `main`, or on a branch.