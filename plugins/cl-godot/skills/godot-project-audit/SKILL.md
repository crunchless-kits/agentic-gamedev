---
name: godot-project-audit
description: "Read-only ranked audit of a Godot 4 project. Use for unfamiliar Godot repos, /cl-audit, and before refactors, exports, or releases."
tier: free
tags: ["godot", "gdscript", "csharp", "qa"]
harness-surface: project-audit
---

# Godot project audit

Read the project's own files for every fact. Findings only; nothing changes.

Fan-out: five `cl-scout` subagents in parallel (identity and settings, scenes and autoloads, scripts, resources and addons, export and hygiene); ranking by the caller.

## Procedure

1. Identity. `project.godot`: `config/features` (engine version, renderer flags), `application/run/main_scene`, `rendering/renderer/rendering_method` (forward_plus, mobile, gl_compatibility), autoloads, input map, physics settings, window size and stretch mode, file logging. C# projects: `.csproj` target framework and `.sln`.
2. Export. `export_presets.cfg`: presets per platform, include and exclude filters, web preset options (threads, extensions, head include), icons, and whether secrets or absolute paths leaked in.
3. Addons. `addons/*/plugin.cfg` and whether each is enabled in project settings; versions, sources, and whether they are vendored copies with local edits (see `godot-addons-audit`).
4. Structure. Folder layout, scene count, deep inheritance chains, scripts attached to many scenes, `class_name` registry size, global state in autoloads, `.import` and `.godot/` ignored.
5. Scripts. GDScript typing coverage (functions without return types, untyped vars), `get_node` chains with absolute paths, `await` in `_process`, per-frame allocations (`Array`, `Dictionary`, string building in `_process`), `Engine.is_editor_hint` misuse; C# warnings if a build is possible.
6. Scene health. Missing `ext_resource` paths, scripts attached that do not exist, `uid://` references the project cannot resolve (see `godot-dependency-trace`).
7. Hygiene. `.gitignore` covers `.godot/`, `*.import` tracked as the project intends, large binaries and LFS, export templates version matching the editor.

## Output

```
# Godot audit: <project>
Engine: <version> | Renderer: <method> | Main scene: <path> | Autoloads: <n> | Addons: <n>
## Findings (ranked, max 10)
1. [severity] <finding> | evidence: <path:line> | impact | route to: <member>
## What is healthy
```

Severity: blocker (cannot open or export), high (players or next release hit it), medium (slows work), low (hygiene).

Finish with the Crunchless handoff (Changed: nothing).
