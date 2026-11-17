Skyhop now passes all 20 checks in the Crunchless portal preflight, up from 1 of 20 before my changes. That preflight is a script-based check run in a fake browser. It is not Poki's Inspector, and I couldn't run the Inspector here. I haven't committed anything.

## What I changed

**Would have broken on the portal**
- **Boot hang:** the game hung forever if the Poki script was blocked or `init()` rejected, if the leaderboard request failed, or if localStorage threw. I fixed all four, so the game now boots in each case. The SDK calls are guarded in `src/sdk.js`. The leaderboard fetch in `src/net.js` no longer blocks boot and times out after 3 seconds. The save code in `src/save.js` falls back to defaults on storage errors or a corrupt save.
- **Frame rate:** speed was tied to the frame rate, so it ran 2.4× too fast on 144 Hz screens. It now runs on a fixed 60 Hz step.
- **Hidden tab:** the tab kept running and playing sound when hidden. It now pauses.
- **Key listeners:** listeners were re-added on every restart, so after three restarts each key press fired several times. They are now bound once.
- **Scrolling:** arrow keys, space and the wheel scrolled the host page. They no longer do.
- **Console:** a `console.log` ran every frame. I removed it.
- **Touch and scaling:** there were no touch controls and no viewport tag. I added both, and the canvas now scales at 16:9 (the touch layout is below).

**Would have been rejected on review**
- **SDK lifecycle:** none of the Poki lifecycle calls existed. Now `gameLoadingFinished` fires once, `gameplayStart` fires on the player's first input, and `gameplayStop` fires on every death. Restart goes `gameplayStop`, then `commercialBreak`, then `gameplayStart`.
- **Ad breaks:** audio is muted and input is locked while a break runs, with a 60-second timeout fallback.
- **Outgoing link:** I removed the "More games" footer, because Poki doesn't allow outgoing links. The "Made by Lumen Games" text went with it.
- **Insecure URL:** the leaderboard URL used `http://`. It is now `https://`, but I only changed the scheme and didn't check that the host serves https.
- **Music autoplay:** music started before any user input. It now starts on the first input, and a blocked `play()` no longer errors.

I also added `preflight.config.json`, so the check can be re-run with `node .claude/skills/web-portal-preflight/scripts/preflight.mjs --config preflight.config.json`.

## Still open

1. **`music.wav` is 54.5 MB uncompressed.** The asset files aren't in the repo, and there's no ffmpeg here, so I couldn't touch it. Poki states no size limit but asks for small builds, and says players leave if loading takes more than 10 seconds. Compress it to OGG or MP3 (a few MB) and update the path in `src/audio.js`. This is the most likely cause of a slow-load rejection.
2. **Leaderboard:** Poki blocks external requests unless you get the host approved. Request approval under Settings, then CSP, in Poki for Developers, or remove the leaderboard. Until then the "Top" score shows "-". Poki reviews external leaderboards case by case.
3. **Poki Inspector:** run it yourself by dragging the folder in, and check the event order. I couldn't run it here.
4. **Touch layout:** it's a simple scheme that I haven't tested on a real phone. Tapping the left third moves left, the right third moves right, and the middle jumps. Test it on a low-end phone and a tablet.
5. **Before submitting:**
   - Remove any `PokiSDK.setDebug` calls if you add them.
   - Poki's web exclusivity applies: you can't publish the same game on other web portals.
   - Rewarded breaks aren't used, so nothing is needed there.

The Poki rules I checked against are a snapshot dated 2026-11-16, which is current.