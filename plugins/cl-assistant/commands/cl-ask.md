---
description: "Ask the Crunchless guide about the kit: install, tiers, which member fits, troubleshooting. Use for any question about Crunchless itself."
model: haiku
effort: low
argument-hint: <your question>
tier: free
tags: ["docs", "production"]
---

Answer this question about the kit through the `cl-guide` agent: $ARGUMENTS (when empty, ask what the user wants to do, in one line, and offer the three most common starting points: install for this project, find the right member for a task, run the kit outside Claude Code).

Run profile: router. `cl-guide` (haiku, low) answers, read-only.

1. Have `cl-guide` read `${CLAUDE_PLUGIN_ROOT}/kit-index.json` (every member with its tier, the bundles, and, in an edition, the `upgrades` it lacks), the installed members, and the `kit-guide` skill (`${CLAUDE_PLUGIN_ROOT}/skills/kit-guide/SKILL.md`) with its references under `${CLAUDE_PLUGIN_ROOT}/skills/kit-guide/references/`. Pass it these paths as written here, already resolved.
2. Return the answer in the guide's format: answer, the command or path, the reference.
3. If the question is a task in disguise, hand off to the member named instead of answering at length.
