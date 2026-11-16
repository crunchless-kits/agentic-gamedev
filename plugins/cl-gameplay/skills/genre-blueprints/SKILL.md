---
name: genre-blueprints
description: "Starting blueprints per genre (platformer, roguelike, RPG, tower defense, idle, and more). Use when starting a genre game or when an expected system is missing."
tier: free
tags: ["gameplay", "design"]
---

# Genre blueprints

A genre is a set of expectations. The blueprint lists the systems players assume, the loop shape, the numbers that decide feel, and the mistakes that sink first attempts, then routes to the kit skills that build each piece.

Run profile: router.

## Procedure

1. Pick the genre (or the closest two for a hybrid) and read its page in `references/genres.md`.
2. Map the expected systems to the project: which exist, which are missing, which the design deliberately drops (say why).
3. Write the loop sentence and confirm it with `core-loop-design`; copy the numbers that matter into the project's typed config as named tunables.
4. Check the failure points against the current design and prototype; route fixes.
5. Produce the build order with the kit skills to run (`design-blueprint`, `gdd-author`, the gameplay skills, the engine playbooks).

## Output

```
# Genre blueprint: <genre or hybrid>
Expected systems: <system -> present | missing | dropped (why)>
Loop: <sentence>
Numbers that matter: name | default | range
Failure points checked: <item -> status>
Build order: <skills in order>
```

Finish with the Crunchless handoff.
