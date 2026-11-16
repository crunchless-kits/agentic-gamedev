---
description: "Constraint-first brainstorm returning ranked, mechanically distinct options. Use for a new game idea, a jam, or a stalled prototype."
model: sonnet
effort: high
argument-hint: [constraints or the problem to solve]
tier: free
tags: ["design", "gameplay"]
---

Run the `game-brainstorm` skill. Input: $ARGUMENTS (when empty, ask for platform, audience, session length, and whether a game exists yet, in one short question).

Fan-out: comparable-title lookups by one `cl-scout` if references are needed.

1. Capture constraints and the one-sentence loop if any.
2. Pick concept mode (five directions) or mechanic mode (three approaches) from the input.
3. Produce the ranked options table from the skill, with a recommendation and a switch condition.
4. Save to `design/brainstorm/<date>.md` and end with the Crunchless handoff.
