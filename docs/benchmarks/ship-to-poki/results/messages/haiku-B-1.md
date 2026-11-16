Skyhop is patched for the Poki-specific problems I could find in the code. It is not ready to submit yet. The soundtrack and sound effects are missing from the repo, and I could not run the game in a browser or in Poki's Inspector. Nothing is committed.

**What I changed** (uncommitted, in `src/`, `index.html`, and `style.css`)
- **Boot can no longer fail on the portal.** The game used to wait on the Poki SDK and a leaderboard fetch before starting. Now a missing or failing SDK just means no ads, and the game still runs.
- **Poki lifecycle added.** `gameLoadingFinished` fires once the game is ready. `gameplayStart` fires on the first input. `gameplayStop` fires on game over, pause, and tab hidden. Start and stop never fire twice in a row. Each restart runs `commercialBreak` with audio muted during the ad.
- **External requests removed.** The leaderboard fetch went to an `http://` placeholder domain, and Poki blocks external requests. I deleted `src/net.js` and the "Top" score display. I also removed the footer with its "More games" link and "Made by Lumen Games" text, since Poki requires external links to go through the SDK and disallows studio branding.
- **Bugs fixed.**
  - Keyboard listeners stacked up on every restart, so one press could trigger several jumps and ads.
  - Game over could run more than once in a frame, double-counting gems.
  - The per-frame `console.log` is gone.
  - Autoplay music now starts on the first input.
  - `localStorage` is wrapped in try/catch.
- **Mobile and input.** Added a viewport meta tag, 16:9 scaling to fit the screen, on-screen Left/Jump/Right buttons on touch devices, and Esc to pause. Space and arrows no longer scroll the page.

**Checks I ran**
- Syntax-checked all `src` modules.
- Ran the SDK adapter against a stub `PokiSDK` (lifecycle order, no duplicate events, mute during ads, no-SDK path). It passes.
- I did not run the game in a browser, so the layout, touch controls, and pause overlay are unverified.

**Still open (you need to act or decide)**
1. **Audio files are missing.** `assets/music.wav`, `jump.wav`, and `gem.wav` are not in the repo, and `manifest.json` lists them as if they exist. The game runs silently until they are added. I can't create the soundtrack.
2. **Music size.** The manifest lists `music.wav` at 54 MB uncompressed. Poki says players leave after 10 seconds of loading, so export it as OGG or MP3. `sprites.png` is listed but unused and missing, so remove it from the manifest.
3. **Test in Poki's Inspector.** Drag the build folder in and confirm the event order. One line in the live docs says `commercialBreak` "fires only when returning from a pause into gameplay." That conflicts with the snapshot in the kit, which says to call it at every death or restart. I followed the snapshot. Confirm in the Inspector.
4. **Load time and size.** Measure them on a real connection after step 2. I did not measure them.
5. **Leaderboard.** Removed for the portal. If you want top scores back, it needs a Poki-compliant route. The old endpoint was a placeholder, so there's nothing to restore.
6. **Mobile check.** Poki's docs mention `movePill` for mobile. I did not confirm whether Skyhop needs it. Check it in the Inspector.
7. **Other items I did not check.** The Poki developer account, content rating, and kids-audience rules (COPPA) are outside this code. The kit suggests a lawyer review before launch.

I did not commit or bump the version (still 0.9.0). Say when you want a commit.