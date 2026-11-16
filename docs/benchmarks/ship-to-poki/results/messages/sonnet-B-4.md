Skyhop is changed to meet Poki's published requirements, but I haven't run it. I only syntax-checked the JS, and there's no browser here, so the Poki Inspector run is still to do. I haven't committed anything.

I checked the changes against the live Poki docs, which have moved to developers.poki.com. The 2026-11-06 reference snapshot in the kit is otherwise still accurate.

## What I changed

**Would have broken the game on Poki:**
- **Leaderboard fetch:** `src/net.js` called an external `http://` URL. Poki blocks external requests, and `boot()` awaited the fetch, so a failure meant the game never started. I deleted `net.js`, removed the call and removed the "Top" score from the HUD.
- **Missing or blocked SDK:** `src/sdk.js` assumed `PokiSDK` always existed, so an ad blocker would crash the game on startup. The SDK adapter is now safe when the SDK is missing or init fails, and the game runs without ads.
- **Duplicate key listeners:** `bindKeys` was called on every restart, so each restart stacked more listeners and eventually triggered several ads per death. It's now bound once. A guard also stops an ad break from starting twice.
- **Double game-over:** `gameOver()` could run twice in one frame, for example storm plus fall, and double-count gems. It now runs once.
- **Save and audio errors:** `localStorage` access and `JSON.parse` are wrapped so a blocked or corrupt save can't crash the game. Audio `play()` rejections are now caught.

**Would have been rejected:**
- **Lifecycle signals:** I added `gameLoadingFinished`, `gameplayStart` and `gameplayStop`, with the documented order of stop, commercial break, start on death and restart. A guard stops start or stop firing twice in a row.
- **Ad breaks:** input and simulation are disabled and audio is muted during a break, and resume afterwards.
- **External link:** I removed the footer "More games" link to lumengames.example.com. Poki forbids external links except through `PokiSDK.openExternalLink`, and also bans branding. The adapter has an `openExternalLink` wrapper if you want a link back.
- **Page scrolling:** arrows, space and the mouse wheel no longer scroll the portal page.
- **Debug output:** I removed the `console.log` that fired every frame.
- **Layout:** the canvas now scales proportionally in 16:9 to fill the frame, and I added a viewport meta tag.
- **Music start:** music now starts on the first key press instead of at load, because browsers block autoplay before a user gesture.

## Still open

1. **Music file size:** `assets/music.wav` is listed at about 52 MB uncompressed. Poki says players leave if loading takes over 10 seconds, and the docs give no hard size limit. It needs converting to OGG or MP3, which would cut it to a few MB. The audio and sprite files aren't in the repo and I have no ffmpeg, so I couldn't do this. The `.wav` paths in `audio.js` will need updating too.
2. **Missing asset files:** `jump.wav`, `gem.wav` and `sprites.png` are listed in the manifest but aren't in the repo. Check that they're in the build you upload.
3. **Mobile:** Poki expects mobile and tablet support, and the game is keyboard-only. It needs touch controls, which means choosing a control scheme, so I left it for you.
4. **Poki Inspector:** run the build at inspector.poki.dev. Confirm the event order, the "no external requests" warning, and the load time and size it reports.
5. **Not verified:** I didn't read Poki's external-resources policy or easy-access (progressive loading) pages. I also added no timeout on ad breaks, so a break that never resolves would hold the game, though a rejected one is handled.
6. **Privacy and consent:** I haven't addressed this. Poki requires a privacy policy only when the game links externally, which it no longer does. If you're collecting any player data, review it with a lawyer.
7. **Housekeeping:** the README still says the Poki script tag is already in `index.html`. It's accurate, just not updated.