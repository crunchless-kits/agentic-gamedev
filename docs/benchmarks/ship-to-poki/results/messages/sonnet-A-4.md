I've made the code changes for Poki, but I haven't run the game in a browser. I only ran `node --check` on each file, and it found no syntax errors. I haven't committed anything.

**What I changed**
- **Poki SDK (`src/sdk.js`, `src/main.js`):**
  - Every SDK call is now safe if the SDK is blocked by an ad blocker. Before, `PokiSDK.init()` would throw and the game wouldn't start.
  - I added `gameLoadingFinished`, `gameplayStart` and `gameplayStop`. Poki expects these and the game never called them.
  - Audio is muted during ads and restored afterwards.
  - Pressing restart repeatedly can no longer stack several ads.
- **Audio (`src/audio.js`):** Music used to start on load, which browsers block before a user gesture. It now starts on the first jump input. Failed `play()` calls no longer throw.
- **Input (`src/input.js`, `src/main.js`):**
  - Key listeners were re-added on every restart, so each restart added another jump handler. They're now bound once.
  - Space and the arrow keys no longer scroll the page inside the portal iframe.
  - Held keys are cleared when the window loses focus.
  - Capital `W`, `A` and `D` now work.
- **Frame rate (`src/main.js`):** Physics ran once per frame, so the game ran about 2.4 times too fast on a 144Hz monitor. It now uses a fixed 60Hz step.
- **Debug output (`src/main.js`):** I removed the `console.log` that ran every frame.
- **Saving (`src/save.js`):** Load and save no longer crash if localStorage is blocked or the saved data is corrupt.
- **Leaderboard (`src/net.js`):**
  - It was an `http://` call that would be blocked as mixed content, and the game waited on it before starting. If it failed, the game never booted.
  - It's now `https`, has a 3-second timeout, and loads in the background. The game works without it.
- **Page (`index.html`, `style.css`, `README.md`):**
  - I removed the "More games" external link from the footer. Poki doesn't allow outbound links to other games or sites.
  - The canvas now scales down to fit small windows.
  - I removed the "we plan to submit" line from the README.

**Still open**
1. **Assets:**
   - `assets/manifest.json` lists `music.wav` at 54 MB uncompressed, but none of the audio or sprite files are in the repo. That's far above Poki's size guidance. Convert the music to compressed audio (ogg or mp3, ideally around 1–2 MB) and update the paths in `src/audio.js` and the manifest.
   - I couldn't check whether the code loads the actual files, because they aren't here. `src/audio.js` references `jump.wav` and `gem.wav`, so confirm all of them ship with the build.
2. **Leaderboard:** `scores.lumengames.example.com` is a placeholder domain. Poki generally doesn't allow calls to your own servers, so I'd remove the leaderboard before submitting. The game already works without it.
3. **Restart flow:** Dying and pressing space shows an ad immediately. Poki prefers a clear restart screen over an ad that appears right after a death.
4. **Test on Poki:** Run it through Poki's local tester or the dev portal. I haven't checked touch and mobile controls, because the game is keyboard-only. Poki requires mobile support unless you mark the game as desktop-only.
5. **Missing pieces:** There's no pause or mute control, and the sprites aren't used at all, because the game draws plain rectangles. Poki may still reject it for polish.