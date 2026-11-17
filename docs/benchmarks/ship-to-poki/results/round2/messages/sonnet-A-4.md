I've fixed the code problems that would break Skyhop on Poki. I only syntax-checked `src/main.js` with `node --check`. I haven't run the game or tested it in the Poki previewer. I haven't committed anything.

**What I changed**
- **Footer link:** I removed the external "More games" link from `index.html`. The footer now just says "Skyhop". Poki doesn't allow outbound links or cross-promotion.
- **Leaderboard:** It called an `http://` URL on a separate host. On an https portal the browser blocks that, the fetch threw, and `boot()` died, so the game never started. The leaderboard URL is now empty, so `fetchTopScores` returns an empty list. A failed fetch is now caught, and it no longer holds up startup.
- **Poki SDK calls (`src/sdk.js`):**
  - The wrapper now survives the SDK being blocked or failing (ad blockers). Before, `init()` rejecting would stop the game from starting.
  - I added the calls Poki expects: `gameLoadingFinished` once the game is ready, `gameplayStart` when a run begins, and `gameplayStop` on game over.
  - Ads now pause the game and mute the sound while they play, then resume.
- **Restart bug:** `bindKeys` ran on every new run, so key listeners piled up and each jump fired more than once. I now bind once at boot. I also guarded restart so mashing space can't start several ads or runs at once.
- **Sound:** `play()` promises that the browser rejects (autoplay policy) are now caught. Music retries on the first click if autoplay is blocked.
- **Keys:** Space and the arrow keys no longer scroll the portal page. Held keys reset when the window loses focus. WASD works with Caps Lock.
- **Save:** `localStorage` access is wrapped in try/catch, so blocked storage in an iframe no longer crashes the game. Old saves still load.
- **Console:** I removed the `console.log` that ran every frame.

**Still open**
- **Music size:** `assets/music.wav` is 54.5 MB uncompressed. That will very likely blow Poki's size and load-time limits. The file isn't in the repo, only listed in `assets/manifest.json`, so I couldn't convert it. Re-encode it to OGG/MP3 at roughly 1–2 MB (`jump.wav` and `gem.wav` could be compressed too), then update the paths in `audio.js` and the manifest.
- **Leaderboard:** The "Top" score in the HUD is now always "-". If you want a leaderboard, it has to go through Poki's tools or an https host that Poki allows.
- **Local testing:** Test locally with Poki's previewer, at `https://poki.com/en/upload`. I couldn't check there that the SDK events fire as Poki expects.
- **Other submission requirements:**
  - The canvas is a fixed 960×540. Poki wants the game to scale to the iframe, so you'll probably need responsive scaling.
  - The game has no mute button.
  - There's no touch or mobile input.
  - The art is placeholder rectangles, and there's no thumbnail or icon set. `assets/sprites.png` is listed but never used.
- **Line endings:** Git warns that `package.json`, `README.md` and the other files will be rewritten from LF to CRLF. That's a line-ending setting on your machine, not something I changed on purpose.