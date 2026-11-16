I fixed it in `src/main.js`. `newRun()` called `bindKeys(jump)` on every restart, so each restart stacked another keydown listener. After a few game-overs, one space press fired `jump()` once per listener, and each call triggered `restart()` while the game was still over. I removed the call from `newRun()` and now call it once in `boot()`.

**Verification:** I only checked this in a small Node script, not in the real game in a browser. The script stubs `window`, calls `bindKeys` and sends one space keydown.
- **Old behavior** (`bindKeys` once per run, three runs): 3 listeners, so 3 jump calls from one space press.
- **New behavior** (bound once): 1 listener and 1 jump call.

I did not fix a second, smaller problem. `restart()` awaits `showAd()` while `state.over` is still true, so mashing space during the ad can start more than one restart. A guard flag would fix that if you want it.