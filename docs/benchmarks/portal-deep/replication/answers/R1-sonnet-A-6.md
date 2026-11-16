# Skyhop pre-Poki audit (ranked, no files edited)

I read all 11 tracked files and didn't run the game. Everything below comes from reading the code.

## Likely rejection or blocking

1. **Boot fails if the leaderboard request fails.** `src/main.js:90` and `src/net.js:3-5`
   - `fetchTopScores()` has no try/catch and no `res.ok` check. If the request fails, `boot()` throws before `newRun()`, `startMusic()` and `loop()` run, and the player gets a blank canvas.
   - The URL is `http://` and points at `.example.com`, so it is mixed content on an https page and will fail on Poki.
   - Poki also blocks most external network calls. Remove the leaderboard or make it optional, with a fallback to `[]`.

2. **The 54 MB uncompressed soundtrack.** `assets/manifest.json:3`, loaded at `src/audio.js:1`
   - `music.wav` is 54,525,952 bytes. Poki's initial download limit is far lower (I believe about 8 MB, but check the current docs).
   - Convert it to OGG/MP3 or AAC at roughly 1–2 MB, and consider lazy-loading it.

3. **No `gameplayStart` or `gameplayStop` calls.** `src/sdk.js:1-8`, `src/main.js`
   - The Poki SDK requires `PokiSDK.gameplayStart()` when play begins and `gameplayStop()` on death or pause. They are never called anywhere.
   - There is also no `PokiSDK.gameLoadingFinished()` after boot.

4. **Ad flow and SDK failure handling.** `src/sdk.js:2-7`, `src/main.js:31-34`
   - `PokiSDK.init()` rejects when an ad blocker is active, which is a common case. The docs say to continue the game anyway. Here the rejection is uncaught at `main.js:88`, so the game never starts.
   - `commercialBreak()` has no error handling either.
   - Ads should be skipped during gameplay. Make sure `restart()` can't run twice while `await showAd()` is pending.
   - Audio should be muted during ads, via the `commercialBreak` callback.

5. **Audio autoplay and errors.** `src/audio.js:6,12-13`, `src/main.js:92`
   - `music.play()` is called at boot with no user gesture, so browsers block it and the returned promise rejects unhandled. Start the music on the first keypress or click instead.
   - `s.play()` also returns an unhandled promise.
   - There is no mute control, which Poki expects.

## Real bugs

6. **`bindKeys` is called on every `newRun()`.** `src/main.js:23`, `src/input.js:4`
   - Each restart adds another keydown and keyup listener. After N restarts, one jump press fires `onJump` N+1 times. After a game over, the extra calls trigger several concurrent `restart()` calls, each with its own ad and `newRun()`.
   - Bind once, in `boot()`.

7. **Space and arrow keys scroll the page.** `src/input.js:5-7`
   - There is no `preventDefault()`. Inside Poki's iframe, space and ArrowUp/Down will scroll or move focus.

8. **Input is wrong for several cases.** `src/input.js:5`, `src/main.js:39-40`
   - `e.key === "w"` misses uppercase `W` when Caps Lock or Shift is on. `keys.a` and `keys.d` have the same problem.
   - Key state is never cleared on blur, so keys can get stuck.
   - There is no touch or mouse input. Poki requires mobile support for most games, and the README only mentions the keyboard.

9. **Movement is frame-rate dependent.** `src/main.js:39-42,81-85`
   - Physics advances per `requestAnimationFrame` with no delta time. On 120/144 Hz displays the game runs about 2.4 times faster.

10. **The player can walk off-screen.** `src/main.js:39-40`
    - There is no clamping to 0–960, so the player can leave the canvas.

11. **`load()` can throw.** `src/save.js:3-6`
    - Corrupt JSON throws at boot.
    - `localStorage` can also be unavailable in some iframe or private contexts. Wrap the access in try/catch.
    - Saved data from an older shape could be missing `best` or `gems`, giving NaN or undefined.

12. **A storm can kill the player before the first frame.** `src/main.js:53-54`, `src/world.js:12`
    - This is a design check rather than a confirmed bug. Storms oscillate with no spawn protection, so verify the start is fair.
    - `p.y > 560` is also hardcoded.

## Polish and compliance

13. **Debug `console.log` every frame.** `src/main.js:54`
    - It logs about 60 times per second and hurts performance. Remove it.

14. **External link in the footer.** `index.html:11`
    - Poki rejects outbound links to other sites and branding that drives traffic away. Remove the "More games" link and the footer.

15. **Page layout.** `index.html:10`, `style.css`
    - The canvas is a fixed 960×540 with no scaling to the iframe viewport, and no mobile or fullscreen handling. Poki games should fit any container size.
    - There is no `<meta name="viewport">`, and no `<!doctype>` problem, but `<html>` has no `lang`.

16. **The README and manifest are stale.** `README.md:5`, `assets/manifest.json`
    - `sprites.png` is listed in the manifest but never loaded, since the game draws rectangles.
    - `jump.wav` and `gem.wav` are uncompressed too, at about 150 KB total.

17. **Game-over and score UI.** `src/main.js:78`, `src/main.js:60`
    - The prompt text is hardcoded at an arbitrary position.
    - `data.gems` accumulates with no use, and `data.best` is read without a default guard.

18. **The package is not built or minified.** `package.json:6`
    - `npx serve .` is the only script. There is no build step for producing a zip with `index.html` at the root, and no relative-path check.

## Suggested fix order
Fix 1, 2, 3 and 4 first, because Poki's QA will reject the game over them. Then fix 6 (the duplicated listeners), which gets worse the longer someone plays, then 5, 7 and 14. The rest can follow.

I haven't confirmed Poki's exact current limits (asset size, link policy, SDK call requirements). Check them against the Poki developer docs before submitting.