Skyhop is patched for the Poki portal, but I haven't run it. I only syntax-checked the JS, so there's no Poki Inspector output yet. I haven't committed anything.

**What I changed**
- **SDK adapter (`src/sdk.js`):**
  - The game used to crash if the Poki script was blocked or `init` rejected. It now falls back to no-ops.
  - I added the missing `gameLoadingFinished`, `gameplayStart` and `gameplayStop` calls, which Poki tracks.
  - Restart now runs gameplayStop, then commercialBreak, then gameplayStart, as the notes document. The game mutes only if an ad actually plays.
  - I followed `poki-sdk-notes.md` (verified 2026-11-06, so within 90 days) and did not re-fetch the live docs.
- **Restart bug:** `bindKeys` was called on every run, so each restart added another key listener and stacked jumps. Input is now bound once. Pressing space during an ad no longer triggers repeated restarts.
- **External link:** I removed the "More games" `target=_blank` footer link, since Poki bans external links outside the SDK.
- **Leaderboard (`src/net.js`):** it used `http://` and blocked startup on a request to an unrelated domain. It now uses `https://`, has a 3-second timeout, returns `[]` on any failure, and no longer blocks boot.
- **Audio:**
  - `music.play()` ran before any user gesture, which browsers reject. Music now starts on the first input.
  - Play errors are swallowed instead of becoming unhandled rejections.
  - Added a mute function, used during ad breaks and when the tab is hidden.
- **Mobile:** I added touch controls (left third moves left, right third moves right, middle jumps), a viewport meta tag, and a responsive 16:9 canvas.
- **Keyboard:** the arrow keys and space no longer scroll the page. Held keys now reset when the window loses focus.
- **Frame rate:** physics was tied to the display refresh rate, so 120 or 144 Hz monitors ran the game too fast. It now runs a fixed 60 Hz step.
- **Pause and save:** the tab pauses, mutes and sends gameplayStop when hidden. Save load and write no longer throw if storage is blocked or the data is corrupt.
- **Cleanup:** I removed the `console.log` that fired every frame.

**Still open**
1. **`assets/music.wav` is 54.5 MB.** The file isn't in the repo, only `manifest.json` lists it. This is the biggest rejection and loading-time risk. Compress it to OGG/MP3 (roughly 1–3 MB) and update the path in `src/audio.js`. I couldn't do this without the file.
2. **Leaderboard:** I don't know if `scores.lumengames.example.com` is a real service. If it isn't, or Poki's rules disallow the request, delete `src/net.js` and the "Top" label. Please confirm.
3. **Poki Inspector:** run the build through it and check the event order: loading finished once, start and stop paired, nothing during ads.
4. **Poki's live rules:** I didn't re-check them. Look at the loading-time limits and content policy.
5. **Testing:** I haven't tested on a low-end phone or in an iframe.
6. **Smaller items:**
   - `sprites.png` (412 KB) is listed in the manifest but never used.
   - There is no pause menu or mute button. Poki doesn't strictly require one, but players expect it.
   - There's no `poki` build variant. The SDK script tag is still hard-coded in `index.html`.
7. **Privacy:** if you add tracking or personalized ads, the compliance skills mentioned in the Poki notes apply.