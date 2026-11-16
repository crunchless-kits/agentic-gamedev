---
name: web-game-audit
description: "Read-only ranked audit of a browser game repo (Phaser, PixiJS, Three.js, WebGL). Use for unfamiliar web projects, /cl-audit, and before refactors or releases."
tier: free
harness-surface: project-audit
tags: ["web", "typescript", "phaser", "pixijs", "threejs", "qa"]
---

# Web game audit

An audit answers "what is this project, what is at risk, and who should fix each thing" with evidence. It never changes code.

Fan-out: run `scripts/ts_health.mjs` first; five `cl-scout` subagents in parallel (stack and build, code health, serialized or asset health, runtime basics, release signals); ranking by the caller.

Scripts: `node scripts/ts_health.mjs <root> [--tsc] [--build-dir dist]` prints stack, strictness, `any` and `ts-ignore` counts, provider references inside gameplay (leak inventory), optional `tsc` result, and build sizes as JSON. Run it before any manual reading.

## Procedure

1. Identify the stack from files, not guesses. A folder with `index.html` and `.js` files and no `package.json` is a plain JavaScript game: skip the TypeScript and lockfile checks, say so, and audit the rest. Read `package.json` (framework, bundler, scripts, TypeScript version), `tsconfig.json` (strictness, targets, path aliases), bundler config, `index.html`, and the entry file. Record versions.
2. Map the structure: entry point, scene or state flow, game loop (fixed timestep or frame-bound), asset loading, save handling, and where platform or provider code lives. Note any provider import inside gameplay code.
3. Build it. Run the install and build scripts if dependencies are present. Record build time, output size per file, and warnings. A project that does not build is finding number one.
4. Check TypeScript health: strict flags, count of `any`, `@ts-ignore`, and `as unknown as`, and whether `tsc --noEmit` passes.
5. Check runtime basics by reading code (and running the game if a browser is available): resize and orientation handling, pause on tab hide, touch and keyboard coverage, device pixel ratio handling, error handling around asset loads.
6. Check performance signals: draw-call hotspots, per-frame allocations in update loops, unpooled objects, uncompressed or oversized textures and audio, synchronous loads on the critical path.
7. Check release signals: deterministic builds, environment or variant handling, save schema versioning, analytics or ad code boundaries, licensing of bundled assets.

## Output

Write the report in this shape:

```
# Audit: <project name>
Stack: <framework@version, bundler, TS version, strict: yes/no>
Build: <pass/fail, size, time>

## Findings (ranked)
1. [severity] <finding>
   Evidence: <path:line or measurement>
   Impact: <player or release impact>
   Route to: <Crunchless agent or skill>
...

## What is healthy
- <things worth keeping, with evidence>

## Handoff
Changed: nothing (audit only)
Evidence: <files read, commands run>
Verify: <how to reproduce the top finding>
Open: <what could not be checked and why>
Next: <single highest-value action>
```

Severity scale: blocker (cannot ship or cannot build), high (players hit it in the first session), medium (hurts over time or blocks a feature), low (hygiene).

## Stop conditions

- Dependencies cannot be installed and the user has not said it is fine to skip the build: report the build as unverified rather than guessing.
- The repo contains more than one game: ask which one before auditing.
