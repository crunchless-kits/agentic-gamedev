# Audit: Skyhop (v0.9.0)

Stack: plain JavaScript (ES modules), no framework, no bundler, no TypeScript, no lockfile. Poki SDK v2 loaded from CDN.
Build: no build step. `npm start` is `npx serve .` (dev only). Nothing to compile. Not verified in a browser; this is a read-only review.

## Findings (ranked)

1. **[blocker] Music is a 54.5 MB uncompressed WAV.**
   Evidence: `assets/manifest.json:3` (`music.wav`, 54,525,952 bytes, "uncompressed"); loaded at `src/audio.js:1`, started at `src/main.js:92`.
   Impact: the first-load time on a portal is unacceptable, and the file is far beyond what a portal submission should carry. Re-encode to OGG/MP3 (a few MB at most).
   Route to: cl-web:web-harness (assets), then cl-release:game-performance-engineer if load times need measuring.

2. **[blocker] Boot has no fallback if the leaderboard request fails, and the URL is plain HTTP.**
   Evidence: `src/net.js:1` (`http://scores.lumengames.example.com/...`), `src/net.js:4-5` (no try/catch around `fetch`), `src/main.js:90` (awaited during boot), `src/main.js:87-96` (`boot()` has no `.catch`).
   Impact: on an HTTPS portal the browser blocks this as mixed content. The `fetch` rejects, `boot()` rejects before `newRun()` and `loop()` run, and the player sees a blank canvas. Use HTTPS, make the leaderboard optional, and catch the error.
   Route to: cl-web:web-game-developer.

3. **[blocker] Boot also fails hard if the Poki SDK does not load.**
   Evidence: `index.html:14` (synchronous SDK tag in `<head>`), `src/sdk.js:99` (`PokiSDK.init()` with no guard), `src/main.js:88` (awaited first in `boot()`).
   Impact: an ad blocker or CDN failure throws a ReferenceError before the game starts, with the same blank-canvas result. Guard with `typeof PokiSDK`, and start the game regardless of SDK state.
   Route to: cl-core:cl-port (Poki adapter).

4. **[blocker] The Poki integration is incomplete: no loading-finished or gameplay start/stop signals.**
   Evidence: `src/sdk.js:1-8` exposes only `init` and `commercialBreak`. `src/main.js:87-94` never signals loading complete. `gameplayStart` and `gameplayStop` appear nowhere in `src/`.
   Impact: Poki's SDK expects these calls, and missing them is a likely submission rejection. Confirm the exact list against Poki's current SDK docs before adding them.
   Route to: cl-core:cl-port.

5. **[high] Game audio is not muted or paused during the commercial break, and nothing pauses when the tab is hidden.**
   Evidence: `src/main.js:31-34` (`restart()` calls `showAd()` with no mute or pause), `src/audio.js:5-7` (music has no stop or mute API). No `visibilitychange`, `blur`, or pause handling anywhere in `src/`.
   Impact: music keeps playing through ads and while the tab is in the background, which portals reject. Add mute/unmute around `commercialBreak`, and pause on hide or focus loss.
   Route to: cl-core:cl-port, cl-web:web-game-developer.

6. **[high] No touch or mobile input.**
   Evidence: `src/input.js:21-27` binds only `keydown` and `keyup`. No `pointer`, `touch`, or on-screen control code exists in `src/`.
   Impact: Poki traffic is heavily mobile, and the game cannot be played there at all. Add a tap-to-jump plus left/right touch zones or on-screen buttons.
   Route to: cl-web:web-game-developer, cl-design:game-ui-ux-designer.

7. **[high] Fixed 960×540 canvas with no scaling.**
   Evidence: `index.html:17` (`width="960" height="540"`), `style.css:31` (canvas centered, no sizing rule).
   Impact: on phones and non-16:9 windows the game is tiny or cropped. Scale the canvas to fit while keeping the aspect ratio.
   Route to: cl-web:web-harness.

8. **[high] Physics is frame-bound, not time-based.**
   Evidence: `src/main.js:36-42` (fixed per-frame velocity and gravity, no `dt`), `src/main.js:81-85` (`requestAnimationFrame` loop).
   Impact: at 120 Hz or 144 Hz the game runs 2–2.4× too fast, which makes it unplayable on many monitors. Pass a delta time to `update` or use a fixed timestep accumulator.
   Route to: cl-web:web-game-architecture.

9. **[high] Key auto-repeat restarts the game and triggers repeated ads.**
   Evidence: `src/input.js:23` (no `e.repeat` check), `src/main.js:26-27` (`jump` calls `restart()` when `state.over`), `src/main.js:31-34` (each call awaits `showAd()`).
   Impact: holding space after a death fires several `commercialBreak` calls and several `newRun()` calls in a row. Ignore `e.repeat` events and guard against a restart already in progress.
   Route to: cl-web:web-game-developer.

10. **[high] Ad failure leaves the player stuck on the game-over screen.**
    Evidence: `src/main.js:31-34` (`await showAd()` with no try/catch), `src/sdk.js:102-103`.
    Impact: if `commercialBreak` rejects, or the SDK is blocked, `newRun()` never runs and space does nothing. Wrap the call so the run restarts either way.
    Route to: cl-core:cl-port.

11. **[high] Per-frame `console.log` in the game loop.**
    Evidence: `src/main.js:54`.
    Impact: 60 log lines per second, which costs frame time and floods the console during review. Remove it.
    Route to: cl-web:web-harness (profiling).

12. **[medium] Autoplay: audio starts and plays before any user gesture, and promise rejections are unhandled.**
    Evidence: `src/main.js:92` (`startMusic()` runs in `boot()` with no gesture), `src/audio.js:6` (`music.play()` promise ignored), `src/audio.js:12` (`s.play()` promise ignored).
    Impact: browsers block playback until the player interacts, which produces unhandled rejections. Start music on the first key or tap, and catch the promises.
    Route to: cl-web:web-game-developer.

13. **[medium] Gems can be double-counted on death.**
    Evidence: `src/main.js:51` (storm overlap calls `gameOver()` inside the loop), `src/main.js:53` (fall death also calls it), `src/main.js:57-61` (`gameOver` adds taken gems to `data.gems` every call and never checks `state.over`).
    Impact: a frame where two storms overlap, or a storm and a fall both fire, counts the gems twice and saves the inflated total. Return early in `gameOver` if `state.over` is already set.
    Route to: cl-web:web-game-developer.

14. **[medium] Arrow keys and space scroll the page while playing.**
    Evidence: `src/input.js:21-23` (no `preventDefault`).
    Impact: the page scrolls under the game on keypress. Call `preventDefault` on game keys.
    Route to: cl-web:web-game-developer.

15. **[medium] Held keys stick when focus leaves the window.**
    Evidence: `src/input.js:25-27` (no `blur` handler).
    Impact: release a key outside the window and the player keeps moving. Clear `keys` on `blur` and `visibilitychange`.
    Route to: cl-web:web-game-developer.

16. **[medium] Corrupt save data stops the game from booting.**
    Evidence: `src/save.js:18` (`JSON.parse` with no try/catch), `src/main.js:89` (`load()` runs during boot).
    Impact: one malformed localStorage value means a blank canvas on every visit. Wrap the parse, fall back to defaults, and add a schema version field.
    Route to: cl-web:web-game-developer.

17. **[medium] Outbound "More games" link in the footer.**
    Evidence: `index.html:18` (`target="_blank"` to `lumengames.example.com`).
    Impact: outbound promotional links are commonly restricted on portals. Check Poki's current guidelines before submitting, and remove the link if it is not allowed. Also add `rel="noopener"`.
    Route to: cl-platforms:platforms-hub.

18. **[medium] No player bounds.**
    Evidence: `src/main.js:39-40` (x is unclamped).
    Impact: the player can walk off either edge of the canvas and only dies by falling. Clamp `p.x` to 0–(960−w).
    Route to: cl-design:core-loop-design.

19. **[low] The Poki SDK script blocks parsing in `<head>`.**
    Evidence: `index.html:14` (no `async` or `defer`).
    Impact: a slower CDN delays first paint. Load it with `async` and handle an absent SDK (see #3).
    Route to: cl-web:web-harness.

20. **[low] `sprites.png` is never used.**
    Evidence: `assets/manifest.json:6` (412,330 bytes). No reference to `sprites.png` in `src/` or `index.html`; the game draws everything with `fillRect`.
    Impact: about 400 KB of unnecessary download. Remove it, or start using it.
    Route to: cl-core:cl-ship (size check).

21. **[low] Key handling is case-sensitive and partial.**
    Evidence: `src/input.js:23` (`"w"` only), `src/main.js:39-40` (`keys.a`, `keys.d` only).
    Impact: caps lock or shift can make the controls dead. Normalize keys to lowercase.
    Route to: cl-web:web-game-developer.

22. **[low] Score display assumes the leaderboard response shape.**
    Evidence: `src/main.js:77` (`topScores[0]?.score`), `src/net.js:5` (`res.json()` returned as-is).
    Impact: if the response shape changes, the HUD shows "-" or throws. Validate the response in `net.js`.
    Route to: cl-web:web-game-developer.

## What is healthy

- Static, no-build layout with `index.html` at the root: easy to zip for a portal (`index.html`, `package.json`).
- The collision helper is simple and correct: `src/world.js:15-17` (`overlap`).
- Game state is rebuilt cleanly per run: `src/main.js:13-24`.
- Save uses localStorage with a single key: `src/save.js:14-23`.
- The core loop is simple and readable: `src/main.js:81-85`.

## Handoff

Changed: nothing (audit only).
Evidence: read all 12 tracked files (`package.json`, `index.html`, `README.md`, `assets/manifest.json`, `src/*.js`, `style.css`). Did not run the `ts_health.mjs` script (no TypeScript in this project), did not run `npm start` or a browser, and did not load the Poki SDK.
Verify: serve the folder, block `game-cdn.poki.com` in devtools, and reload. The blank canvas confirms #3. Set the display to 144 Hz to see #8. Open devtools on a phone-sized viewport to see #6 and #7.
Open: Poki's current SDK requirements and portal rules (#4, #5, #17) were not checked against live docs. Confirm them before submitting. The manifest's `note` fields and asset licences were not verified.
Next: fix #2 and #3 first. Right now a single network or SDK failure leaves the game blank.