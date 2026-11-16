Skyhop is patched for the Poki SDK rules I could verify, but it is not ready to submit yet. The biggest open problem is that the game's audio and sprite files are missing from the repo.

**What I changed** (uncommitted, in the working tree)

- **Lifecycle calls:** Added `gameLoadingFinished`, `gameplayStart` on the first input of a run, `gameplayStop` on game over, and `commercialBreak` on restart. Restart is guarded so repeated key presses can't fire multiple ads.
- **Ad handling:** Audio mutes and input and simulation pause while an ad plays. A 60-second timeout stops a stuck ad from freezing the game.
- **SDK failure:** If the SDK is missing or init fails or times out after 4 seconds, the game runs with no SDK calls. Before, a missing SDK stopped boot entirely.
- **External requests:** Removed the HTTP leaderboard fetch (`src/net.js`, deleted) and the "More games" outgoing link. The "Top" HUD entry is gone with it.
- **Input:** Space and arrow keys no longer scroll the page. Added touch controls: hold the left or right third to move, tap the middle to jump. Key listeners are bound once instead of on every restart.
- **Mobile layout:** Added the viewport meta tag and made the canvas scale to fit at 16:9.
- **Cleanup:** Removed the per-frame `console.log`. Storage calls are wrapped in try/catch, as Poki requires for incognito.

**Verification**

- The Poki order in a mocked run matched the documented sequence: `init`, `loadingFinished`, `gameplayStart`, `gameplayStop`, `commercialBreak`, `gameplayStart`.
- With no SDK present, the game ran without throwing.
- Nothing has been run in a real browser or in the Poki Inspector.

**Still open**

1. **Missing assets (blocker).** `assets/` contains only `manifest.json`. `music.wav`, `jump.wav`, `gem.wav`, and `sprites.png` are not in git. Without them, sound fails silently. The 54 MB uncompressed `music.wav` also breaks Poki's 10-second loading limit, so it needs re-encoding to OGG or MP3. I have no encoder here.
2. **Leaderboard.** Poki blocks external requests by default. If you want a leaderboard, it needs Poki approval through Settings > CSP over HTTPS, plus a hosted privacy policy.
3. **Poki Inspector run.** Drag the build into the Inspector and confirm the event log matches. This needs you, since it's a UI tool.
4. **Browser check.** Test the layout and touch controls on a real phone. The touch scheme is new and untested.
5. **Docs freshness.** The Poki SDK page I read has no version number or date, so the SDK version is unknown. The docs also don't say how `adsBlocked` behaves, so I didn't use it.
6. **Submission metadata.** The thumbnail, title, description, and submission form are not in the repo.

I did not commit anything; the changes are in the working tree for you to review.