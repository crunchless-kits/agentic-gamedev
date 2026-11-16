Skyhop is not ready to submit yet. I fixed the code problems I could find and verify without a browser, but the game has no audio files in the repo, and Poki's Inspector has not been run.

**Blocking**
- **Audio files are missing.** `assets/` contains only `manifest.json`. `music.wav`, `jump.wav`, and `gem.wav` were never committed, and `sprites.png` (listed in the manifest) is not there either. The game now plays silently instead of failing, but the music you intend to ship has to be supplied.
- **The music is a 54 MB uncompressed WAV.** That is too large for a portal build. Re-export it as OGG or MP3. I have no ffmpeg here, so I couldn't do this.

**What I changed (uncommitted)**
- **Poki lifecycle** (`src/sdk.js`, `src/main.js`): the game now calls `gameLoadingFinished` once, then `gameplayStart`/`gameplayStop` in the documented order, including on tab hide/show. The restart break pauses input and mutes audio via `onAdStart`, with a 60-second timeout fallback. Before, there were no lifecycle calls at all.
- **SDK failure no longer blocks the game** (`src/sdk.js`): an `init` failure, or the SDK script being blocked, now lets the game load.
- **Ad and input bugs** (`src/main.js`, `src/input.js`): the input listeners were re-added on every restart, so one keypress could trigger several ad breaks. They now bind once. Two storms overlapping the player in the same frame could end the run twice and double-count gems; that is guarded now.
- **No external requests** (`src/net.js`): the leaderboard fetch was running against an `example.com` placeholder over `http://`, which blocks on an https portal and would have broken startup. It is now disabled by a flag and fails quietly.
- **No outgoing links** (`index.html`): removed the "More games" link. Poki requires links to go through `PokiSDK.openExternalLink`. The "Made by Lumen Games." credit stays.
- **Mobile** (`index.html`, `style.css`, `src/input.js`): added a viewport meta tag, the canvas now scales to fill the screen at 16:9, and there are touch controls (tap to jump, hold left or right half to move). Before, phones had no controls at all.
- **Audio** (`src/audio.js`): music starts on the first player input (browsers block autoplay), and rejected `play()` promises are handled.
- **Save** (`src/save.js`): localStorage errors are caught, since Poki's docs say incognito storage can throw.
- **Debug output**: removed the per-frame `console.log`. The README controls line now covers touch.

**Verification**
- All modules pass `node --check`.
- A headless smoke test with stubbed browser globals confirmed the call order: `init > loadingFinished > gameplayStart`, then on death `gameplayStop`, then one break followed by `gameplayStart`, with extra presses during the ad ignored.
- I did not run it in a real browser, on a phone, or in the Poki Inspector.

**Still open**
1. Supply the audio files, compressed (see above).
2. Run the build through the Poki Inspector and check the event log, then test touch on a real phone and a tablet.
3. Decide on the leaderboard. It stays off for Poki. Turning it on needs an https endpoint that Poki approves.
4. The Poki docs don't show an SDK version or date, and I could not confirm the bundle format or a file-size limit. Check the developer requirements page and the Terms PDF before submitting.
5. The portal's "no external requests" rule also covers the Google Fonts/CDN-style requests if you add any later. The only external request now is the Poki SDK script itself.

Nothing is committed. Say the word and I'll commit these changes.