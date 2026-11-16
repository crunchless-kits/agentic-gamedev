# Audit: Skyhop (plain JavaScript, no bundler, no build step)

I read all 11 tracked files and ran nothing, so none of this was tested in a browser. Nothing was edited.

## Findings (ranked)

**Blockers**

1. **The soundtrack is a 54.5 MB uncompressed WAV.**
   - Evidence: `assets/manifest.json:3` and `src/audio.js:1`. `new Audio(...)` starts the download at module load.
   - Impact: It is far over Poki's size guidance, which is a few MB for the initial load. Load times will be bad, and Poki will likely reject it on size alone.
   - Fix: Re-encode it as OGG or MP3 at about 1–2 MB, and re-encode `jump.wav` and `gem.wav` too (`manifest.json:4-5`). Load the music lazily.

2. **The Poki SDK is only half wired up, so it will likely fail review.**
   - Evidence: `src/sdk.js:2-8`.
   - Missing calls: There is no `gameLoadingFinished()`, no `gameplayStart()` at run start, and no `gameplayStop()` at game over or before the ad.
   - Ad handling: `showAd` (`sdk.js:6`) doesn't mute audio or pause input around the ad.
   - Crash path: `PokiSDK.init()` (`sdk.js:3`) rejects when an ad blocker is on. The `await` at `main.js:88` is uncaught, so `boot()` dies and the player gets a blank canvas. Poki's pattern is `init().then(...).catch(...)`, and the game must run either way.

3. **The game shows a blank screen if the leaderboard request fails.**
   - Evidence: `src/net.js:1-5` and `src/main.js:90`.
   - The URL is plain `http://` to an `.example.com` host. That is blocked as mixed content inside Poki's HTTPS iframe.
   - Nothing is caught. A failed fetch or non-JSON reply stops `boot()` before `newRun()` and `loop()` run.
   - Poki also generally disallows third-party network calls. Remove the leaderboard, or make it optional with a timeout and a try/catch.

4. **Every restart adds another set of key listeners, so game-over breaks after a few runs.**
   - Evidence: `src/main.js:23`. `bindKeys(jump)` runs inside `newRun()`, and each call adds more `keydown` and `keyup` listeners (`input.js:4-10`).
   - Impact: After N restarts, one space press calls `jump()` N times. On the game-over screen that fires N `restart()` calls, so N `showAd()` calls and N `newRun()` calls. Poki will see ad spam.
   - Fix: Bind once in `boot()`.

**High**

5. **An external link in the footer.**
   - Evidence: `index.html:11`. The link points to `lumengames.example.com/more`, which advertises other games.
   - Impact: Poki rejects outbound links and cross-promotion. Remove the whole footer.

6. **Music never starts, and audio errors are not handled.**
   - Evidence: `src/audio.js:6-7` and `src/main.js:92`. `startMusic()` runs at boot with no user gesture, so the browser refuses it and `play()` returns a rejected promise.
   - Same problem: The `play()` at `audio.js:12` is also unhandled.
   - Missing: There is no mute toggle and no audio pause when the tab is hidden.
   - Fix: Start the music on the first key press or click.

7. **`restart()` can be triggered repeatedly while an ad is showing.**
   - Evidence: `src/main.js:27` and `main.js:31-34`. `state.over` stays true during `await showAd()`, so each space press during the ad queues another `newRun()` and another ad request.
   - Fix: Add an "is restarting" guard.

8. **Gameplay speed depends on the monitor's refresh rate.**
   - Evidence: `src/main.js:81-85` and the per-frame constants at `main.js:39-42` (4 px, 0.5 gravity). `update()` has no delta time or fixed step.
   - Impact: At 120–144 Hz everything runs about twice as fast as at 60 Hz. Gameplay is unfair and inconsistent across players.

9. **There is no mobile or touch support, and the canvas never scales.**
   - Evidence: `src/input.js:1-11` is keyboard only. `index.html:10` fixes the canvas at 960×540, and `style.css:2` doesn't scale it.
   - Impact: The game is unplayable on phones, which are a large share of Poki traffic. It also won't fit smaller windows and ignores devicePixelRatio.

10. **The game keeps running when the tab is hidden or the window loses focus.**
    - Evidence: `main.js:81-85` has no `visibilitychange` or `blur` handling.
    - Related: Held keys stay stuck after a blur because `keyup` never fires (`input.js:8-10`).

**Medium**

11. **A `console.log` runs every frame.**
    - Evidence: `src/main.js:54`. It logs about 60 lines per second and slows the game. Remove it.

12. **Input handling has bugs.**
    - Case: `input.js:5-6` and `main.js:39-40` match `e.key` case-sensitively, so with Caps Lock or Shift held, A/D/W stop working.
    - Key repeat: Holding space repeats the jump or restart.
    - Scrolling: There is no `preventDefault`, so space and the arrow keys can scroll the host page.
    - Fix: Use `e.code` and check `e.repeat`.

13. **The save code can crash and has no version.**
    - Evidence: `src/save.js:4-9`. `JSON.parse` on a corrupt value throws and breaks boot. `localStorage` access can also throw in a sandboxed iframe or private mode.
    - Missing: There is no schema version, which will hurt the first time you change the save format.
    - Fix: Wrap both calls in try/catch with a default, and add a `v` field.

14. **The player can walk off the sides of the screen.**
    - Evidence: `src/main.js:39-40` has no x clamp. Falling off the sides ends the run only through the `p.y > 560` check (`main.js:53`).

**Low**

15. **No `package.json` build, lockfile, favicon or meta viewport, and the README has no Poki checklist.**
    - Evidence: `package.json:6` (`npx serve .`), `index.html:3-8`, and `README.md:5`.
    - Fix: Add a viewport meta tag, a favicon, and a zip step that produces a Poki-ready `index.html` at the archive root.

16. **Rendering and allocation hygiene.**
    - Evidence: `src/main.js:77` builds a template string every frame. `src/audio.js:11` resets `currentTime` on a shared `Audio` element, so overlapping sounds cut each other off.

## What is healthy
- The code is small and modular. `world.js`, `save.js` and `input.js` are cleanly separated.
- The SDK calls are isolated in `src/sdk.js`, so adding Poki calls is a small change.
- Collision and platform logic (`main.js:44-46`) is simple and works.

## Handoff
Changed: nothing.
Evidence: read all 11 tracked files, plus `git ls-files`.
Verify: for #4, play, die and restart three times, then die again and press space. You should see several `commercialBreak` calls. For #2 and #3, load the page with an ad blocker or offline and watch for a blank canvas.
Open: I didn't run the game in a browser, and I couldn't check the Poki submission rules against their current docs. Confirm the exact size limit and the rules on outbound links and network calls with Poki's current requirements.
Next: fix #1 through #4 first. Each can block approval or cause a blank screen, and together they are about a day of work. Then do #5 through #10 before submitting.