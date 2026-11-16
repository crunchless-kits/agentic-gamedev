I fixed it in `src/main.js`, but I haven't run the game or any test. I only read the code, so the fix is untested.

**Cause:** There were two problems.
1. `newRun()` called `bindKeys(jump)` every time a run started. Each restart added another keydown listener, so one space press called `jump()` (and so `restart()`) once per listener. The count grew with every game over.
2. `restart()` awaits `showAd()` while `state.over` is still true. Extra presses or key-repeat during the ad started more restarts.

**Change:**
- `bindKeys(jump)` now runs once in `boot()` instead of in `newRun()`.
- `restart()` has a `restarting` flag so it ignores calls while one is already in progress.

**Verification:** From reading the code, `bindKeys` is the only thing that registers the key listeners, and it now runs only in `boot()`. That leaves one listener per key event, and the flag covers presses during the ad.

To check it in a browser, die a few times and press space once each time. The run should restart once, and the `frame` console log shouldn't show doubled updates. I can set up a headless test to confirm it if you want.