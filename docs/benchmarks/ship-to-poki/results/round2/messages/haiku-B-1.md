Skyhop now passes all 20 checks in the kit's Poki preflight. Before my changes it passed 1 of 20. The changes are uncommitted in the working tree; say the word if you want a commit.

## What I changed

**Would have been rejected or broken on Poki:**
- **Game wouldn't start if a request was blocked.** Boot awaited a fetch to `scores.lumengames.example.com`, which Poki blocks by default. The leaderboard is now off (`src/net.js`), and boot never waits on it.
- **SDK missing or blocked crashed boot.** `src/sdk.js` is now an adapter that no-ops when `PokiSDK` is missing or `init()` rejects, with a 3-second init timeout.
- **Lifecycle calls were absent.** `gameLoadingFinished()` now fires once after boot. `gameplayStart()` fires on the first input, not on load. `gameplayStop()` fires on game over and when the tab is hidden.
- **Ads weren't wired.** Restart now runs `commercialBreak`, then `gameplayStart`. Input is ignored during the break, and audio is muted during it. There's a 30-second fallback timeout.
- **External link in the footer.** Removed (`index.html`).
- **Per-frame `console.log`.** Removed.
- **Page scrolls on arrows or space.** `preventDefault()` on those keys and the wheel (`src/input.js`).
- **Listeners stacked on every restart.** Input is bound once at boot. Previously, 32 listeners after three restarts.
- **Storage.** `localStorage` access is wrapped in try/catch, and corrupt saves fall back to defaults (`src/save.js`).
- **Unhandled audio rejections.** `play()` is guarded, and music starts on the first input (`src/audio.js`).
- **Speed tied to frame rate.** Fixed 60 Hz simulation step, so it plays the same at 60 and 144 Hz.
- **Tab hidden.** Pauses the simulation and mutes audio. Returning shows a paused prompt and resumes on input.
- **No mobile input.** Added touch: left third holds left, right third holds right, center taps jump.
- **Fixed 960×540 canvas.** Now scales to 16:9 with CSS, and the viewport meta tag is set.

**Bug fixed along the way:** a storm overlap could call game over more than once and double-count gems. Game over now runs once per run.

**Gameplay changes to be aware of:**
- The game waits for the first key or tap before starting. Before, it ran immediately.
- Holding left or right on touch, and tapping center to jump, is my layout choice. Adjust if you want something else.

## Evidence

- Preflight on the original commit, with the same config: 1 of 20 passed.
- Preflight on the current build: 20 of 20 passed.
- I wrote `preflight.config.json` in the project root (kept in the repo, as the skill asks). Its death step holds ArrowLeft to walk off the island. My first attempt used a timed wait, and the player never died, so that run tested nothing. This changed the test driver, not the game.
- I used the Poki SDK snapshot dated 2026-11-16 from the kit. It's inside the 90-day window, but I did not re-fetch the live docs today.

## Still open

1. **The audio and sprite files are not in the repo.** `assets/` holds only `manifest.json`, so `music.wav`, `jump.wav`, `gem.wav`, and `sprites.png` are missing. The game runs silent and logs 404s on the portal. The manifest lists a 54 MB uncompressed WAV for music. Poki wants small files, so re-encode the music to ogg or mp3 and add the sounds.
2. **Leaderboard is disabled.** Re-enabling it on Poki needs Poki's approval of the host under Settings, then CSP. Decide whether you want to request that.
3. **Not verified in a real browser.** The preflight can't check the 16:9 scaling or touch controls. Both are only checked by reading the code. The Poki Inspector run is also still to do, and it's the one check that matters most before submission.
4. **Web exclusivity.** Poki requires that the game not be on other web portals or aggregators. Confirm that before you submit.
5. **Ad-break timeout.** The 30-second fallback is my choice, not a Poki value. Tell me if you want it different.