I read every tracked file (about 160 lines of source) and checked the assets, but I did not run the game. Nothing was edited.

**Ranked problems**

**Blockers for submission**

1. **Audio files and the 54 MB WAV are not in the repo.** `assets/music.wav`, `assets/jump.wav`, and `assets/gem.wav` are referenced by `src/audio.js:1,3` but are absent from both disk and git. The manifest says `assets/manifest.json:3` (`music.wav`) is 54,525,952 bytes uncompressed. Fix: commit the audio and re-encode the music as OGG or MP3.
2. **No Poki SDK gameplay calls.** `src/sdk.js:2-7` only calls `init` and `commercialBreak`. `src/main.js:87-93` never signals loading finished, and nothing calls `gameplayStart` on first input or `gameplayStop` on game over or tab hidden. Poki's [new requirements page](https://sdk.poki.com/new-requirements) asks for these events. I could not open the full checklist, so confirm the exact list.
3. **Audio is not muted during ads.** `src/main.js:31-34` shows an ad without muting the music or sound effects. Confirm whether Poki requires this.
4. **Restart can get stuck.** `src/main.js:31-34` awaits `showAd()` with no `try/catch`. If the commercial break rejects, `newRun()` never runs and the player stays on the game-over screen, where only space restarts.
5. **Duplicate ad calls from listener leak.** `src/main.js:23` calls `bindKeys(jump)` inside `newRun()`, and `src/input.js:4` adds a new `keydown` listener every time. After N restarts there are N+1 listeners. Holding space after game over (key auto-repeat) then fires `restart()` several times, each calling `showAd()`.
6. **Boot can fail to a black screen.** `src/main.js:88-91` runs `initSdk`, `load`, and `fetchTopScores` in sequence with no error handling. If the SDK script is blocked (`src/sdk.js:3` throws on `PokiSDK` undefined), or the leaderboard fetch fails, `loop()` never starts.
7. **Leaderboard uses plain HTTP.** `src/net.js:1` uses `http://scores.lumengames.example.com/...`. Poki serves games over HTTPS, so browsers will block this as mixed content. `src/net.js:4-5` also has no error handling.
8. **Save loading can crash boot.** `src/save.js:4-5` calls `localStorage.getItem` and `JSON.parse` with no guard. Storage access can throw in sandboxed iframes, and corrupt saved JSON throws. Either one stops `boot()` before the game starts (`src/main.js:89`).

**Serious bugs**

9. **Gems and score can be counted twice.** `src/main.js:51` calls `gameOver()` inside the storm loop, and `src/main.js:53` can call it again in the same frame. Each call runs `data.gems += ...` (`src/main.js:60`) and `save()`, so overlapping storms or a storm plus a fall double the gem total. Fix: `if (state.over) return;` at the top of `gameOver()`.
10. **Gameplay speed depends on frame rate.** Movement, gravity, and storm speed are per-frame, not time-based (`src/main.js:39-42`, `src/main.js:49`, `src/world.js:12`). On a 120 Hz display the game runs about twice as fast.
11. **Music may never start.** `src/main.js:92` calls `startMusic()` before any user gesture, and `src/audio.js:6` ignores the returned promise. Browsers reject autoplay there, so music silently never plays. `src/audio.js:12` has the same unhandled-rejection problem for sound effects.
12. **Debug log every frame.** `src/main.js:54` calls `console.log` at 60 fps. This costs performance and looks unprofessional in review.

**Gameplay and polish**

13. **Space and arrow keys scroll the page.** `src/input.js:6` does not call `preventDefault()`, so pressing space or an arrow scrolls the page.
14. **Player can leave the screen.** `src/main.js:39-40` does not clamp `p.x`, so the player can walk off either edge.
15. **Keys stick after focus loss.** `src/input.js:8-10` never clears `keys` on `blur`, so movement can continue after alt-tabbing.
16. **Caps Lock breaks controls.** `src/input.js:6` and `src/main.js:39-40` only match lowercase `w`, `a`, and `d`.
17. **Canvas does not scale.** `index.html:22` fixes the canvas at 960×540 and `style.css:2` does not scale it, so it overflows smaller viewports.
18. **"More games" link opens an external site.** `index.html:23` links to `lumengames.example.com` in a new tab. I did not verify Poki's rule on this, but outbound links are a common rejection reason, so check it.
19. **Unused asset listed.** `assets/manifest.json:5` lists `sprites.png`, which no code references. Remove it or use it.

**Limits of this audit**

- Static reading only. I did not run the game or test on a device.
- The Poki requirements check was a web search, not the full submission checklist, so items 2 and 3 need confirming against [sdk.poki.com](https://sdk.poki.com/sdk-documentation.html).
- Asset sizes come from the manifest because the files are not in the repo.