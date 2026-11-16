**Decision: NO-GO.** Several problems would get this rejected or break it for players. Some are blockers and some are polish.

**Blockers**

1. **The soundtrack is 52 MB.** `assets/manifest.json` lists `assets/music.wav` at 54,525,952 bytes, uncompressed. Poki wants a small initial download, and a file this size would very likely fail their size and load-time checks. It would also load badly on mobile. Compress it to OGG or MP3, which should be about 1–3 MB, or stream it.
2. **No `gameplayStart` or `gameplayStop` calls.** `src/sdk.js` only wraps `init` and `commercialBreak`. Poki requires `PokiSDK.gameplayStart()` when play begins and `gameplayStop()` on death or pause. Nothing calls them in the code.
3. **The ad is wired incorrectly.** `restart()` in `src/main.js:31-34` calls `showAd()` on every restart. Poki's rules say a commercial break must not run mid-play or without gameplay having been stopped first. `gameplayStop` is never called, so the ordering is wrong. There is also no `gameLoadingFinished()` call.
4. **Startup depends on an external server that will fail.** `boot()` in `src/main.js:87-94` awaits `fetchTopScores()`, which calls `http://scores.lumengames.example.com/...` (`src/net.js`). Three things are wrong with this:
   - The URL is plain `http`, so it is blocked as mixed content on an https page.
   - The `.example.com` domain doesn't resolve, so the fetch throws.
   - The fetch has no try/catch, so `newRun()` and `loop()` never run and the game never starts.

   Poki also disallows calls to external servers.
5. **There is no error handling around SDK init.** `await initSdk()` runs first. If the SDK script is blocked by an ad blocker, `PokiSDK` is undefined and the game never boots. Poki's documentation recommends continuing when init fails.

**Likely rejection reasons**

6. **An external "More games" link.** `index.html` has a footer link to `lumengames.example.com`. Poki forbids external links and branding that leads off their platform.
7. **Music autoplay.** `startMusic()` runs on boot with no user gesture. Browsers block this, and the unhandled `music.play()` promise rejection is logged. Audio should start after the first input. There is also no mute option.

**Smaller problems**

- `console.log("frame", ...)` at `src/main.js:54` logs on every frame. Remove it.
- `bindKeys(jump)` runs inside `newRun()`, so each restart adds another set of key listeners. After a few restarts, one jump press fires the handler several times. A press at game over could also trigger multiple `restart()` calls and multiple ads.
- `keys.a` and `keys.d` are only matched in lowercase, and Caps Lock breaks them. `jump` uses `"w"` but the README says WASD.
- `jump()` can run before `state` exists, because the key bindings are only set up after boot. That is low risk.
- There is no `localStorage` try/catch and no `JSON.parse` guard in `src/save.js`. Corrupt data or a blocked-storage iframe would crash the load.
- There is no mobile or touch input and no canvas scaling. Poki requires desktop and mobile support or an explicit desktop-only declaration. The canvas is fixed at 960×540.
- The version is still 0.9.0, and there is no build or minify step.
- The README says the SDK tag is "already in index.html". It is, but the SDK is only partly integrated (see items 2, 3 and 5).

**Next steps**

1. Compress the music.
2. Add the missing SDK calls: `gameLoadingFinished`, `gameplayStart` and `gameplayStop`. Wrap init in a try/catch.
3. Delete the leaderboard fetch, or make it non-blocking and optional.
4. Remove the external link.
5. Start audio after the first input.
6. Fix the duplicate listeners.
7. Add touch input.

I made no edits and didn't run the game.