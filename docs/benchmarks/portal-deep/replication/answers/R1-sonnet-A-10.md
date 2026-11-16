Audit of Skyhop for Poki submission (no files edited). Ranked most severe first.

**Blockers (likely rejection or broken game)**

1. **`assets/manifest.json:3`: a 54.5 MB uncompressed WAV soundtrack.** It is loaded by `src/audio.js:1`. Poki enforces a small initial download size, and this file is about 100 times the other assets combined. Convert it to compressed OGG or MP3, which should be 1–3 MB, and update `src/audio.js:1`.

2. **`src/main.js:87-94` and `src/net.js:3-6`: `boot()` can hang the game on a failed leaderboard request.** `fetchTopScores()` is awaited before `newRun()` and `loop()`. `net.js` has no try/catch and no timeout. If the request fails, the game never starts and you get a black canvas. The leaderboard URL is also a placeholder `.example.com` host, so it will always fail. Wrap the call in a catch that returns `[]`, and don't block startup on it.

3. **`src/net.js:1`: the leaderboard uses plain `http://` and is a third-party call.** The game is served over HTTPS, so the browser blocks it as mixed content. Poki also restricts external network requests and custom backends. Remove it, or use Poki-approved alternatives.

4. **`index.html:11`: an external "More games" link to your own site.** Poki rejects links that send players off-platform and branding that promotes other portals. Remove the whole footer.

5. **`src/audio.js:6` and `src/main.js:92`: music starts without a user gesture.** `music.play()` returns a promise that rejects under browser autoplay policy, so it throws an unhandled rejection and there is no music. Start audio on the first keypress instead.

**Poki SDK integration (required by Poki)**

6. **`src/sdk.js` and `src/main.js:87-94`: `gameLoadingFinished` and gameplay events are never called.** Poki requires `PokiSDK.gameLoadingFinished()` after loading. It also requires `gameplayStart()` when play begins and `gameplayStop()` on game over, and `newRun()` and `gameOver()` don't call them. Add wrappers in `sdk.js` and call them from `main.js`.

7. **`src/sdk.js:2-4`: no error handling around `PokiSDK.init()`.** If the SDK is blocked by an ad blocker, `init()` rejects and the game never boots. The Poki docs show the pattern of continuing in the `.catch`. Do the same for `commercialBreak()` at `sdk.js:7`, which `restart()` awaits at `main.js:32`. A failed break would leave the player stuck on the game-over screen.

8. **`src/main.js:31-34`: the ad is requested before gameplay has stopped.** There is no `gameplayStop()` before `commercialBreak()`. Also, `restart()` is async and `jump()` calls it on every keypress while `state.over` is true. Holding or mashing space fires multiple ads and multiple `newRun()` calls. Add an "ad in progress" guard.

9. **No `PokiSDK.setDebug` setup, and the page has no way to mute or pause during ads.** Game audio and input should be paused during ad breaks. This is lower severity than items 6–8 but is part of the QA review.

**Bugs**

10. **`src/main.js:23` (via `src/input.js:3-11`): `bindKeys(jump)` is called on every `newRun()`.** After N restarts there are N sets of listeners, so one press calls `jump()` N times. On game over, the first handler calls `restart()` several times, which stacks ads and runs. Call `bindKeys` once from `boot()`.

11. **`src/input.js:6`: space and arrow keys aren't `preventDefault`ed.** In Poki's iframe, space and the arrow keys scroll the page. Also, `e.key === "w"` fails with Caps Lock or Shift. Compare using `e.code` or lowercase the key. `main.js:39-40` has the same case problem with `keys.a` and `keys.d`.

12. **`src/main.js:36-55` and `:81-85`: movement is tied to the frame rate.** `update()` runs once per `requestAnimationFrame`. On 120/144 Hz displays the game runs 2.4 times faster than at 60 Hz. Use a fixed timestep or delta time.

13. **`src/main.js:59-60`: `data.best` and `data.gems` are updated on game over, but `gameOver()` can run several times.** `update()` returns early once `state.over` is set, but `gameOver()` is called from inside the storm loop at `main.js:51`. If both storms overlap the player in the same frame, or the player falls at `main.js:53` in the same frame, gems are counted twice and `save` runs twice. Add an early `if (state.over) return;` in `gameOver()`.

14. **`src/save.js:3-10`: no error handling for `localStorage`.** `JSON.parse` throws on corrupt data. `localStorage` itself can throw in a sandboxed iframe or with third-party storage blocked. That would break boot at `main.js:89`. Wrap both calls in try/catch and fall back to defaults.

15. **`src/audio.js:9-13`: no guard on `play()`.** The `s.play()` promise can reject, which gives unhandled rejections. Rapid gem pickups also restart the same `Audio` element. Catch the rejection, and consider Web Audio for overlapping sounds.

**Polish / cleanup**

16. **`src/main.js:54`: `console.log` on every frame.** It floods the console and hurts performance. Remove it.

17. **`src/main.js:78`: the game-over text says "Press space" but `main.js:39-40` and `input.js:6` accept other keys.** There is also no touch or mouse input at all. Poki requires mobile support, or the game must be flagged desktop-only. Add touch controls for jump and move.

18. **`index.html:10`: the canvas is fixed at 960×540 with no scaling.** Poki embeds the game at variable sizes. Scale it to the iframe with CSS and keep the aspect ratio.

19. **`package.json:3`: version `0.9.0`.** It's a minor point, but check that this is the build you intend to ship.

Items 1–8 are the ones I'd treat as blocking for next week. Items 10, 13 and 14 are real gameplay or stability bugs that Poki QA would likely hit.