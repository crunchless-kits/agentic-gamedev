---
description: "Audit this game project with parallel scouts and route ranked findings to specialists. Use on an existing or unfamiliar game project."
model: opus
effort: medium
argument-hint: [area or path to focus on]
tier: free
tags: ["qa", "production"]
---

Audit this game project. Focus and options: $ARGUMENTS (when empty, audit the whole project).

Fan-out: haiku scouts gather facts, at most 3 in parallel; this command ranks on opus at medium. `--deep` ranks at high effort.

1. Detect the engine: run `node "${CLAUDE_PLUGIN_ROOT}/scripts/detect-engine.mjs" .` and quote its `engine` and `evidence`. It checks Unity, Godot, Roblox (Rojo or a place file), Unreal, Cocos Creator (before the generic web rule, since Cocos also has a `package.json`), and web, and names the matching audit skill in `audit`. If `all` lists more than one engine, ask which to audit. For a plain JavaScript browser game (no `package.json`), skip the `tsc` and lockfile checks and say so.
2. Open the matching audit skill: `web-game-audit`, `unity-project-audit`, `godot-project-audit`, `roblox-project-audit`, `unreal-project-audit`, or `cocos-project-audit`. If it ships `scripts/`, run them first and keep the JSON.
3. Launch the `cl-scout` subagents, one per question group from the skill's procedure (stack and build, code health, serialized or asset health, runtime basics, release signals), each with the script output and the exact checklist items it owns. Batch the question groups into at most 3 scouts in parallel (`maxParallelAgents` in the project profile or `CL_MAX_PARALLEL` overrides the cap; `--serial` runs one at a time). After each scout finishes, record its facts with `node "${CLAUDE_PLUGIN_ROOT}/scripts/checkpoint.mjs" audit <run-id> add <scout> <json>` (keyed by a run id from `checkpoint.mjs audit start`, never by date); `--resume <run-id>` skips the scouts already recorded. Scouts return facts only.
4. Rank the combined facts yourself (with `--deep`, hand them to the engine's game-developer agent with the Agent tool's `effort: high`): at most ten findings, each with severity, evidence, player or release impact, and the member that fixes it (from `cl-router`). A hidden member (`invocable: false` in `kit-index.json`) is run through the hub its `hub` field names. Label that member with its tier from `${CLAUDE_PLUGIN_ROOT}/kit-index.json` (`members`, or `upgrades` for members this edition lacks): Free, Builder, or Studio. Say whether it's installed, and if it isn't, say how to get it in one line. Don't fix anything in this pass.
5. End with the Crunchless handoff and the single highest-value next action.
