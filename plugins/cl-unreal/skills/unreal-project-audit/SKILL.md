---
name: unreal-project-audit
description: "Read-only scored audit of an Unreal project, ranked. Use for unfamiliar Unreal repos, /cl-audit, and before refactors, ports, upgrades, or releases."
tier: free
tags: ["unreal", "qa", "windows", "macos", "linux", "android", "ios"]
---

# Unreal Project Audit

Read the project's own files for every fact. The audit changes nothing; it produces evidence, a score, and routes.

Script: `python3 scripts/unreal_facts.py <root>` prints the engine version, modules, enabled plugins, default maps, targets, Build.cs files, asset counts and sizes, render settings hints, and gitignore and LFS coverage as JSON. Run it first.

## When to use

- Opening an Unreal repo for the first time.
- Before an engine upgrade, a port, or a release.
- When builds are slow, packaging fails, or the team cannot say what is in the project.

## Procedure

1. **Identity.** From the script: engine version, C++ or Blueprint-only, modules, targets, and enabled plugins. Flag experimental or beta plugins in shipping code and plugins enabled but unused.
2. **Config.** `Config/Default*.ini`: default maps, game instance, rendering (Lumen, Nanite, virtual shadow maps), input classes (Enhanced Input expected on UE5), packaging (`MapsToCook`, pak and IoStore settings), and per-platform overrides under `Config/<Platform>/`.
3. **Code health.** For each module: public and private folders, `Build.cs` dependencies (flag modules that depend on everything), tick-heavy actors (`PrimaryActorTick.bCanEverTick = true` with an empty `Tick`), `GetAllActorsOfClass` or `FindObject` in hot paths, raw pointers to `UObject` without `UPROPERTY` or `TObjectPtr` (garbage collection hazard), and compile warnings from a fresh build.
4. **Blueprint health.** Count Blueprints by type. Flag Blueprints with heavy Event Tick graphs, casts chained across many classes, and circular Blueprint references. Use the Reference Viewer or the MCP server where available; never parse `.uasset` as text.
5. **Assets.** Content size and counts from the script, redirectors left after moves (run Fix Up Redirectors only with permission), oversized textures, and unused assets from the Size Map and Reference Viewer.
6. **Maps.** Default and startup maps, World Partition or classic levels, and whether each map in `MapsToCook` opens without errors.
7. **Build and packaging.** Target platforms, Shipping config present, last successful package (logs in `Saved/Logs`, CI history), and whether a BuildCookRun command is documented.
8. **Hygiene.** `.gitignore` coverage, Git LFS or Perforce for binaries, file locking for `.uasset` and `.umap`, and no `Saved/` or `Intermediate/` in history.
9. **Score.** Each of 8 areas (identity, config, code, Blueprints, assets, maps, build, hygiene) gets 0 to 5 with one line of evidence. Total out of 40.

## Checks

- Every finding cites a path, ini key, count, or log line.
- Nothing was modified: `git status` is clean after the audit.
- Severity matches impact: blocker means the project cannot build, open, or package.

## Output

```
# Unreal audit: <project>
Engine: <version> | Type: <C++/Blueprint-only> | Modules: <n> | Plugins: <n enabled, flagged list>
Score: <total>/40 (identity <n>, config <n>, code <n>, blueprints <n>, assets <n>, maps <n>, build <n>, hygiene <n>)

## Findings (ranked)
1. [severity] <finding>
   Evidence: <path:line, ini key, or count>
   Impact: <player, build, or team impact>
   Route to: <unreal-* skill or agent>

## What is healthy
- <with evidence>
```

Severity: blocker, high, medium, low. Finish with the Crunchless handoff (Changed: nothing, audit only; Evidence; Verify; Open; Next).
