Audit of Skyhop, ranked by how likely each problem is to block or break a Poki submission. I didn't edit any files.

## Blockers (likely rejection or a broken game)

1. **54 MB uncompressed music file** (`assets/manifest.json:3`). `music.wav` is 54,525,952 bytes. Poki has tight size limits and wants fast loads, and this file is about 99% of the payload. Convert it to compressed OGG, MP3 or M4A, which should be around 1–3 MB. Then update the path in `src/audio.js:1`. The WAV isn't tracked in git, so check the file actually exists in the build.

2. **Leaderboard fetch can hang boot or crash it** (`src/net.js:4`, awaited at `src/main.js:90`).
   - It uses plain `http://`, which is blocked as mixed content on an https page.
   - The domain is an `.example.com` placeholder.
   - Poki also disallows external network calls.
   - There's no try/catch, so the fetch rejects. Because `boot()` awaits it, `newRun()` and `loop()` never run and the game never starts.
   - Remove it, or at least catch the error and don't await it. For Poki, drop it entirely.

3. **External branding and link in the page** (`index.html:11`). The footer links to "More games" on another site. Poki forbids external links and promotion of other portals. Remove the footer.

4. **Poki SDK usage is incomplete** (`src/sdk.js:2-8`, `src/main.js`).
   - **No gameplay events.** Poki requires `PokiSDK.gameLoadingFinished()` after load, and `gameplayStart()` and `gameplayStop()` around play. None are called, and the game has no game-over or start hooks for them.
   - **No SDK failure handling.** `PokiSDK.init()` rejects when ad blockers are active. It's awaited at `main.js:88` with no catch, so the game won't start for those players. The standard pattern is `init().catch(() => {})`.
   - **A script that fails to load throws.** If the SDK script doesn't load, `PokiSDK` is undefined and `sdk.js` throws a ReferenceError. Guard for that.
   - **Ad sequencing is wrong.** `showAd()` is called on restart (`main.js:32`) with no `gameplayStop()` before it. Poki also expects ads only at natural breaks, not necessarily on every restart.

## Serious bugs

5. **Input handlers pile up on every restart** (`src/main.js:23`). `newRun()` calls `bindKeys(jump)`, which adds new window listeners on each run. After N restarts one key press fires `jump` N times. Because the handler calls `restart()` when the run is over, a single space press can fire several overlapping `showAd()` and `newRun()` calls. Bind once, in `boot()`.

6. **Audio autoplay and unhandled rejections** (`src/audio.js:6,12`, `src/main.js:92`).
   - `music.play()` is called at boot with no user gesture, so browsers reject it. The rejected promise is never caught.
   - `play(name)` has the same problem.
   - Start music on the first key press or click.
   - Poki also expects sound to be muted during ads, and nothing does that here.

7. **Corrupt or blocked save data crashes the game** (`src/save.js:4-9`). `JSON.parse` on bad data throws. `localStorage` access also throws in some embedded iframes (privacy modes), and `setItem` throws when storage is full. Wrap all of it in try/catch with a default fallback. `load()` runs in `boot()`, so a failure there means the game never starts. Also merge defaults, so a save from an older version missing a field doesn't give `undefined`.

## Moderate

8. **Game-over can fire repeatedly, and each time it saves** (`src/main.js:51-53`). Within a frame the storm loop can call `gameOver()` twice, and it also double-counts `data.gems`. The `state.over` guard only applies from the next frame. Return early once over.

9. **Game speed depends on the display refresh rate** (`src/main.js:36-45,81-85`). Physics is per-frame with no delta time. It runs about 2.4 times too fast on 144 Hz monitors, which hurts the difficulty and feel of the game. Use a fixed timestep.

10. **Per-frame `console.log`** (`src/main.js:54`). It logs at 60 times per second, which hurts performance and floods the console. Remove it.

11. **Keyboard handling flaws** (`src/input.js:5-6`, `src/main.js:39-40`).
    - `e.key` is case-sensitive, so with Caps Lock or Shift `"A"` and `"W"` don't match.
    - Arrow keys and space scroll the Poki iframe page. Call `preventDefault()` on them.
    - There is no touch or mobile support, even though Poki traffic is large on mobile.
    - Keys get stuck if the window loses focus, because there is no blur reset.

12. **Fixed 960×540 canvas** (`index.html:10`). It doesn't scale to the Poki iframe or to mobile. Add responsive scaling.

## Minor

13. **Unused `data.gems` and unhandled edge cases** (`src/main.js:57-62`, `src/world.js`). The leaderboard score `topScores[0]?.score` (`main.js:77`) assumes a shape that has never been verified. This goes away if you drop the leaderboard.
14. **Missing metadata and docs** (`index.html:3-6`, `README.md`, `package.json:3`). The page has no viewport meta tag, and the version is still 0.9.0. The README doesn't describe the controls for a Poki submission. `assets/manifest.json` lists `sprites.png`, but nothing loads it, so check whether it's dead weight.
15. **Game-over text is hardcoded** (`src/main.js:78`). It's drawn at fixed x=380 and isn't centered or localized. This is cosmetic.

Fixing items 1–4 should come first, since those are the most likely to cause rejection. Items 5–7 are the most likely to cause "broken game" reports during Poki's QA.