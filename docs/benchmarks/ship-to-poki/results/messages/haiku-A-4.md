Skyhop is ready for code review but not yet submittable: the audio files are missing from the repo, and the soundtrack is far too large for Poki. I haven't committed anything. The changes are in the working tree for you to review.

## What I changed

**Poki rules**
- **Removed the external leaderboard** (`src/net.js`, deleted). It called an `http://` placeholder domain, and Poki bars external services without its consent. The HUD no longer shows "Top".
- **Removed the outgoing "More games" link** from the footer. Poki asks for no outgoing links. The "Made by Lumen Games." text stays.
- **Removed the per-frame `console.log`** debug output.
- **Added SDK gameplay events.** `gameplayStart()` fires on the player's first input, and `gameplayStop()` fires on game over.
- **Mute during ads.** `commercialBreak` now receives a callback that mutes all audio, and audio is unmuted after the break.
- **Input is ignored during an ad**, so a key press can't start a second ad or jump.

**Crash and breakage fixes**
- **`bindKeys` was called on every restart**, stacking listeners so each jump fired several times. It now binds once at boot.
- **Gems were double-counted** when two storms hit in the same frame. `gameOver()` now runs once per run.
- **SDK failures no longer block boot.** If the Poki script is blocked, the game still runs.
- **Audio autoplay.** Music starts on the first input, because browsers block autoplay. Play promise rejections are caught.
- **Save data.** Corrupt or unavailable `localStorage` falls back to defaults instead of throwing.

**Polish**
- Space and arrow keys no longer scroll the page inside the iframe. Held keys are cleared when the window loses focus. Auto-repeat doesn't trigger jumps.
- The canvas scales down to fit narrow windows.

I syntax-checked all modules with Node. I did not run the game in a browser, and I could not test the Poki SDK here.

## What is still open

1. **Audio files are missing.** `assets/` only has `manifest.json`. `music.wav`, `jump.wav`, `gem.wav` and `sprites.png` aren't in the repo, so the game is silent. Add them before submitting.
2. **The soundtrack is too big.** The manifest lists `music.wav` at 54 MB uncompressed. Poki's requirements page targets an initial download under about 8 MB. Re-encode the music as OGG or MP3, update the path in `src/audio.js`, and check the total size.
3. **`sprites.png` is unused.** The code never references it, and it's missing. Drop it from the manifest if you don't need it.
4. **Verify the SDK calls.** The search didn't confirm the exact `commercialBreak(onStart)` signature. Check it against sdk.poki.com's HTML5 reference, and test the flow in Poki's sandbox.
5. **Not in the repo:** Poki's thumbnail, title and metadata requirements, plus a run through their final review checklist.
6. **Stale README.** It still describes the old submission plan. I left it as is.