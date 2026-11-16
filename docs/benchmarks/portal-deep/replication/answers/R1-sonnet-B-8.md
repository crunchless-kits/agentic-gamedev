I read all 12 files and edited nothing. This is a static read-through. I didn't run the game, and I didn't check anything against Poki's current requirements, so the Poki-policy items are from memory.

## Blockers (the game can fail to start, or Poki will reject it)

1. **Startup depends on the leaderboard fetch.** `src/net.js:1-5` calls `http://scores.lumengames.example.com/...` with no `try/catch`. `src/main.js:90` awaits it before `newRun()` and `loop()`. If the request fails, the game never starts and the player sees a blank canvas. It fails if the host is down, offline, blocked by CORS, or blocked as mixed content. Mixed content is certain, because Poki serves over HTTPS and this URL is plain `http://`. Remove the call, or make it optional with a timeout and fallback and don't await it in `boot()`. Poki may also reject calls to your own servers.

2. **The Poki SDK integration is incomplete and brittle.** `src/sdk.js:1-8`:
   - `PokiSDK.init()` has no error handling. Ad blockers block the script and leave `PokiSDK` undefined. That throws a `ReferenceError`, and `boot()` at `src/main.js:88` dies. Poki's documented pattern is to continue the game even if `init` fails.
   - `gameLoadingFinished()` is never called.
   - `gameplayStart()` and `gameplayStop()` are never called. Poki expects them on run start, on death, and on pause. I think this is a hard requirement.
   - `commercialBreak()` is not wrapped, so a failed ad call breaks restart (`src/main.js:32`).
   - Nothing mutes the audio around ad breaks, which Poki requires.

3. **The audio files aren't in the repo, and the music is huge.**
   - `assets/manifest.json:3` lists `music.wav` at 54,525,952 bytes (about 52 MB, uncompressed). That is far over any sensible Poki download budget.
   - Only `manifest.json` exists on disk. `music.wav`, `jump.wav`, `gem.wav` and `sprites.png` are all missing, so every audio load will 404 (`src/audio.js:1-3`).
   - `sprites.png` is listed but nothing in the code uses it.
   - Fix: compress the music to OGG/MP3 at about 1 MB or less, and add the missing files.

4. **Third-party "More games" link.** `index.html:11` links out to `lumengames.example.com` and carries studio branding. Poki generally forbids external links and promotion of other sites inside the game. It also lacks `rel="noopener"`. Remove it.

## High (real bugs a player will hit)

5. **Each restart adds another set of key listeners.** `bindKeys(jump)` is called inside `newRun()` (`src/main.js:23`, `src/input.js:4-10`). After N restarts, one keypress runs `jump` N times.
   - While the death screen is up, `jump()` calls `restart()` once per listener (`src/main.js:27`).
   - `restart()` also has no guard against being called again while `await showAd()` is pending (`src/main.js:31-34`), because `state.over` is still true. Mashing space can trigger several ad breaks and several `newRun()` calls.
   - Fix: bind the keys once at boot, and add an "is restarting" flag.

6. **Music autoplay will be blocked.**
   - `startMusic()` runs at boot with no user gesture (`src/main.js:92`).
   - `music.play()` and `s.play()` return promises that are never caught (`src/audio.js:6,12-13`). That gives unhandled rejections, and the music never starts.
   - Start audio on the first input instead. There is also no mute toggle and no pause when the tab is hidden.

7. **Game speed depends on the display refresh rate.** `update()` moves things by fixed amounts per frame (`src/main.js:39-42,49`) and is called once per `requestAnimationFrame` (`src/main.js:81-85`). On a 120 or 144 Hz screen, gravity, movement and storms run 2 to 2.4 times faster. Use a fixed timestep or delta time.

8. **Save loading can crash the game.** `src/save.js:3-6`:
   - `localStorage` throws in sandboxed iframes with storage blocked, and Poki embeds games in iframes.
   - `JSON.parse` of a corrupt value throws.
   - An old save missing `gems` or `best` leads to `NaN` later.
   - Fix: wrap in `try/catch`, fall back to defaults, and merge with defaults. Both `load()` and `save()` need this.

9. **No mobile or touch support, and the canvas never scales.**
   - Input is keyboard only (`src/input.js`).
   - The canvas is a fixed 960×540 (`index.html:10`, `style.css:2`) with no resizing. The footer pushes the page past the iframe height.
   - Poki traffic is a large share mobile, so this is a major launch risk.

## Medium

10. **`console.log` runs on every frame** (`src/main.js:54`). That's 60+ calls a second, which hurts performance and floods the console. Delete it.

11. **Keys aren't handled safely** (`src/input.js:5-9`).
    - No `preventDefault`, so space and the arrow keys scroll the host page.
    - Jump is matched on `"w"` only, so `W` with Caps Lock or Shift doesn't jump. The same applies to `a` and `d` in `src/main.js:39-40`.
    - Held keys stay stuck if the window loses focus, because there is no `blur` handler.
    - Key repeat spams `onJump`.
    - Use `e.code`.

12. **`gameOver()` can run twice in one frame** (`src/main.js:51,53,57-62`). Two storms overlapping the player, or a storm hit plus a fall, runs it again. That double-counts `data.gems`. Add `if (state.over) return;`.

13. **The player can walk off-screen.** `p.x` is never clamped (`src/main.js:39-40`).

## Low

14. **Unused or stale items.** `README.md:5` and `package.json:6` (`"start": "npx serve ."`) have no build or packaging step. A Poki upload needs a zip with `index.html` at the root. There's no version bump, and `sprites.png` is unused.
15. **Drawing doesn't check state or the SDK.** `draw()` assumes `data` and `state` exist (`src/main.js:64-79`). It's safe today only because `loop()` starts last in `boot()`. Fixing item 1 or 2 by moving boot order will expose this.

## Suggested order
Do 1, 2 and 3 first, since they decide whether the game loads and passes review. Then 5 to 9, then the rest. Items 5 and 12 are quick, and 7 and 9 are the largest pieces of work.

I can write fixes for any of these if you want. I haven't changed anything.