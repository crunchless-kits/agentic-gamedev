Skyhop is not ready to submit yet. The code fixes are in the working tree but not committed, and the audio and sprite assets are still missing from the repo, which is a blocker.

**What I changed**

- **Missing audio is now harmless.** The game references `music.wav`, `jump.wav` and `gem.wav`, but only `assets/manifest.json` is tracked. Audio `play()` calls now catch their rejections, so missing or blocked sound no longer throws.
- **Keyboard listeners no longer stack.** `bindKeys` ran on every restart, so each death added another listener and keys fired multiple times. It now binds once at boot. Space and arrows also no longer scroll the page, and held keys clear on window blur.
- **Gems no longer double-count.** `gameOver` could run twice in one frame when two storms hit, adding the gem total twice. It's now guarded.
- **Poki lifecycle calls added.** The game calls loading start and finish, gameplay start on each run and gameplay stop on game over. Audio is muted around `commercialBreak`, and the ad call is wrapped so a failure doesn't break the game.
- **Game still runs without the SDK.** If `PokiSDK` is undefined, every SDK call is a no-op.
- **External link removed.** The footer's "More games" link to `lumengames.example.com` is gone, since Poki's rules don't allow links out of the game.
- **Leaderboard disabled.** `net.js` now returns an empty list. The old endpoint was plain `http://` (blocked as mixed content on Poki's https origin) and a third-party host, and a failed fetch would have blocked boot.
- **Save data is safer.** `save.js` tolerates blocked storage and corrupt JSON.
- **Music starts on first input.** Browsers block autoplay, so the music now starts on the first key press or click.
- **Layout.** The canvas scales down to fit smaller iframes, and the viewport meta tag is added.
- Removed the per-frame `console.log`.

Every `.js` file passes `node --check`. I did not run the game in a browser, so the gameplay changes are checked by reading, not by play.

**Still open**

1. **Assets (blocker).** `music.wav` is 54 MB uncompressed. Add `jump.wav`, `gem.wav` and the music as compressed files (OGG or MP3), and check the result against Poki's size limit. `sprites.png` is listed in the manifest but never used, so it can be dropped.
2. **Verify the Poki SDK calls.** I wrote `gameLoadingStart`, `gameLoadingFinished`, `gameplayStart`, `gameplayStop` and `commercialBreak` from memory of the v2 SDK. Check them against Poki's current developer docs, and run the game in Poki's test sandbox before submitting.
3. **Leaderboard decision.** If you want a leaderboard on Poki, it needs an https endpoint that Poki allows. Otherwise it stays off.
4. **No touch controls.** The game is keyboard-only, so mobile players can't play. Poki serves mobile, so decide whether to add touch input or restrict the submission.
5. **Ad frequency.** Every death triggers a commercial break. That may be fine, but a rewarded break or a less frequent interstitial would be a better fit.

I haven't committed anything, since you asked me to get the game ready, not to commit. Say the word and I'll commit with the message and attribution line.