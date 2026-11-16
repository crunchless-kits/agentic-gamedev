I read all 12 tracked files (198 lines) and changed nothing. The list is ranked by how likely each problem is to get the game rejected or to break it on Poki. I haven't run the game, so I haven't confirmed these in a browser.

## Blockers

1. **The Poki SDK integration is incomplete and fragile.** `src/sdk.js:1-8`, `src/main.js:87-94`
   - The game never calls `PokiSDK.gameLoadingFinished()`, `gameplayStart()` or `gameplayStop()`. Poki reviewers check for these.
   - `initSdk()` runs unguarded. If an ad blocker stops the script, `PokiSDK` is undefined and `boot()` throws. The game then never starts. Poki expects the game to still run in that case.
   - `PokiSDK.init()` rejects when ads are blocked, and there is no try/catch.
   - `showAd()` at `src/sdk.js:6` doesn't mute audio or pause the game during the break, and it has no error handling.

2. **The leaderboard fetch can stop the game from starting.** `src/net.js:1-5`, `src/main.js:90`
   - The URL is plain `http://`. On an https portal the browser blocks it as mixed content, so `fetch` rejects.
   - `boot()` awaits it with no catch, so `newRun()`, `startMusic()` and `loop()` never run. The result is a black screen.
   - Poki also generally disallows calls to your own external services. I'd remove this or make it optional and failure-tolerant.

3. **The 54 MB uncompressed WAV for music is far too big.** `assets/manifest.json:3`, `src/audio.js:1`
   - Poki's load-size limits are far below this, and the game would take minutes to start on mobile.
   - Convert it to a compressed format (ogg/mp3, a few MB) and load it lazily.

4. **A restart adds a new keyboard listener every time.** `src/main.js:23`, `src/input.js:3-10`
   - `newRun()` calls `bindKeys(jump)`, so each restart stacks another `keydown` handler.
   - After N restarts one keypress calls `jump()` N times.
   - On the game-over screen, those extra calls each trigger `restart()`, so you get several `showAd()` calls and several `newRun()` calls at once.
   - Fix: bind once, in `boot()`.

5. **Audio is started without a user gesture.** `src/audio.js:5-13`, `src/main.js:92`
   - `music.play()` is called at boot, so browsers will reject it with `NotAllowedError`. Nothing handles that, so the console fills with unhandled rejections and the music doesn't start.
   - `play(name)` has the same unhandled promise.
   - Start the music on the first input, and add a mute control. Poki expects audio to pause when the tab loses focus.

6. **An external link and branding in the footer.** `index.html:11`
   - The "More games" link to `lumengames.example.com` goes to another site. Poki forbids external links and developer branding that lead players off the portal. Remove the footer.

## Should fix

7. **Game speed depends on the display refresh rate.** `src/main.js:36-55`, `src/main.js:81-85`
   - Movement, gravity and storm speed are applied once per `requestAnimationFrame`, with no delta time.
   - On a 120–144 Hz monitor the game runs about 2× faster than at 60 Hz. Use a fixed-step loop.

8. **`console.log` on every frame.** `src/main.js:54`
   - It logs 60 or more lines a second, which hurts performance and floods the console. Remove it.

9. **Restart has a race and no guard.** `src/main.js:26-34`
   - `state.over` stays true during `await showAd()`, so holding space, which key-repeats, or tapping it again queues more `restart()` calls and more ads.
   - Add a `restarting` flag.

10. **Keyboard input problems.** `src/input.js:4-10`, `src/main.js:39-40`
    - There is no `preventDefault()`, so space and the arrow keys scroll the page inside Poki's iframe.
    - Keys are matched case-sensitively (`"a"`, `"d"`, `"w"`). With Caps Lock or Shift held, movement stops working.
    - Keys aren't cleared on window blur, so a key can stay stuck.
    - Use `e.code`.

11. **There is no mobile or touch support and no scaling.** `index.html:10`, `src/input.js`, `style.css`
    - The canvas is a fixed 960×540. There is no viewport meta tag, no resize or letterbox handling, and no touch controls.
    - Poki requires the game to fit varying iframe sizes, and most of its traffic is mobile.

12. **Saving is unguarded.** `src/save.js:3-10`, `src/main.js:57-62`
    - `JSON.parse` of a corrupt value throws, and that happens inside `boot()`, so the game won't start.
    - `localStorage` can also throw in sandboxed iframes or private mode.
    - Wrap both in try/catch and fall back to in-memory data.
    - Also, `gameOver()` can run twice in one frame, for example when the player touches two storms. That double-counts `data.gems` (`src/main.js:51-60`).

## Minor

13. **Assets listed in the manifest aren't in the repo.** `assets/manifest.json:3-6`
    - Only `manifest.json` is tracked. `music.wav`, `jump.wav`, `gem.wav` and `sprites.png` are missing, so a clean checkout would 404.
    - `sprites.png` (412 KB) is never referenced in the code.
    - Check whether they're gitignored or kept elsewhere.

14. **No build step.** `package.json:6`
    - It only runs `npx serve .`. There is no bundling or minification, and the game loads unbundled ES modules. Poki wants a zipped build, with `index.html` at the root.

15. **Game-over text is positioned by hand.** `src/main.js:78`
    - The text is at a hardcoded x of 380 and isn't centered, and there's no prompt for touch.
    - It also says "Storm got you" when the cause was falling off the map.

16. **The shared `Audio` elements restart on every call.** `src/audio.js:9-13`
    - Setting `currentTime = 0` on rapid gem pickups cuts the previous sound off.

I can turn this into a fix plan, or fix the items in order, whichever you prefer.