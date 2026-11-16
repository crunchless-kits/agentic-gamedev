I fixed the bug in `src/main.js`, but I haven't run the game or any test, so the fix is unverified. I only read the code.

**Causes** (both in `src/main.js`):
1. `newRun()` called `bindKeys(jump)`, so every restart added another `keydown` listener. After N restarts, one space press called `jump()` N times. Each call saw `state.over` and called `restart()`, which is why the restarts came in bursts and got worse over time.
2. `restart()` awaits `showAd()` while `state.over` is still true. A held or repeated space press during the ad started more restarts.

**Changes:**
- I moved `bindKeys(jump)` out of `newRun()` and into `boot()`, so the listeners are registered once.
- I added a `restarting` guard to `restart()` so a second restart can't start while the ad is showing.

**How to verify:**
- Die and restart three or four times, then press space once at game over. It should restart once. Before the fix, `showAd` fired once per accumulated listener.
- Hold space during the ad. It should give a single restart.
- To confirm either one, add a `console.log` in `restart()` and count the calls per press.