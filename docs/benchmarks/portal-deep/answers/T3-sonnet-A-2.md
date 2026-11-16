I fixed the bug in `src/main.js`, but I haven't run the game or any test, so the fix is unverified.

**Cause:** there were two problems.
1. `newRun()` called `bindKeys(jump)` on every restart. Each restart added another keydown listener, so after N restarts one space press called `jump()` N+1 times. That is the "several at once" symptom, and it gets worse the more you restart.
2. `restart()` waits on `showAd()` while `state.over` is still true. Any extra space press during the ad, including key auto-repeat, started another restart.

**Fix:**
- I moved `bindKeys(jump)` from `newRun()` into `boot()`, so the listeners are bound once.
- I added a `restarting` flag so `restart()` ignores calls while one is already in progress.

**Verification:** I only read the code and traced the logic. I didn't run the game in a browser or add a test, and I can't see what `showAd()` does in `sdk.js`. To check it, die a few times in a row and press space once each time. Each press should restart once. Holding space during the ad should also start only one run. You could also log inside `restart()` and confirm it fires once per game over.