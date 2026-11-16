I read every source file and checked the assets and SDK calls. I made no edits. I did not run the game in a browser, so these findings come from reading the code, not from playing it.

## Ranked problems

**Blockers (fix before submitting)**

1. **Audio files are missing from the repo.** `src/audio.js:1` and `:3` load `assets/music.wav`, `jump.wav`, and `gem.wav`, but only `assets/manifest.json` exists. Audio fails, and `s.play()` at `src/audio.js:12` and `music.play()` at `src/audio.js:6` return rejected promises that nothing catches. Commit the files or remove the references.
2. **The music file is far too large.** `assets/manifest.json:3` lists `music.wav` at 54,525,952 bytes, uncompressed. Convert it to OGG or MP3, which should bring it to a few MB.
3. **Poki SDK lifecycle calls are missing.** `src/sdk.js:1-8` only calls `PokiSDK.init()` and `commercialBreak()`. I believe Poki also expects `gameLoadingFinished()`, `gameplayStart()`, and `gameplayStop()`. Confirm against Poki's current docs, then add them.
4. **Ads don't pause the game or audio.** `src/main.js:31-34` awaits `showAd()` while `loop()` at `src/main.js:81-85` keeps running, and nothing mutes audio. Stop the loop and audio during the commercial break.
5. **Boot dies if the SDK script doesn't load.** `src/sdk.js:3` references the global `PokiSDK` with no guard, and `src/main.js:87-94` has no try/catch. If the CDN script is blocked, the game shows a blank screen.
6. **Ads can stack.** `src/main.js:23` calls `bindKeys(jump)` on every `newRun()`, and `src/input.js:3-7` never removes listeners. After a few restarts, one keypress fires `jump()` several times. Each call on a game-over state runs `restart()` at `src/main.js:27`, which triggers another `showAd()`. Bind input once at boot.
7. **The leaderboard depends on a placeholder, insecure endpoint.** `src/net.js:1` uses `http://scores.lumengames.example.com`. Browsers block this on an HTTPS page, and `example.com` is a reserved placeholder domain. `src/main.js:90` awaits it before `newRun()`, so a slow or failed request blocks the game, and `src/net.js:4-5` has no timeout and no `res.ok` check.

**High**

8. **Gems and saves can be double-counted.** `src/main.js:51` calls `gameOver()` without returning, so two overlapping storms in one frame call it twice. Each call adds the taken gems to `data.gems` at `src/main.js:60` and saves again.
9. **Gameplay speed depends on the display refresh rate.** Movement and gravity are per-frame, not per-second: `src/main.js:39-42`, `:49`, and the `loop()` at `:81-85`. A 120 Hz monitor makes the game run about twice as fast. Use a delta time.
10. **`console.log` runs every frame.** `src/main.js:54` logs on every update, which costs performance and clutters the console.
11. **`localStorage` is unguarded.** `src/save.js:5` throws on corrupt JSON and blocks boot. `src/save.js:9` throws in sandboxed or private contexts, which breaks `gameOver()` at `src/main.js:61` mid-frame. Wrap both in try/catch.

**Medium**

12. **Music starts before any user gesture.** `src/main.js:92` calls `startMusic()` immediately, so browser autoplay policy will likely block it.
13. **Keys stick and the page scrolls.** `src/input.js:8-10` doesn't clear `keys` on window blur, and `src/input.js:4-7` doesn't call `preventDefault()`, so arrows and space scroll the page.
14. **The canvas is fixed at 960×540 with no scaling.** `index.html:10` and `style.css:2` hardcode the size, and `src/main.js:50`, `:66` use the same literals. Poki's embed sizes vary.

**Low**

15. **The player can leave the screen horizontally.** `src/main.js:39-40` has no clamp on `p.x`.
16. **Only lowercase keys are recognized.** `src/main.js:39-40` checks `keys.a` and `keys.d`, and `src/input.js:6` checks `"w"`. Caps Lock breaks these.
17. **The footer links to a placeholder domain.** `index.html:11` points to `lumengames.example.com`. Replace it, and check Poki's rules on outbound links.
18. **`sprites.png` is listed but unused.** `assets/manifest.json:6` lists it, and no code loads it. Remove it or use it.
19. **The top score is fetched once and never refreshed.** `src/main.js:77` shows the score from boot only, and it assumes `topScores[0].score` exists without validating the response.
20. **The HTML has no `lang` attribute.** `index.html:2` should set `<html lang="en">`.

Next step: fix blockers 1–7 first, then re-check the Poki requirements against the current docs before resubmitting.