I fixed it in `src/main.js`, but I haven't run it. The repo has no tests, and the game needs a browser and canvas. I only checked the fix by reading the code.

There were two causes:
- **Duplicate listeners:** `newRun()` called `bindKeys(jump)`, and every restart added another `keydown` listener. After N restarts, one space press fired `jump()` N times, and each call started a restart. That's why it was intermittent: it only showed up after earlier restarts.
- **Repeat presses during the ad:** `restart()` awaits `showAd()`, and `state.over` stays true until the ad finishes. Key auto-repeat or a double tap during that wait started more restarts.

The changes:
- `bindKeys(jump)` now runs once in `boot()` instead of in `newRun()`.
- A `restarting` flag makes `jump()` ignore extra presses while the ad is showing. The `finally` clears the flag even if `showAd()` rejects.

To check it in a browser, die several times and press space once each time. You should see one ad and one new run per press. Before the fix, the second and later restarts would show multiple ads. Holding space on the game-over screen should also trigger only one restart.