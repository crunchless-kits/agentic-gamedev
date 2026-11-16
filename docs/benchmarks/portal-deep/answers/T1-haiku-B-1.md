The audit is done and no files were edited. I read all 12 tracked files directly; the repo is small enough that agents weren't needed. I did not run the game in a browser, so the findings below come from reading the code. The Poki requirements come from search snippets, so check them against [Poki's requirements page](https://sdk.poki.com/new-requirements) and the [SDK documentation](https://sdk.poki.com/sdk-documentation.html) before submitting.

## Ranked problems

**Blockers (fix before submitting)**

1. **Black screen when the leaderboard fetch fails.** `src/net.js:1` uses `http://`, which the browser blocks as mixed content on Poki's HTTPS page. `src/net.js:3-5` has no try/catch, and `src/main.js:90` awaits it inside `boot()`, so `newRun()` and `loop()` never run. Switch to HTTPS, add a timeout, and start the game even when the fetch fails.

2. **Boot has no failure path.** `src/main.js:87-94` has no catch. If the Poki script doesn't load (blocked or slow), `PokiSDK` is undefined at `src/sdk.js:3`, which throws and leaves the game blank. `index.html:7` loads the SDK synchronously in `<head>` with no fallback.

3. **Restarts multiply and stack ads.** `src/main.js:23` calls `bindKeys(jump)` on every `newRun()`, and `src/input.js:4-7` adds a new `keydown` listener each time without removing the old one. After N deaths, one key press calls `jump()` N times. On game over, each call runs `restart()` (`src/main.js:31-34`), so you get several `commercialBreak` calls and several `newRun()` calls. Holding space also auto-repeats and re-triggers this. Register the listener once in `boot()`.

4. **Poki lifecycle calls are missing.** `src/sdk.js:1-8` only wraps `init` and `commercialBreak`. Nothing calls the loading or gameplay events. Poki's current requirements say `gameplayStop` fires on interruption (the death at `src/main.js:57-62` is one) and `gameplayStart` fires on the player's first input, not on load. Add them, and confirm the exact method names in the SDK docs.

5. **Music keeps playing during ads.** `src/main.js:31-34`, `src/sdk.js:6-8`, and `src/audio.js:5-7`. Mute game audio while `commercialBreak` is running and restore it afterwards. Use the callback form of `commercialBreak` if the SDK version supports it, and confirm the signature in the docs.

6. **Music never starts on first load.** `src/main.js:92` calls `startMusic()` during boot, before any user gesture. Browsers reject that `play()`, and `src/audio.js:6` and `src/audio.js:12` ignore the returned promise, so the rejection goes unhandled. Start audio on the first key press or tap.

7. **Unplayable on phones.** `index.html:3-6` has no viewport meta tag. `style.css:2` fixes the canvas at 960×540 with no scaling. `src/input.js:3-11` handles keyboard only, with no touch or pointer input, and the controls are described only as arrows, WASD, and space in `README.md:3`. Poki's audience is largely mobile, so check their touch requirements.

8. **Music file is far too large.** `assets/manifest.json:3` lists `music.wav` at 54.5 MB uncompressed, and `src/audio.js:1` loads it at startup. Convert it to OGG or MP3 (a few MB is typical) and check Poki's current file-size limit.

**High (gameplay or data correctness)**

9. **Physics runs at the display's refresh rate.** `src/main.js:36-42` moves the player by fixed amounts per frame (`p.x ± 4`, `p.vy += 0.5`), and `src/main.js:50-53` does the same for storms. On 120 Hz or 144 Hz monitors the game runs 2–2.5× fast, and jump height changes. Use delta time with a fixed timestep.

10. **Gems can be double-counted.** `src/main.js:48-52` calls `gameOver()` for every overlapping storm without checking `state.over`. `src/main.js:53` can call it again in the same frame. `gameOver()` at `src/main.js:57-61` adds `data.gems` and saves on each call. Add `if (state.over) return;` at the top of `gameOver()`.

11. **Part of the level is off-screen.** `src/world.js:3` places 8 islands at x = 40 to 1020, so the last island (x 1020–1120) is outside the 960 px canvas. Its gem at `src/world.js:8` is also off-screen. `src/main.js:39-40` has no clamp, so the player can walk off the visible area. Check that every island is reachable.

12. **Save file can break boot.** `src/save.js:5` calls `JSON.parse` on stored data without a try/catch, so corrupt data throws during `boot()`. `src/save.js:4` and `src/save.js:9` also touch `localStorage` unguarded, which can throw inside sandboxed iframes.

13. **Restart stalls if the ad fails.** `src/main.js:31-34` awaits `showAd()` before `newRun()`. If that promise rejects, `newRun()` never runs and `state.over` stays true, so the player is stuck on the game-over screen. Wrap it in try/finally.

**Medium**

14. **Debug logging every frame.** `src/main.js:54` runs `console.log` 60 times per second. Remove it.

15. **Keys stick after focus is lost.** `src/input.js:8-10` only clears a key on `keyup`. If the window loses focus while a key is held, the player keeps moving. Clear `keys` on `blur` and `visibilitychange`.

16. **Page scrolls when keys are pressed.** `src/input.js:4-7` doesn't call `preventDefault()` for space or the arrow keys, so the page can scroll inside the Poki iframe.

17. **Keeps running while hidden.** `src/main.js:81-85` and `src/audio.js:5-7` have no visibility handling. The music keeps playing when the tab is hidden, and the game should send `gameplayStop` then.

18. **Possible placeholder domains and outbound link.** `index.html:11` has a "More games" link that opens a new tab, and `src/net.js:1` and `index.html:11` both use `example.com` domains. Confirm the real domains and check Poki's rules on outbound links.

19. **"Top" score is shown but never submitted.** `src/main.js:77` displays the top score from `src/net.js:3-6`, but nothing in the code posts a score. Confirm whether the leaderboard is written somewhere else.

**Low**

20. **Keys are case-sensitive.** `src/input.js:6` and `src/main.js:39-40` only match lowercase `w`, `a`, and `d`, so Caps Lock or Shift breaks those keys.

21. **Small markup issues.** `index.html:2` has no `lang` attribute, and `index.html:7` loads the SDK synchronously in `<head>`, which blocks parsing.

## Questions for you
- Is the leaderboard write path somewhere outside this repo? If not, item 19 is a feature gap, not a bug.
- Is `lumengames.example.com` a placeholder? Items 1 and 18 depend on the real domains.