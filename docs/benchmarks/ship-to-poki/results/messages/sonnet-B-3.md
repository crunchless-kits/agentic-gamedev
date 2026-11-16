I fixed the code problems that would get Skyhop rejected or break it on Poki. The 52 MB soundtrack is still open, and I haven't run the game or the Poki Inspector. All I checked was that every JS file parses. Nothing is committed.

## What I changed
- **Poki lifecycle events** (`src/sdk.js`, `src/main.js`): the game never called `gameLoadingFinished`, `gameplayStart` or `gameplayStop`. It now calls `gameLoadingFinished` once at boot and `gameplayStart` on the first input. `gameplayStop` fires on death. The flow is stop, `commercialBreak`, start. I used the method names from the repo's Poki notes (dated 2026-11-06), not the live docs.
- **Ad breaks** (`src/main.js`, `src/audio.js`, `src/input.js`): the ad used to play with the game still running and the sound on. Pressing space during an ad stacked more breaks, and each restart added another set of key listeners. Audio is now muted and input disabled only when an ad actually shows. A guard stops duplicate breaks, and input is bound once.
- **Missing or blocked SDK** (`src/sdk.js`): if the Poki script was blocked or `init()` rejected, the game never started. Every SDK call is now safe and falls back to doing nothing.
- **Leaderboard** (`src/net.js`): it fetched from a plain `http://` URL, which is blocked as mixed content, and a failure stopped boot. Poki also restricts external requests. It now returns an empty list, and the "Top" score shows "-".
- **Footer** (`index.html`): I removed the "More games" link to lumengames.example.com, because Poki doesn't allow external links.
- **Audio autoplay** (`src/audio.js`): music started before any user input and threw an unhandled error. It now starts on the first input, and play errors are caught.
- **Save data** (`src/save.js`): `localStorage` can throw inside the portal iframe, so reads and writes are wrapped and fall back to a fresh save.
- **Input and mobile** (`src/input.js`, `index.html`, `style.css`): the per-frame `console.log` is gone. Arrow keys and space no longer scroll the page, and WASD works with Caps Lock. I added touch controls (left third moves left, right third moves right, middle jumps), a viewport meta tag, and a canvas that scales to the frame.
- **README**: I replaced the "we plan to submit" line with the Poki build notes.

## Still open
1. **Soundtrack size:** `assets/music.wav` is 54.5 MB uncompressed (the manifest says so), and the other assets are about 0.5 MB. That is almost certainly too big for Poki's loading-time rules. The file isn't in the repo, so I couldn't convert it. Compress it to OGG or MP3 at roughly 1–2 MB and update the path in `src/audio.js`. Also convert `jump.wav` and `gem.wav`.
2. **Poki Inspector:** run the build through it and check the event order: load finished, start, stop, break, start. I didn't run it.
3. **Live Poki docs:** I used the repo's notes and didn't re-fetch the docs. Check the current submission rules for size, loading time and mobile support.
4. **Debug call:** there is no `PokiSDK.setDebug(true)` in the code, so nothing to remove there.
5. **Touch and scaling:** I haven't tested these on a real phone. The game also has no pause when the tab loses focus (only keys are released), and no rewarded-ad flow, which you may not need.
6. **Leaderboard:** it's disabled, not replaced. If you want one, it needs an `https` backend that Poki permits, or Poki's own features.