---
name: unity-project-audit
description: "Read-only ranked audit of a Unity project. Use for unfamiliar Unity repos, /cl-audit, and before refactors, ports, or releases."
tier: free
tags: ["unity", "qa"]
---

# Unity project audit

Read the project's own files for every fact. The audit changes nothing; it produces evidence and routes.

Fan-out: run `scripts/unity_facts.py` first; five `cl-scout` subagents in parallel (identity and packages, scenes and structure, code health, serialized health, build and hygiene); ranking by the caller.

Scripts: `python3 scripts/unity_facts.py <root>` prints editor version, serialization mode, render pipeline, scripting backends, scenes in build, package flags, assembly graph with cycles, code smells in Update methods, WebGL settings, and gitignore coverage as JSON. Run it first; it replaces steps 1, 2, 3, and most of 4, 5, and 8.

## Procedure

1. Identity. `ProjectSettings/ProjectVersion.txt` for the editor version. `ProjectSettings/GraphicsSettings.asset` for the render pipeline asset (none means Built-in). `ProjectSettings/EditorSettings.asset` for serialization mode (Force Text expected for team work) and version control mode. `ProjectSettings/ProjectSettings.asset` for company and product name, scripting backend per platform, API compatibility level, and the active build target hints.
2. Packages. `Packages/manifest.json` and `Packages/packages-lock.json`: list dependencies with versions; flag git or local packages without a pinned revision, preview or deprecated packages, and render-pipeline or input packages that do not match the settings above (see `unity-package-audit` for depth).
3. Scenes and flow. `ProjectSettings/EditorBuildSettings.asset` for scenes in the build and their order; find the bootstrap scene; note disabled scenes and scenes outside `Assets`.
4. Structure. Folder layout under `Assets`, assembly definitions (count, references, cycles), Editor folders, `Resources` and `StreamingAssets` usage, Addressables presence, third-party packages vendored into `Assets`, large binaries committed (textures, audio, video) and whether Git LFS is set up.
5. Code health. Count scripts, flag `FindObjectOfType` and `GetComponent` in `Update`, string-based `SendMessage` and `Invoke`, static mutable state, `Resources.Load` in hot paths, empty `Update` methods, and compile warnings from a fresh compile if an Editor is available.
6. Serialized health. Missing script references and missing prefab references (grep Force Text YAML for `m_Script: {fileID: 0}` and `guid: 0000000000000000`), orphaned assets, duplicate GUID conflicts in logs (see `unity-dependency-trace`).
7. Build and platform. Target platforms, IL2CPP versus Mono, code stripping level, WebGL settings when present (see `unity-webgl-build`), and whether a build has been made recently (build logs, CI).
8. Team hygiene. `.gitignore` covers `Library`, `Temp`, `Logs`, `UserSettings`; `.gitattributes` for LFS; `.meta` files committed for every asset.

## Output

```
# Unity audit: <project>
Editor: <version> | Pipeline: <Built-in/URP/HDRP + package version> | Serialization: <mode>
Packages: <n>, flagged: <list>
Scenes in build: <n>, bootstrap: <scene>
Assemblies: <n>, cycles: <yes/no>

## Findings (ranked)
1. [severity] <finding>
   Evidence: <path:line or count>
   Impact: <player, build, or team impact>
   Route to: <Crunchless agent or skill>
...

## What is healthy
- <with evidence>
```

Severity: blocker (cannot build or open cleanly), high (players or the next release hit it), medium (slows work or risks regressions), low (hygiene).

Finish with the Crunchless handoff (Changed: nothing, audit only; Evidence; Verify; Open; Next).
