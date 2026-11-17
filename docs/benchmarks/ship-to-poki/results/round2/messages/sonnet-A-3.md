I fixed the code-level problems that would break Skyhop on the portal or get it rejected. I didn't commit anything. All the JS files pass `node --check`, but I haven't run the game in a browser or inside Poki's QA iframe.

## What I changed

**Poki SDK (`src/sdk.js`, `src/main.js`)**
- **Lifecycle calls:** the game now calls `gameLoadingFinished()`, `gameplayStart()` and `gameplayStop()`. Before, none of them were called, and Poki requires them. Gameplay starts on the first move or jump, and stops on game over and during ads.
- **SDK missing:** every SDK call is now guarded. Before, an ad blocker or a failed script load made `PokiSDK.init()` throw, and the game never booted.
- **Audio during ads:** the game is muted during commercial breaks and unmuted afterwards. Poki requires this.
- **Restart:** a restart flag stops a held or repeated space key from triggering several ads at once.

**Network (`src/net.js`)**
- The leaderboard URL was `http://`, which browsers block as mixed content inside Poki's HTTPS frame. I changed it to `https://`.
- A failed leaderboard fetch used to stop the game from starting. The fetch now has a 3-second timeout and returns `[]` on any error. It also runs after the game has started instead of before.

**Compliance**
- **Footer:** I removed the "Made by Lumen Games / More games" footer. Poki doesn't allow external links or branding that send players off the portal.
- **Console logging:** I removed the `console.log` that ran every frame.

**Input and audio**
- **Key listeners:** `bindKeys` ran on every restart, so each restart added another set of key listeners. It now binds once.
- **Page scrolling:** space and the arrow keys now call `preventDefault`, so they no longer scroll the portal page. Held keys are cleared when the window loses focus.
- **Autoplay:** music used to start on boot, and the browser blocks that before any user input. It now starts on the first input, and rejected `play()` calls are caught.

**Robustness**
- **Saves:** `localStorage` access is wrapped in try/catch, and corrupt saved JSON falls back to defaults. Both previously crashed the game, and `localStorage` can throw in sandboxed iframes.
- **Layout:** I added a viewport meta tag and CSS so the canvas scales to fit the frame without scrollbars.

## Still open

1. **Asset size (most likely to block you).** `assets/manifest.json` lists `music.wav` at about 52 MB, uncompressed. Poki wants the initial download to be small (around 8 MB or less is the usual target) and wants load times kept short. The audio files aren't in the repo, so I couldn't convert them. Re-encode the soundtrack to OGG or MP3 (a few MB), lazy-load it, update the path in `src/audio.js` and update the manifest. Check `jump.wav` and `gem.wav` too.
2. **Leaderboard.** `scores.lumengames.example.com` is a placeholder domain. Poki may not allow calls to external servers, and the game shows "Top -" when the fetch fails. Either remove the feature or confirm it with Poki. I'd remove it.
3. **Other Poki requirements I couldn't check from the code.**
   - Thumbnails and metadata.
   - The ad-break placement. Right now it's on every restart. That is a natural break, but you may want to limit how often it fires.
   - Mobile and touch controls. The game is keyboard-only, and Poki expects mobile support unless you mark the game desktop-only.
4. **Testing.** Run it through Poki's QA tool or local test mode (`?tag=...` with the SDK debug mode) before submitting.
5. **README.** It still says the SDK tag is "already in index.html". That's accurate, but you may want to update it.