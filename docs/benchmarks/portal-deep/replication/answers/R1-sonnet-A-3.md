I read every tracked file. I didn't edit anything or run the game, so these come from reading the code only. They're ranked by how likely each is to block the Poki submission or break the game.

## Blockers

1. **A failed leaderboard fetch stops the game from starting.** `src/main.js:90` awaits `fetchTopScores()` with no try/catch, and `src/net.js:4-5` doesn't check `res.ok`. If the request is blocked or fails, `boot()` rejects before `newRun()` and `loop()` run, so the player gets a blank screen. The URL at `src/net.js:1` is also plain `http://` on an `.example.com` host, so it's blocked as mixed content on an HTTPS page. Poki also restricts calls to outside servers. Drop the leaderboard or make it optional, use HTTPS, and wrap the call.

2. **Poki SDK lifecycle calls are missing.** Poki's review expects `PokiSDK.gameLoadingFinished()`, `gameplayStart()` and `gameplayStop()`. None of them appear in `src/sdk.js:1-8` or `src/main.js`. Call `gameplayStart()` when a run begins (`src/main.js:91`, and again after a restart). Call `gameplayStop()` in `gameOver()` (`src/main.js:57`), and also on pause or blur.

3. **`PokiSDK.init()` is unguarded.** `src/sdk.js:3` and `src/main.js:88` don't handle a rejected `init()`. Poki's docs say to continue the game when `init()` fails, for example with an ad blocker. As written, an ad-blocker user can't play. The same applies to `commercialBreak()` at `src/sdk.js:7`. Add a `.catch` to both, and add a local stub for development.

4. **The 52 MB uncompressed music file.** `assets/manifest.json:3` lists `assets/music.wav` at 54,525,952 bytes. That is far over Poki's recommended initial download size and will hurt load time and review. Convert it to compressed audio (OGG, MP3 or AAC) at about 1 MB or less, and update `src/audio.js:1`.

5. **The asset files aren't in the repo.** Only `assets/manifest.json` is tracked, so `music.wav`, `jump.wav`, `gem.wav` and `sprites.png` are missing. A build from this repo would 404 on `src/audio.js:1,3`. Confirm they're in the submission bundle. `sprites.png` isn't referenced anywhere in the code either, so either use it or delete it.

## Likely bugs

6. **Mashing space during the restart ad stacks restarts.** `src/main.js:27` calls `restart()` on every jump press while `state.over` is true, and `state.over` stays true until the ad finishes (`src/main.js:32-33`). Each press queues another `showAd()` and `newRun()`. Add a `restarting` guard flag.

7. **Key listeners are added on every run.** `bindKeys(jump)` is called inside `newRun()` at `src/main.js:23`. Every restart adds another pair of `keydown`/`keyup` listeners (`src/input.js:4,8`). One press then fires `jump()` several times, and the extra calls multiply the restart problem above. Bind once, in `boot()`.

8. **Music starts without a user gesture.** `startMusic()` at `src/main.js:92` runs on load, and `music.play()` at `src/audio.js:6` returns a promise that isn't handled. Browsers block autoplay, so you get an unhandled rejection and no music. Start the music on the first key press. Also handle the promise from `play()` at `src/audio.js:12`.

9. **Audio doesn't pause on tab blur and has no mute option.** Poki expects the game to stop audio and gameplay when the tab loses focus. Nothing in the code does this, and there's no mute control.

10. **`console.log` runs every frame.** `src/main.js:54` logs at 60 fps. Remove it.

## Robustness and polish

11. **Saved data isn't validated.** `src/save.js:5` has an unguarded `JSON.parse`, and a corrupt save throws and stops boot. `localStorage` can also throw, for example in a sandboxed iframe, and `src/save.js:9` has no catch. Saves missing `best` or `gems` aren't defaulted either.

12. **Controls are case-sensitive and the page can scroll.** `src/input.js:6` and `src/main.js:39-40` match only lowercase `w`, `a` and `d`, so Caps Lock breaks them. Space and the arrow keys also scroll the page, because there's no `preventDefault()` at `src/input.js:5`. Poki's iframe will scroll.

13. **Physics depend on frame rate.** `src/main.js:36-55` moves a fixed amount per frame, so the game runs about twice as fast on 120 Hz or 144 Hz monitors. Use a delta-time or fixed timestep.

14. **The canvas is fixed at 960×540.** `index.html:10` has no scaling. Poki runs games in a variable-size iframe and on mobile, and there's no touch input at all. Mobile support is strongly encouraged.

15. **The footer has an outbound link.** `index.html:11` links to an external site with "More games". Poki forbids external links and promotion of other sites, so remove it.

16. **Gem count and score handling are weak.** `src/main.js:60` adds gems on game over, so quitting mid-run loses them. `data.gems` is also never displayed.

17. **Minor items:** there's no loading screen. The "Storm got you. Press space." text at `src/main.js:78` is hard-coded at x=380. `package.json:6` uses `npx serve` and has no build step. The version is 0.9.0.

If you want, I can fix items 1–8 first, since those are the ones most likely to get the submission rejected.