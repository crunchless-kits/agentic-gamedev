---
description: "One documented ship or no-ship decision from gate evidence gathered in parallel. Use before any release or store or portal submission."
model: opus
effort: medium
argument-hint: [target, e.g. web, poki, crazygames, playable-ad, store]
tier: free
tags: ["release", "qa"]
---

Run the release gate. Target and options: $ARGUMENTS (when the target is empty, ask which target before starting; a web build and a portal submission have different gates). If `ship-readiness` is installed, follow it through `release-hub` (it is hidden from the Skill tool; a vendored install can Read `.claude/skills/ship-readiness/SKILL.md`); otherwise run `ship-check-lite` and say so, naming what the full gate in Builder would add.

Fan-out: gate evidence by `cl-scout` subagents, at most 3 in parallel; this command decides on opus at medium. `--deep` decides at high effort through `qa-release-engineer` with the Agent tool's `effort: high`.

1. Identify the release candidate (build path, version or commit, build date, variant). No artifact means stop: readiness is checked on an artifact, not on source.
2. If the target is a portal or ad network, read the matching integration skill's reference snapshot and verify current requirements from the official docs; add any target-specific gates.
3. Launch the scouts, one per gate group (gameplay and input, saves, performance, packaging, policy and metadata). Batch the five gate groups into at most 3 scouts in parallel (`maxParallelAgents` or `CL_MAX_PARALLEL` overrides the cap; `--serial` runs one at a time). After each scout finishes, record its facts with `node "${CLAUDE_PLUGIN_ROOT}/scripts/checkpoint.mjs" ship <run-id> add <scout> <json>` (keyed by a run id, never by date); `--resume <run-id>` skips the scouts already recorded.
4. Decide: SHIP, SHIP WITH KNOWN ISSUES (each accepted by the user in writing), or NO-SHIP (blockers ranked). Never upgrade unverified to pass.
5. Write `releases/<version>-<target>.md` and end with the Crunchless handoff.
