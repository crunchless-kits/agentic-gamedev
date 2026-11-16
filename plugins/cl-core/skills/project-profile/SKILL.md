---
name: project-profile
description: "Create or update the project profile every skill reads first: engine, audience, devices, test gate. Use at project start or when skills repeat questions."
tier: free
tags: ["production", "docs"]
---

# Project profile

One file holds what every skill would otherwise ask again: `docs/crunchless.profile.json`. One file holds how the studio writes: `docs/house-rules.md`. One folder holds what the kit has learned about the studio: `.cl/house/` (or the profile's `houseDir`), written by `learn`. Skills read the profile and house rules when present, then `<houseDir>/INDEX.md` and only the house files their task needs, and fall back to asking one question at a time when they are missing.

Run profile: router.

## Procedure

1. Detect from files: engine and version, platforms and orientation (manifests, player settings, export presets), session length and audience from the design docs if any, reference devices from past audits, output folders in use.
2. Copy `references/profile.example.json` to `docs/crunchless.profile.json` and fill what was detected; mark the rest `null`. Ask for the remaining fields one at a time, only the ones a skill will need soon (audience and reference device first).
3. Copy `references/house-rules.example.md` to `docs/house-rules.md`; keep the defaults the user agrees with, delete the rest, add the studio's banned words. The file is taste, not law; every rule the studio drops is dropped for every skill at once.
4. Record the operating context (`solo-bootstrapped`, `small-funded-team`, `publisher-backed`); it changes what `opportunity-review` and the studio skills treat as a good idea.
5. Point `qualityFloor` at `docs/QUALITY-FLOOR.md` once `ship-readiness` has created it.
6. Set `houseDir` (default `.cl/house/`; a shared folder lets every project use one studio house) and offer `/cl-learn` when the studio has a brand kit, style guide, linters, or past retros. Precedence: the user's message, then `docs/house-rules.md`, then the learned house, then kit defaults.

## Output

Finish with the Crunchless handoff listing both file paths and the house folder, the fields detected versus asked, and the fields still null.
