---
name: scope-guard
description: "Seed a repo with guardrails against agent over-building: scope line, line budget, hooks. Use at the start of any agent coding task."
tier: free
tags: ["production", "qa"]
---

# Scope guard

Five observed failures, one seed. A small check that grew tenfold, a hello-world repo that gained ten review findings, a "fix the findings" run that added CI, Docker, and a contributor guide, comment bloat, and a review loop with no exit. The guard puts a scope line, a budget, and a few denials in front of the agent, and the two seeded skills give the review a calibrated shape.

Run profile: router.

Scripts: `node scripts/seed.mjs --project <repo> --scope "<one sentence>" [--budget 300] [--ci] [--local-only] [--dry-run]`. `node tests/hook.test.mjs` runs 35 cases against temp repos, one per engine layout.

## What the seed writes

1. `CLAUDE.md`: one block between `crunchless:scope-guard` markers with the scope line, the budget, the comment rule, the review rules, and the loop exit. Everything else in the file is left alone.
2. `.claude/skills/scope-check/SKILL.md` and `.claude/skills/calibrated-review/SKILL.md`, so repos that do not install the kit still have them.
3. `.claude/hooks/scope-guard.mjs` and `.claude/scope-guard.json` (budget plus optional overrides for allowed folders, denied files, manifests, install commands, and budget exclusions). A new config records the detected engine and seeds `allowNew` from its layout:
   - Unreal: `Source/**`, `Config/**`, `Content/**`, and `Plugins/**`.
   - Roblox: `src/**`. Cocos: `assets/**` and `extensions/**`.
   - Godot: the whole project except `.godot/`, so feature folders such as `player/` work.
   - Unity and web: the generic list in the hook (`src`, `lib`, `game`, `Assets`, `scenes`, `scripts`, `tests`, `docs`, `levels`, `assets`).
   - CI files stay denied unless the config has `"ci": true` (or the seeder ran with `--ci`), which allows new files in `.github/workflows/` and `.gitlab-ci.yml`. The `cl-ci` skills need that key before they can write a workflow: when the user asks for CI, add `"ci": true` to `.claude/scope-guard.json`.
4. `.claude/settings.json`: hook registrations merged, never overwritten: SessionStart (records the baseline commit under `.git/scope-guard/<session>`), PreToolUse on Write, Edit, MultiEdit (new-file and manifest guards) and on Bash, PowerShell (install-command guard), Stop (changed lines versus budget; a second Stop is always allowed so nothing deadlocks).
5. `--local-only`: the same files, plus `CLAUDE.md`, `.claude/`, and `AI_USAGE.md` added to `.git/info/exclude`, for studios whose game repos track no agent files.

## Procedure

1. Agree the scope line with the user in one sentence and the budget (default 300 changed lines, unmeasured; the config file says so).
2. Run the seeder; show the file list; re-run to prove it is byte-identical.
3. Tell the user how it fails: a denied write or command shows a message naming the rule and the config key; a blocked Stop names the largest files and points at `/scope-check`.
4. For a repo with an existing `CLAUDE.md` scope section or a spec file that owns scope, point the scope line at it rather than duplicating.

## Known gaps (carry these into any product page)

- Shell edits (`echo > file`, `sed -i`) slip past the write guard; only the Stop budget sees them.
- The guard binds Claude Code hooks only; other agents read none of it.
- Measured on synthetic repos: the mechanism works; the effect size on real projects is unmeasured, and so is the 300-line budget.
- Tool names in the matcher (`MultiEdit`) follow the Claude Code version in use; confirm against the installed version.
- The hook fails open on any internal error, which is safe and silent; check `.git/scope-guard/` exists after the first session.

## Output

Finish with the Crunchless handoff listing the scope line, budget, files written, and whether local-only was used.
