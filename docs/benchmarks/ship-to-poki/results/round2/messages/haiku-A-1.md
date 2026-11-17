Skyhop is patched for the Poki problems I could find in the code, but it is not ready to submit yet. The biggest open problem is that the audio and sprite files are missing from the repo. I syntax-checked everything, but I have not run the game in a browser.

## What I changed (uncommitted, in the working tree)

**Things that would have been rejected or broken on Poki**
- **External requests:** Poki blocks outgoing requests by default. The leaderboard fetch went to `http://scores.lumengames.example.com`. That fails on an https page, and it also stopped `boot()`, so the game never started. I removed the fetch, the `src/net.js` file, and the "Top" score display.
- **External link:** I removed the "More games" link to `lumengames.example.com` from the footer. Poki asks games to have no outgoing links.
- **SDK lifecycle:** The game never called `gameLoadingFinished`, `gameplayStart` or `gameplayStop`. I added them. `commercialBreak` now mutes audio during the ad and unmutes afterwards. The wrapper is a no-op if the SDK didn't load.
- **Mobile controls:** The game was keyboard-only. I added basic touch controls: hold the left or right 30% of the canvas to move, tap the centre to jump. The canvas also scales down to fit small screens.

**Bugs that would break the game on the portal**
- **Duplicate listeners:** `bindKeys` ran on every new run, so each restart stacked another keydown handler. Input is now bound once at boot.
- **Repeated restarts:** Pressing jump during an ad could start several restarts. A `restarting` flag now blocks that.
- **Double game-over:** Two storms hitting in the same frame could count gems twice. `gameOver()` now returns early if the run is already over.
- **Startup crashes:** Music autoplay is blocked until the first input, so it now starts on the first key or touch. Audio `play()` rejections are caught. `localStorage` failures and corrupt save JSON are caught.
- **Page scroll:** Space and arrow keys no longer scroll the page.
- **Per-frame log:** I removed `console.log` from the update loop.

## Still open (before next week)

1. **Audio and sprite files are missing from the repo.** `assets/` contains only `manifest.json`. `music.wav`, `jump.wav`, `gem.wav` and `sprites.png` need to be added. Without them the game runs silently.
2. **Music is too large.** The manifest lists `music.wav` at 54 MB uncompressed. Poki's guidelines target an initial download under about 8 MB. Convert it to OGG or MP3 and check the total size.
3. **SDK call signatures are unverified.** I wrote `commercialBreak(onStart)`, `gameplayStart`, `gameplayStop` and `gameLoadingFinished` from memory. My web search returned only snippets, not the full docs. Check them against sdk.poki.com (or run Poki's inspector) before submitting.
4. **Not run in a browser.** I only syntax-checked with `node --check`. Run `npm start`, play a few runs, and test touch on a phone.
5. **Portal metadata is not in the repo.** Poki needs a thumbnail, icon, title and description. I haven't created any of these.
6. **Leaderboard is gone.** If you want it back, it needs a Poki-approved HTTPS endpoint.
7. **Git hygiene.** I did not commit. Git warned about line endings, since my edited files use LF and the working copy is set to CRLF. Normalize before committing if that matters for you.