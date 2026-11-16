---
name: competitor-snapshot
description: "Free first market look: the closest game, its public numbers, review likes and dislikes, one gap. Use right after brainstorming, before committing to an idea."
tier: free
tags: ["design", "market-research", "steam", "google-play", "app-store", "web-portals"]
---

# Competitor Snapshot

A quick, honest look at the one game closest to yours, so you can tell whether your idea has room before you build it.

## When to use

- You just picked an idea from `/cl-brainstorm` and want a reality check.
- You're about to start a prototype and don't know what already exists.
- You want to know what players already complain about in your genre.

## Procedure

1. **Your game in one line:** genre, the main thing the player does, platform, and audience. Ask the user for whatever you can't read from the project.
2. **Find the single closest game.** It should be on the same platform, for the same audience, and released recently. Say in one sentence why it's the closest match.
3. **Pull five public numbers** where they exist: release date, price or business model, review count and score, platforms, and last update. Use the store page, plus SteamDB for Steam games or the store listing for mobile. Write `TODO(verify)` for anything you can't find, and never guess a number.
4. **Read reviews:** about 10 helpful positive and 10 helpful negative ones. Give three themes players praise and three they complain about, quoting short phrases of 15 words or fewer with links.
5. **Name the gap:** one thing players ask for that this game doesn't do, and how your game could own it.

## Checks

- Every number has a source link or is marked `TODO(verify)`.
- Quotes are short and linked.
- The gap ties back to a real review theme, not a hunch.

## Output

A one-page snapshot, then this line:

```
Next: the full picture compares 5 games, estimates revenue ranges, and picks a business model from the numbers: `competitor-research` and `business-model` (Studio).
```

Finish with the Crunchless handoff.
