# Usage paths

Pick by where the work happens. The kit's members are files, so they travel.

## Claude Code on your machine (plugins)
- Install the marketplace and the plugins a project needs; hooks (guard, scope guard) are active; scripts run locally.
- Leave session effort alone: commands, agents, and forked skills pin their own model and effort. Add `--deep` to `/cl-audit`, `/cl-review`, or `/cl-ship` for high effort. Leave `CLAUDE_CODE_SUBAGENT_MODEL` unset.
- Best for: everything that touches code, builds, and devices.

## Vendored into the repo (cloud sessions, CI, teammates)
- `node scripts/install.mjs --project <repo> --bundle <name>`; commit `.claude/` and `CLAUDE.md`.
- Every session, agent, or teammate gets the same members; the kit's guard hook needs one settings entry (README snippet); `scope-guard`'s seeder writes its own.
- Best for: teams, Claude Code web or cloud sessions, CI runners.

## Claude Projects (claude.ai), no repo
- Create a Project for the game or studio. Add as project knowledge: `README.md`, `registry.json`, the `kit-guide` references, and the skill files you will use from `cl-design`, `cl-gameplay`, and `cl-studio` (they are Markdown).
- Paste `project-instructions.md` into the Project's instructions. Keep decisions in the Project's memory setting or in a decisions file you upload.
- What works there: brainstorm, blueprint, GDDs, mechanic critique, design audit, balance experiments, naming, genre blueprints, opportunity review, slice specs, milestones, risks, release calendar, pitch package, retro, collaborator briefs, cold reads of text you paste.
- What does not: anything that needs a file system, scripts, hooks, or a build (audits with scripts, scope guard, ship gates on artifacts, portal adapters). Hand those to Claude Code with the same profile.
- Check the current Project features and limits in the official documentation; they change.

## Cowork (desktop knowledge work)
- Load the design, studio, and content skills as skills; use it for GDDs, decks (pitch package), spreadsheets (economy models), and documents, with the house rules and slop check.
- Scripts and hooks follow Cowork's own capabilities; confirm in its documentation before relying on them.

## CI
- `cl-ci` writes the workflows for web, Unity, and Godot; the kit's own repo runs `kit-check` (registry, smoke, snapshot age) and `snapshot-refresh` (monthly pull request).
- The scripts (`ts_health`, `size_report`, `check_playable`, `unity_facts`, `guid_index`, `asset_catalog`, `slop_scan`, scope-guard tests) run in CI without any model.

## Teams and tiers
- Free core public and MIT; Builder and Studio private under a commercial license, per studio.
- One project profile and one house-rules file per repo keep every member aligned; `scope-guard --local-only` for repos that track no agent files.
