---
name: roblox-project-audit
description: "Read-only scored Roblox audit: structure, remote security, data, receipts, performance, UI. Use for unfamiliar Roblox projects, /cl-audit, and before releases."
tier: free
harness-surface: project-audit
tags: ["roblox", "luau", "rojo", "qa", "monetization", "ui", "compliance"]
---

# Roblox Project Audit

Answer "what is this game, what is at risk, and who fixes each thing" with evidence. Change nothing.

Fan-out: five `cl-scout` reads in parallel (tooling, code and security, data and money, performance and world, UI and publishing); scoring by the caller.

## When to use

- First look at a Roblox repo or place.
- Before a refactor, a monetization push, or a public release.
- After a data loss, exploit, or revenue drop report.

## Procedure

1. **Gather.** Read files on disk (`rokit.toml`, `*.project.json`, `wally.toml`, lint configs, `src/`). If the game lives in Studio, use the Studio MCP read tools (`search_game_tree`, `inspect_instance`, `script_grep`). No `execute_luau` that changes state.
2. **Score seven areas, 0 to 5 each,** with evidence (path or instance path and line) for every point lost:
   1. **Tooling:** pinned tools, lint and format clean, Git workflow chosen, type mode (`--!strict` share).
   2. **Code structure:** server logic in `ServerScriptService`, shared modules in `ReplicatedStorage`, client in `StarterPlayerScripts`; no logic in hundreds of loose scripts; ModuleScripts with clear owners.
   3. **Security:** every `RemoteEvent` and `RemoteFunction` handler validates type, range, rate, and ownership on the server; the server never trusts client values for damage, currency, or position; no `RemoteFunction` invoked from server to client.
   4. **Data:** `UpdateAsync` for player data, session locking, retries with backoff, save on leave and `BindToClose`, under the limits in `roblox-data/references/datastore-limits.md`.
   5. **Money:** `ProcessReceipt` set once on the server, idempotent by `PurchaseId`, grants saved before returning `PurchaseGranted`; game pass checks on the server; rewarded ads grant through `ProcessReceipt` (see `roblox-monetization`).
   6. **Performance and world:** streaming settings and `WaitForChild` use, part and script counts, `Heartbeat` and `RenderStepped` work, memory by category in the Developer Console.
   7. **UI and publishing:** `ScreenInsets` and scaling on phone, tablet, console, and desktop; input on touch and gamepad; `cl-design:game-ui-standards` sizes; content questionnaire, icons, thumbnails, and audience settings.
3. **Rank findings** by severity (critical: money or data loss, exploit; high: crash or blocked platform; medium; low) and route each to an owner skill.

## Checks

- Every lost point has evidence. No finding without a path, instance path, or measurement.
- Nothing in the project or place changed (`git status` clean; no MCP write tools used).

## Output

```
# Roblox audit: <game> (<date>)
Score: <total>/35 | Tooling <n> | Structure <n> | Security <n> | Data <n> | Money <n> | Perf <n> | UI+Publish <n>
## Findings (ranked)
1. [critical] <title>: <evidence> -> <owner skill>
## Not checked
<areas without access, for example live analytics>
```

Finish with the Crunchless handoff (Changed: none, Evidence, Verify, Open, Next).
