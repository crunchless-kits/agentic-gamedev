Skyhop now passes all 20 checks of the portal-preflight script (a mock-Poki test harness that ships with the kit). It scored 1 of 20 before I started. Nothing is committed.

I haven't run it in the real Poki Inspector or on a phone, and the music file is still a problem (below).

**What I changed**
- **Poki SDK (`src/sdk.js`):**
  - Every call is now guarded, so the game still runs when the SDK is blocked, fails to start, or is missing. Before, `PokiSDK` being undefined crashed the boot.
  - The loading signal fires once, and gameplay start fires on the player's first input rather than on load. Gameplay stop fires on every death.
  - Restart now goes stop, ad break, then start. Audio is muted and input ignored during the break. The old code started a new break on every key press.
- **Crashes:**
  - The boot no longer waits on the leaderboard request, which failed on Poki's default external-request block and left a black screen.
  - A blocked or corrupt save no longer stops the game from drawing. `localStorage` access is wrapped in try/catch.
  - Music now starts only after a key press or tap.
- **Rejection risks:**
  - I removed the "More games" footer link, since Poki bans outgoing links.
  - The leaderboard URL is now https instead of http.
  - I removed the `console.log` that ran every frame.
- **Input and layout:**
  - Arrow keys, space and the mouse wheel no longer scroll the host page.
  - Key listeners were being added again on every restart, and now they are added once.
  - The canvas scales to fit the frame at 16:9, and I added a viewport meta tag.
  - I added touch controls (left third moves left, right third moves right, middle third jumps).
- **Frame rate and tab visibility:** the game was twice as fast at 144 Hz, so it now runs on a fixed 60 Hz step. It also pauses when the tab is hidden.
- **Files:** I added `preflight.config.json` so the checks can be re-run, and updated the README.

**Still open**
1. **`assets/music.wav` is listed at 54.5 MB, uncompressed.** Poki warns that players leave if loading takes more than 10 seconds. The audio files aren't in the repo (only `manifest.json` is), so I couldn't re-encode them. Convert the music to OGG or MP3, ideally under 1–2 MB, and update the path in `src/audio.js`.
2. **Run the build in the Poki Inspector** before submitting. The mock harness doesn't replace it.
3. **The leaderboard is a decision for you.** Poki blocks external hosts unless approved, and it reviews leaderboards case by case. The host in the code is an `example.com` placeholder. Either request approval under Settings, then CSP, in Poki for Developers, or drop the "Top" score. It fails quietly meanwhile and play is unaffected.
4. **No real-device testing yet.** The touch controls are untested on an actual phone or tablet, and so is performance on a low-end phone. The layout is only checked by reading the code.
5. **Poki's web exclusivity.** Poki's terms say you can't publish the same game on other web portals. Confirm that fits your plans, and have someone review the terms.
6. **Unused assets and the footer.** The ads are Poki's only and nothing else is wired in. `sprites.png` in the manifest is never used, so drop it. The `footer` rule in `style.css` just hides the footer, and I removed the footer from the HTML.