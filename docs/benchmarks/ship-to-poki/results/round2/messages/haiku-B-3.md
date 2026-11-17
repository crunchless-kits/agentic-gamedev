Skyhop is not ready to submit yet. The code now passes the kit's 20-check Poki preflight, but the audio files the game loads are missing from the repo, so the Poki build can't be produced. I did not commit anything.

**Changed**

- **Missing assets (blocker, not fixed):** `assets/music.wav`, `jump.wav`, and `gem.wav` are not in the repo or git history. The manifest lists a 54 MB uncompressed WAV for music. I couldn't compress or replace them, since there's no ffmpeg here.
- **External requests and links:** removed the `lumengames.example.com` footer link and deleted `src/net.js`, which fetched an external leaderboard. Poki blocks external requests by default. The "Top" score in the HUD is gone and "Best" stays.
- **Poki lifecycle (`src/sdk.js`, `src/main.js`):** the SDK is now wrapped in one adapter that never throws, with timeouts. `gameLoadingFinished` fires after the first frame. `gameplayStart` fires on the first input, and `gameplayStop` fires on game over. Restarts run `commercialBreak` with audio muted, then `gameplayStart`. Input is ignored during the break.
- **Restart bugs:** key listeners were re-added on every restart, so they stacked. They now bind once at boot. A game over could also count twice, which is now guarded.
- **Page and input rules (`src/input.js`):** arrow keys and space call `preventDefault`, and the wheel is blocked. Added touch controls: hold the left or right third of the screen to move, tap the middle to jump. The game previously had no touch input at all.
- **Audio and tab behaviour (`src/audio.js`, `src/main.js`):** music starts on the first input, not at load, and playback failures are caught. Audio pauses when the tab is hidden. The game uses a fixed 60 Hz step, so speed no longer depends on frame rate.
- **Storage (`src/save.js`):** localStorage calls are wrapped in try/catch, so the game still plays in incognito or with corrupt saves.
- **Layout (`style.css`, `index.html`):** the canvas scales to fit the viewport at 16:9. Added a viewport meta tag.
- **Build (`scripts/build-poki.mjs`, `package.json`, `.gitignore`):** `npm run build` writes `dist/` with only the game files, so `.claude/`, the docs, and the manifest stay out of the upload. It currently stops because of the missing audio.
- **Preflight config (`preflight.config.json`):** new, so the check can be re-run.

**Verification**

- The Poki SDK docs I re-read today match the notes the kit already had: same script URL and method names.
- Preflight: 20 of 20 pass, run on the source tree with `dir: "."`. It does not load the audio files, because they are missing, so audio is untested.
- The build was run and fails as intended on the missing assets.
- Syntax check passes on all edited JS.

**Still open**

1. Get the audio files. Compress the music to OGG or MP3, since a 54 MB file will load too slowly for Poki's 10-second guideline. Then run `npm run build`.
2. Run Poki Inspector on `dist/` and check the event order in its log. The kit's preflight does not replace it.
3. Test touch controls on a real phone and tablet. Preflight does not measure them.
4. Decide on the leaderboard. Restoring it needs Poki approval for an external request.
5. Check the web-exclusivity rule before submitting, since Poki requires the game not be published on other web portals.
6. Legal review of ads, consent, and kids/COPPA status is still needed. This is not legal advice.