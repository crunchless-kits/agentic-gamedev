---
description: "Check the first-run environment: Node, Claude Code, hooks, kit version, description load, engine. Use after install or when the kit misbehaves."
model: haiku
effort: low
argument-hint: [project root]
tier: free
tags: ["production", "docs"]
---

Run the doctor for: $ARGUMENTS (default: the current project).

Run profile: router. No subagents; one script, then read its JSON.

1. Run `node "${CLAUDE_PLUGIN_ROOT}/scripts/doctor.mjs" <root>` and read the JSON.
2. Report, in order: anything that blocks a first run (Node under 22, an override variable set, duplicate hook registrations, no engine detected), then warnings, then the facts (versions, vendored kit version, detected engine, tracked agent files).
   - Description load: compare `descriptionLoad.skillsAndCommands.characters` with `budgetCharacters`. Say the budget is an estimate (about 1% of a 200K-token context window, roughly 8,000 characters). When `overBudget` is true, warn that Claude Code will cut the descriptions of the least-used skills, so routing gets worse, and name the plugins to drop: keep one engine bundle and add others only when needed.
3. For each blocker, give the one command that fixes it.
4. If `forkAndPaths` matters to the user, name the two tests from the README and offer to run them.
