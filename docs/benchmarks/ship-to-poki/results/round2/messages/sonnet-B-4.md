I fixed the problems Poki would reject or that would break the game. The portal preflight now passes 20 of 20 checks, but Poki's Inspector hasn't been run yet. Nothing is committed.

**What I changed**
- **SDK (`src/sdk.js`):**
  - `init()` was unguarded, so with an ad blocker or a blocked script the game never booted. It now falls back to running without the SDK.
  - I added `gameLoadingFinished`, `gameplayStart` and `gameplayStop`. Start fires on the first input and after each restart break. Stop fires on death.
  - The ad break now pauses the simulation, mutes audio and ignores input until it ends. It has a 60 s timeout.
- **Leaderboard (`src/net.js`, deleted):**
  - It was a plain `http://` request to an external host. Poki blocks external requests, and an https page blocks plain http anyway.
  - It was awaited at boot, so a blocked request would hang the game.
  - I removed it and the "Top" score from the HUD.
- **Outgoing link:** I removed the footer "More games" link, which Poki prohibits.
- **Page and input:**
  - Arrow keys, space and the wheel no longer scroll the host page.
  - Key listeners were re-added on every restart; they are now bound once.
  - I added touch controls: left third moves left, right third moves right, middle jumps.
- **Scaling:** I added a viewport meta tag, and the canvas now scales at 16:9.
- **Frame rate:** movement was tied to the frame rate, so a 144 Hz screen ran the game about 2.4 times as fast. It now uses a fixed 60 Hz step with the same feel.
- **Hidden tab:** the game pauses and mutes when the tab is hidden.
- **Console and clean build:** I removed the per-frame `console.log`.
- **Saves:** `localStorage` is wrapped in try/catch, and corrupt saves fall back to defaults.
- **Audio:** a blocked or missing sound no longer throws. Music now starts on the first input.
- **New files:** `preflight.config.json` is new, and I added a line each on touch and preflight to the README.

**What is still open**
- **Audio files are missing.** `assets/` holds only `manifest.json`. `music.wav` (listed at 54 MB), `jump.wav`, `gem.wav` and `sprites.png` aren't in the repo. The game runs silently without them, but you'll need to add them.
- **`music.wav` is too big.** At 54 MB uncompressed it will make loading slow, because Poki warns that players leave after about 10 seconds. Compress it to ogg or mp3 before you submit.
- **Poki Inspector not run.** The preflight doesn't replace it, so drag the build folder into the Inspector and check the event log.
- **Not checked by the tool:**
  - Touch controls are untested on a real device.
  - Canvas scaling is not verified, because the tool has no real layout. I only confirmed the CSS by reading it.
  - Performance on a low-end phone is unmeasured.
- **Leaderboard:** if you want it back, it has to be https and Poki has to approve it. Poki reviews external leaderboards case by case.
- **Other portals:** Poki's terms say you can't publish the same game on other web portals. Check that against your plans.
- **Assumption:** the SDK snapshot in the repo was verified today, so I didn't re-fetch the docs.