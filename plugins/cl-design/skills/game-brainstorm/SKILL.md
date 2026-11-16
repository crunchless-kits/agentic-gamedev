---
name: game-brainstorm
description: "Constraint-first ideation: ranked, mechanically distinct concepts with risks. Use for a new game, a stalled prototype, a jam, or when asked for options."
tier: free
tags: ["design"]
---

# Game brainstorm

Options before answers. A brainstorm that returns one idea is a pitch; this skill returns several that differ in mechanics, not in theme, so the team can mix and choose.

Run profile: router.

## Procedure

1. Constraints first. Capture: platform and input, audience, target session length, business model boundaries, team strengths, engine, and the deadline. Write the one-sentence loop if one exists ("the player <verb> to <goal> before <pressure>"); if it cannot be written in one sentence, the brainstorm starts there.
2. Choose the mode: concept brainstorm (no game yet: produce five directions) or mechanic brainstorm (a specific problem: produce three mechanically distinct approaches, for example high-risk high-reward versus steady accumulation versus timing-based).
3. Generate with lenses, then cut: verb-first (what the hands do every few seconds), fantasy (what the player gets to be), mechanics to dynamics to feelings (what rules produce which moments), player motivation (mastery, choice, connection, discovery), and the pressure source (time, resources, risk, information).
4. For each option: name, one-sentence loop, core verb, fantasy, the moment that sells it, what makes it different from the two closest comparables (name them), biggest risk, cheapest prototype to test it, and a fit score against the constraints (1 to 5 per constraint).
5. Rank by fit and by prototype cost; recommend one to prototype first and say what result would make you switch.
6. Hand the chosen direction to `core-loop-design` and `design-blueprint`; park the others in `design/brainstorm/<date>.md`.

## Output

```
# Brainstorm: <mode>, <date>
Constraints: <list>
Options (ranked)
1. <name> | loop: <sentence> | verb: | fantasy: | sells on: | differs from <A>, <B> by: | risk: | prototype: <what, days> | fit: <n>/<max>
...
Recommendation: <option>, switch if: <observation>
Parked: <path>
```

Finish with the Crunchless handoff.
