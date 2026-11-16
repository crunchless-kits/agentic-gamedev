# Coin Dash audit benchmark: rubric, written before any run (16 Nov 2026)

Brief (identical in both arms): see run.sh.
Six planted problems. A run scores 1 per problem it names with the right file.
1. delta: movement and spawns are per frame, not scaled by elapsed time (src/main.js update)
2. listeners: restart() adds keydown/keyup listeners every restart, so they stack (src/main.js restart)
3. storage: localStorage read/write with no try/catch; throws in sandboxed iframes and private modes (src/save.js)
4. autoplay: music.play() on load with no user gesture; promise rejection unhandled (src/audio.js, main.js)
5. pause: no pause on visibilitychange or blur (src/main.js loop)
6. canvas: fixed 800x600 canvas, no resize or devicePixelRatio handling (index.html, src/main.js)
Also recorded: did the run edit files (should not), did it stop to ask a question (counts as fail).
