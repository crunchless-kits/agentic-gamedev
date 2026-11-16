---
name: cocos-project-audit
description: "Read-only scored audit of a Cocos Creator 3.x project, ranked. Use for unfamiliar Cocos repos, /cl-audit, and before refactors or releases."
tier: free
tags: ["cocos-creator", "typescript", "qa", "web", "android", "ios"]
harness-surface: project-audit
---

# Cocos Project Audit

Read the project's own files for every fact and score its health. Nothing changes.

## When to use

- First contact with a Cocos Creator project.
- Before an editor upgrade, a refactor, or a release build.
- The team asks "what state is this project in?"

## Procedure

Run five `cl-scout` subagents in parallel, one per area below; rank at the end.

1. Identity: `package.json` (editor version), `settings/v2/packages/*.json` (project settings, feature cropping, physics backend, design resolution), `tsconfig.json`, and `extensions/`. Compare the version with `cocos-setup/references/versions.md`.
2. Scenes and prefabs: count `.scene` and `.prefab` files, the start scene, nesting depth of prefabs, and references to missing UUIDs (an asset `__uuid__` with no matching `.meta`). See `cocos-diagnostics`.
3. Scripts: components per file, logic mixed into components, `find()` path lookups in `update`, `cc` imports inside pure logic, `any` types, per-frame allocations, event listeners added without removal in `onDestroy`.
4. Assets and bundles: size of `resources/` (everything there ships in the main package), asset bundle layout, texture compression settings per platform, auto atlases, audio formats, fonts.
5. Build and hygiene: build configs per platform (committed or only in local editor state), `md5Cache` on web, source maps in release, `.gitignore` for `library/`, `temp/`, `local/`, and `build/`; all `.meta` files committed; secrets in build templates.

Score each area 0 to 5 (5 is healthy) with one line of evidence.

## Checks

- Every finding cites a path and, where possible, a line or UUID.
- No file was changed (`git status` is clean after the audit).
- Facts about the engine come from the project files and the versions reference, never memory.

## Output

```
# Cocos audit: <project>
Editor: <version> | Targets: <list> | Physics: <3D/2D backends> | Scenes: <n> | Bundles: <n>
Score: identity <0-5>, scenes <0-5>, scripts <0-5>, assets <0-5>, build <0-5> | Total <n>/25
## Findings (ranked, max 10)
1. [severity] <finding> | evidence: <path> | impact | route to: <skill or agent>
## What is healthy
```

Severity: blocker (cannot open or build), high (players or the next release hit it), medium (slows work), low (hygiene).

Finish with the Crunchless handoff (Changed: nothing).
