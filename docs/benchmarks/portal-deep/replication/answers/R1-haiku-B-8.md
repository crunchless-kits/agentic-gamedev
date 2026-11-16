# Skyhop Poki audit: ranked problems

I read all 12 tracked files and made no edits. This is a static read only: I did not run the game, and I did not check Poki's current guidelines or size limits. Items marked "verify" depend on those.

## Blockers

1. **Audio and sprite assets are not in the repo.** `assets/` holds only `manifest.json`. `music.wav`, `jump.wav`, `gem.wav`, and `sprites.png` are missing, so the audio requests 404. `audio.js:1,3` loads them and `audio.js:6,12` ignores the rejected promises. `manifest.json:3-6` lists the files. If this repo is the submission source, the build ships broken.
2. **Boot has no error handling.** `main.js:87-94` has no try/catch. If `PokiSDK` is undefined (ad blocker or failed CDN load), `sdk.js:3` throws and the game never starts. If the leaderboard fetch fails, `main.js:90` and `net.js:4` throw the same way. Load must succeed without either.
3. **Leaderboard uses plain HTTP on a placeholder domain.** `net.js:1` fetches `http://scores.lumengames.example.com`. Poki runs games over HTTPS, so browsers block this as mixed content. The `.example.com` host also looks like a placeholder. `index.html:11` has the same placeholder for "More games".
4. **Restarts stack input listeners and can fire multiple ads.** `main.js:23` calls `bindKeys(jump)` inside `newRun()`, and `newRun()` runs on every restart. Each run adds another `keydown` listener (`input.js:4`). After N deaths, one keypress calls `restart()` N times (`main.js:27,31-33`), and each call starts a `commercialBreak`. Nothing guards against overlapping calls.
5. **No touch input and a fixed-size canvas.** Controls are keyboard only (`input.js:3-11`). The canvas is fixed at 960×540 (`index.html:10`, `style.css:2`) with no viewport meta or scaling. Phones, a large share of Poki traffic, cannot play.

## High

6. **Poki SDK lifecycle is incomplete.** There are no `gameplayStart`/`gameplayStop` or loading-finished calls. `restart()` shows an ad (`main.js:31-34`) with no pause and no mute callback, and `audio.js` keeps playing through it. `sdk.js:6-7` exposes only `init` and `commercialBreak`. Gameplay also keeps running when the tab is hidden.
7. **localStorage is unguarded.** `save.js:4-5` calls `JSON.parse` on whatever is stored, and `save.js:4,9` can throw under restricted storage (common in third-party iframes). `main.js:89` calls `load()` before `newRun()`, so either failure kills boot.
8. **Physics is frame-rate dependent.** Movement and gravity are per-frame, not per-second (`main.js:39-45,49`, driven by `main.js:81-85`). The game runs about 2× fast on 120–144 Hz displays.
9. **Music autoplays with no user gesture.** `main.js:92` calls `startMusic()` at boot. Browsers reject this (`audio.js:5-6`), the rejection is unhandled, and music never starts or retries after the first input.
10. **The music file is 54 MB uncompressed.** `manifest.json:3` lists `music.wav` at 54,525,952 bytes. Compressed OGG or MP3 would be far smaller. Check Poki's size limits (verify).

## Medium

11. **`gameOver()` is not guarded.** The storm loop keeps running after a hit, so two overlapping storms, or a storm hit plus the fall check, call `gameOver()` twice in one frame (`main.js:48-53`). `gameOver()` (`main.js:57-62`) then adds `data.gems` twice.
12. **Per-frame `console.log`.** `main.js:54` logs every frame, about 60 lines per second, in production.
13. **Held keys and page scroll.** `input.js:6` ignores `e.repeat` and does not call `preventDefault`. Holding space restarts the game right after a death, and arrow keys scroll the page.
14. **No bounds on the player.** `main.js:39-40` lets `p.x` go off-screen with no clamp.
15. **Keys stick on blur.** `input.js:8-10` has no `blur` handler, so alt-tabbing leaves movement keys held.
16. **Unhandled audio promises.** `audio.js:6` and `audio.js:12` return promises that are never caught.
17. **Caps Lock breaks WASD.** `input.js:6` and `main.js:39-40` compare lowercase `w`/`a`/`d` only.
18. **External link (verify).** `index.html:11` opens an outbound "More games" link in a new tab. Check Poki's rules on external links.

## Not checked

- Runtime behavior, Poki's current guidelines, and Poki's size and ad-frequency rules.
- Whether the missing assets live in another folder or branch of the submission build.