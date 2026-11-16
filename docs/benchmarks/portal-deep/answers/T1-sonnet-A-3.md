I read every file in the repo and didn't edit anything. I haven't run the game, so these come from reading the code. Ranked by how likely each is to block a Poki submission or break the game:

**Blockers (likely rejection or a broken game)**

1. **Soundtrack is 54.5 MB of uncompressed WAV.** `assets/manifest.json:3` and `src/audio.js:1`. It's far over Poki's size and load-time expectations. Convert it to compressed OGG/MP3 (about 1–3 MB) and stream or lazy-load it. The other `.wav` files could also be compressed.
2. **`gameplayStart()` and `gameplayStop()` are never called.** `src/sdk.js:1-8` and `src/main.js:87-94`. Poki requires them around active play, which includes the start of a run, game over and restart. Only `init` and `commercialBreak` are wrapped.
3. **Music autoplays at boot with no user gesture.** `src/main.js:92` and `src/audio.js:6`. Browsers block it, so `music.play()` rejects with nothing catching it. Poki also forbids audio before interaction. Start the music on the first key press or click, and handle the rejected promise.
4. **Audio isn't muted during ads.** `src/main.js:32` and `src/audio.js`. Poki requires muting around `commercialBreak`. There's also no mute or pause handling when the tab loses focus.
5. **A failed leaderboard fetch stops the game from starting.** `src/net.js:1-5` and `src/main.js:90`. The URL is plain `http://` on a placeholder domain. On Poki's https page it's blocked as mixed content, and there's no try/catch, so `boot()` throws before `newRun()` and `loop()`. Poki generally disallows calls to your own backend too. Remove it, or wrap it and fall back to `[]`.
6. **`PokiSDK` is undefined if the script is blocked.** `src/sdk.js:3`. Ad blockers are common, and `PokiSDK.init()` then throws a ReferenceError that stops boot. Guard it and use `.catch` the way Poki's docs show. `commercialBreak` at `src/sdk.js:7` has the same problem.
7. **External branding and link in the page.** `index.html:11`. Poki disallows outbound links and "More games" promotion. Remove the footer.

**Real bugs**

8. **Key listeners are added again on every restart.** `src/main.js:23`. `newRun()` calls `bindKeys(jump)` each time, so after N restarts one key press fires `jump` N times. Move the call into `boot()` so it runs once.
9. **Restart can fire repeatedly.** `src/main.js:27-34`. `state.over` stays true while `await showAd()` runs, so every space press or key-repeat during the ad calls `restart()` again. That means stacked ads and multiple `newRun()` calls. Add a `restarting` flag.
10. **`gameOver()` can run more than once per frame.** `src/main.js:51,53,57-61`. If the player touches two storms, or a storm and the fall line, `data.gems` is added to twice and the file is saved twice. Add an early return when `state.over` is already true.
11. **Space and arrow keys scroll the page.** `src/input.js:6`. There's no `preventDefault`, which matters inside Poki's iframe.
12. **A and D don't work with Caps Lock or Shift.** `src/main.js:39-40`, `src/input.js:5`. Keys are stored by `e.key`, so `"A"` isn't `"a"`. Use `e.code` or lowercase the key. Jump uses `"w"` the same way.

**Robustness and polish**

13. **Speed depends on frame rate.** `src/main.js:36-55`. The game uses fixed per-frame increments with no delta time, so it runs about 2.4× faster on 144 Hz monitors. Use a fixed timestep.
14. **A corrupt save crashes boot.** `src/save.js:5,9`. `JSON.parse` and `localStorage` have no try/catch. `localStorage` can throw in sandboxed iframes or private mode.
15. **`console.log` on every frame.** `src/main.js:54`. Remove it.
16. **The canvas is a fixed 960×540 and doesn't scale.** `index.html:10` and `style.css:2`. Poki runs in varied iframe sizes and on mobile. It needs responsive scaling, and touch controls if you want mobile approval.
17. **Sound effects aren't guarded.** `src/audio.js:9-13`. `play()` rejections are unhandled, and one shared `Audio` element per sound cuts off overlapping plays.
18. **Nothing stops the player leaving the screen.** `src/main.js:39-40`. There's no x clamp, so the player can walk off the side of the screen.

**Also check:** `assets/manifest.json` lists four asset files, but none of them are in the repo. Only the manifest is committed. Confirm they exist in your build, or the game will 404 on audio at load.