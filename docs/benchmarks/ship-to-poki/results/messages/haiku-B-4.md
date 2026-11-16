Skyhop is patched for the Poki rules I could verify, but it is not ready to submit. Several blockers need your files or decisions, and I haven't run it in a browser or in Poki's Inspector. Nothing is committed.

**What I changed**

- **Missing assets are the biggest blocker.** `assets/` contains only `manifest.json`. `music.wav`, `jump.wav`, `gem.wav` and `sprites.png` are absent from the repo. The audio code now catches play errors instead of throwing, so the game runs silently rather than crashing. Your real files need to go in.
- **Leaderboard turned off for the portal.** Poki blocks external requests by default. The fetch went to an `http://` host. It's now behind `LEADERBOARD_ENABLED = false` in `src/net.js`, with a 3-second timeout and a fallback. The HUD shows "Top -". Turning it on needs an https host and Poki's CSP approval.
- **Lifecycle calls added** in `src/sdk.js` and `src/main.js`:
  - `gameLoadingFinished` once the game loop starts.
  - `gameplayStart` on first input, not on load. The game now opens on a title screen until the first input.
  - `gameplayStop` on game over, pause (P key, or tab hidden) and resume.
  - Restart uses the documented stop → `commercialBreak` → start sequence. Input is ignored during the ad, and the game mutes only if an ad actually plays.
- **SDK calls are fail-soft.** If the SDK is missing or init hangs, the game still runs. Init has a 3-second timeout and ad breaks have a 2-minute safety timeout.
- **Bugs fixed:**
  - `bindKeys` was re-registered on every restart, so each key press fired multiple times.
  - A storm plus a fall in the same frame could save gems twice.
  - The per-frame `console.log` is removed.
  - Arrow and space keys no longer scroll the page inside the portal frame.
  - `localStorage` is wrapped in try/catch for Poki's incognito case.
- **External link fixed.** The "More games" footer link now calls `PokiSDK.openExternalLink` instead of a plain link.
- **Mobile basics.** The canvas scales with the viewport. I added touch input: hold the left or right third to move, tap the middle to jump or start. I haven't tested this on a device.

Syntax checks pass on all modules, but I didn't run the game in a browser.

**Still open**

1. Supply `music.wav`, `jump.wav`, `gem.wav` (and `sprites.png` if it's meant to ship; no code uses it). The manifest lists 54 MB of uncompressed music. Convert it to ogg or mp3 before submission. Poki wants loading under about 10 seconds, and the docs give no byte limit to check against.
2. Confirm the real "More games" URL. `lumengames.example.com` is a placeholder. The leaderboard host is also a placeholder.
3. Run the build through the Poki Inspector and confirm the event order and that no console errors appear.
4. Test on a phone. Portrait mode is not handled; the game is landscape-only.
5. The Poki docs I read don't show an SDK version or date, and they don't document `adsBlocked`, so I didn't use it. The notes in `.claude/skills/poki-integration/references/poki-sdk-notes.md` say to fire `commercialBreak` at every break; the docs I read wording it as tied to returning from pause, so check that before you rely on the ad frequency.
6. Decide whether the title screen is acceptable. It's a small change to the start of play.

I haven't committed anything. The README still says the SDK tag is in place, which is accurate, but it doesn't mention these open items.