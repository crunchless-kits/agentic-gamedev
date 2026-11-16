I read all 14 project files and didn't edit anything. This is a static review only: I didn't run the game or check Poki's current policies, so the Poki-specific points are from memory and should be checked against their docs.

## Ranked problems

**Blockers (game broken or unsubmittable)**

1. **Audio assets are missing from the repo.** `assets/` contains only `manifest.json`, but `audio.js:1` and `audio.js:3` load `music.wav`, `jump.wav` and `gem.wav`, and `manifest.json:24-27` lists them. Missing files mean no sound, and `play()` in `audio.js:10-12` throws on `s.currentTime` when a sound is absent.
2. **Leaderboard is unreachable and blocks startup.** `net.js:1` points to `scores.lumengames.example.com`. The `.example.com` domain is reserved and won't resolve. `main.js:90` awaits that fetch with no `try/catch`, so `boot()` never reaches `newRun()` and `loop()` (`main.js:91-93`). The result is a blank canvas.
3. **Leaderboard uses plain `http://`.** `net.js:1` is insecure. Poki serves games over HTTPS, so the browser blocks this request as mixed content. It's the same failure as item 2 on Poki.
4. **Poki SDK failure leaves a blank game.** `sdk.js:3` calls `PokiSDK.init()` directly. If the SDK script at `index.html:7` fails to load (ad blocker, network), `PokiSDK` is undefined. `boot()` (`main.js:87-96`) has no catch, so nothing renders.
5. **No gameplay start/stop events.** Poki needs `gameplayStart()` and `gameplayStop()` around play. `sdk.js` has neither, and `main.js:91-93` never calls them. Game-over and ads (`main.js:57-58`, `31-33`) don't call `gameplayStop()` either.
6. **Keyboard-only controls.** `input.js:4-6` only handles keys, and `style.css:2` with `index.html:10` gives a fixed 960×540 canvas with no viewport meta tag (`index.html:3-4`). Most Poki traffic is mobile, so the game is effectively unplayable there.

**High**

7. **Restart fires ads repeatedly and stacks listeners.** `newRun()` calls `bindKeys(jump)` (`main.js:23`) every time, and `bindKeys` adds new window listeners on each call (`input.js:3-7`) with no removal. After a few runs, one key press calls `jump()` several times. Holding space also auto-repeats keydown (`input.js:6`, no `e.repeat` check), so `restart()` (`main.js:31-34`) can run several times, opening several `showAd()` commercial breaks.
8. **Audio isn't muted during ads.** `restart()` (`main.js:31-33`) calls `showAd()` while music keeps playing. Poki expects audio muted during commercial breaks.
9. **Autoplay rejection is unhandled.** `startMusic()` (`main.js:92`, `audio.js:5-7`) calls `music.play()` before any user gesture, so the browser rejects it. Neither `audio.js:6` nor `audio.js:12` handles the rejected promise.
10. **Game-over runs twice in a frame.** `update()` keeps looping after `gameOver()` at `main.js:51`, so a second storm overlap or the fall check at `main.js:53` calls `gameOver()` again. That re-runs `data.gems += ...` (`main.js:60`) and saves twice, double-counting gems.
11. **54 MB uncompressed music.** `manifest.json:24` lists `music.wav` at 54,525,952 bytes ("uncompressed"). That will hurt load time on mobile and likely fails Poki's performance bar. Re-encode to OGG/MP3.
12. **External "More games" link.** `index.html:11` links to another site. Poki generally prohibits links that take players away from the game; remove it or confirm it's allowed.

**Medium**

13. **Corrupt save crashes boot.** `save.js:5` calls `JSON.parse` with no `try/catch`, and `boot()` calls `load()` at `main.js:89`. Bad localStorage data stops the game from starting. `localStorage` access can also throw in sandboxed iframes.
14. **Debug logging every frame.** `main.js:54` calls `console.log` on every frame. Remove it.
15. **Space and arrows scroll the page.** `input.js:6` doesn't call `preventDefault()`, so space and arrow keys scroll the page inside the Poki iframe.
16. **Stuck keys on focus loss.** `input.js:8-10` only clears keys on `keyup`. If the window loses focus while a key is held, the player keeps moving.
17. **No edge clamp.** `main.js:39-40` doesn't limit `p.x`, so the player can walk off either side of the canvas.

## Suggested order

Fix 1 through 6 first; without them the submission either breaks or fails Poki's requirements. Then 7 and 8, since those affect the ad flow Poki reviews. The rest is polish.