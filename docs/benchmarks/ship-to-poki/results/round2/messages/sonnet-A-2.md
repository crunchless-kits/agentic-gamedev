I've finished the code fixes. Syntax checks pass on all the JS files. I haven't run the game in a browser or committed anything.

**What I changed**
- **Poki SDK (`src/sdk.js`, `src/main.js`):**
  - The game now calls `gameLoadingFinished` after init, `gameplayStart` on each run and `gameplayStop` on game over.
  - Every SDK call is wrapped in a guard, so an ad blocker or a failed SDK load no longer stops the game from starting.
  - Ads now mute the audio and block input while they play, and a restart can't be triggered twice during an ad.
- **Leaderboard (`src/net.js`):** I removed the call to the `http://` leaderboard. Poki wants no external requests, and a plain-`http` call is blocked as mixed content on an https portal. It now returns an empty list, so the HUD's "Top" shows "-".
- **Footer:** I removed the "More games" link to `lumengames.example.com` from `index.html`. Poki rejects external links and branding.
- **Console logging:** I removed the `console.log` that ran every frame.
- **Duplicate input handlers:** `bindKeys` was called on every new run, so each restart stacked another set of listeners (extra jumps and extra ads). It's now bound once, ignores key auto-repeat, and clears held keys when the window loses focus.
- **Page scrolling:** Space and the arrow keys no longer scroll the portal page.
- **Music autoplay (`src/audio.js`):** Music used to start before any click or keypress, so browsers blocked it with an unhandled promise error. It now starts on the first jump, and every `play()` call is guarded.
- **Frame rate:** The game ran faster on 120Hz and 144Hz monitors. It now simulates at a fixed 60Hz.
- **Saving (`src/save.js`):** Loading and saving no longer crash when `localStorage` is blocked or the saved data is corrupt.
- **Scaling (`style.css`):** The canvas was a fixed 960×540. It now scales to fit the window at 16:9.

**Still open**
- **Audio size:** `assets/manifest.json` lists `music.wav` at about 52 MB uncompressed. Poki has initial-download size limits and will almost certainly flag it. The audio and image files aren't in this repo, so I couldn't convert them. Re-encode the music to OGG, MP3 or AAC at about 1–3 MB, and update the path in `src/audio.js` and the manifest.
- **Missing assets:** The same files are missing from the repo, so I couldn't test with the real audio and sprites.
- **No pause on tab switch:** Audio and the game don't pause when the tab loses focus.
- **No touch or mobile controls:** The game is keyboard-only. Poki asks for mobile support, or for the game to be marked desktop-only on submission.
- **Leaderboard:** If you want one, it needs to go through Poki's tooling.
- **Submission details:** The README says the SDK tag is in place, and it is. Check the thumbnail and game metadata against Poki's requirements.
- **Real-browser test:** Run it once on Poki's QA/sandbox link before submitting. That should cover the ad flow, an ad-blocked load and a high-refresh display.