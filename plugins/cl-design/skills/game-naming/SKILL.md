---
name: game-naming
description: "Name a game, studio, or feature: brief, rubric, collision and trademark checks, handles. Use when asked for a name or to check one before registering."
tier: free
tags: ["design", "production"]
---

# Game naming

Good names are found by structure, not by scrolling a thesaurus. The skill produces a shortlist with reasons and risk notes; it never claims a name is free. Registries change by the hour, so the user runs the verification checklist in `references/verification-checklist.md` before falling in love with anything.

Fan-out: brief and shortlist by the caller; comparable and collision searches by `cl-scout` in parallel (one scout per finalist); nothing to build.

## Procedure

1. Brief first. Capture: what is being named (game, studio, feature, kit), genre and platform, audience, the one-sentence promise, the vibe in three adjectives, must-avoid associations, languages the audience speaks, and any constraint like a command prefix or a fixed suffix. Read `references/naming-categories.md`.
2. Generate in four categories, three to five per category, with a short rationale each: invented words (highest availability), compounds and blends, repurposed real words (a word taken out of its usual context), and altered spellings (used sparingly; they age badly when overdone).
3. Kill the anti-patterns before scoring: generic industry words alone, "X for Y" constructions, trendy suffixes that read as a clone, names over three syllables, names that need spelling out on a call, accidental meanings in the audience's languages, names that collide with a well-known product in the same field.
4. Score each survivor on the rubric: distinct (not confusable with a known product in games or developer tools), sayable (read it once, say it right), spellable (hear it once, type it right), meaning (carries the promise or a wink the audience gets), fit (matches the vibe), room (works as a studio and a product, not just today's project). Weight the rubric to the brief.
5. Availability as a first filter only: a scout searches the web for each finalist plus "game", "studio", "app", "tool"; records exact-name products, domains seen in results, and social handles that appear taken. Mark the result Level 1 only.
6. Shortlist of five to eight: name, category, rationale, domain strategy (exact, or a modifier such as `get`, `play`, `hq`, or a `.dev`, `.gg`, `.games` ending), trademark risk note (crowded word, famous mark nearby, clean so far), and the prefix if the brief needs one.
7. Hand over the verification checklist with the top three. The user checks registrars, the trademark databases for their markets, and social handles; the skill does not.

## Output

```
# Naming: <what>
Brief: promise | vibe | audience | constraints
Shortlist (ranked)
1. <Name> | <category> | why: <one line> | say and spell: <ok or risk> | domain: <strategy> | trademark: <note> | prefix: <xx->
...
Killed: <names and the anti-pattern that killed them>
Verify next: references/verification-checklist.md (registrar, trademark, handles)
```

Finish with the Crunchless handoff.
