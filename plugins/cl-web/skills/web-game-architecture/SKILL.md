---
name: web-game-architecture
description: "Plan or restructure a TypeScript game: fixed-step loop, state, entities, events. Use for new games, outgrown prototypes, or before multiplayer."
tier: free
tags: ["web", "typescript", "phaser", "pixijs", "threejs", "production"]
---

# Web game architecture

Good structure makes the next ten features cheap. Decide these things once, write them down in the repo, and keep gameplay deterministic and provider-free.

Fan-out: decisions by the caller; migration slices to `cl-builder` sequentially (each leaves the game playable).

## Decisions to make (in this order)

1. Framework and renderer. Keep what the project has unless the user wants a change. For a new project, pick by need: 2D sprite-heavy (Phaser or PixiJS), 3D (Three.js), minimal or size-constrained (vanilla Canvas or WebGL). Verify the chosen version's API from its type definitions.
2. Loop and time. Fixed-timestep simulation (for example 60 Hz) with an accumulator, render at display rate, interpolate visuals. All gameplay uses the simulation clock; nothing gameplay-related runs in `requestAnimationFrame` callbacks directly.
3. State flow. Explicit top-level states as a discriminated union (boot, menu, playing, paused, results) with a single transition function. Scenes own their assets and release them on exit.
4. Entities. Prefer plain typed data plus systems (lightweight ECS or data-oriented objects) over deep class hierarchies. Pool anything created per second.
5. Events. One typed event bus (`Record<EventName, Payload>`) for cross-system communication. No string-typed events, no global mutable singletons for game state.
6. Configuration. All tunables (speeds, costs, timings, levels) in typed config files or JSON validated at load, never as literals inside systems. This is what remote config and A/B tests will later override.
7. Assets. One manifest (id, path, type, size budget, scene that owns it). Load by manifest, preload per scene, measure total bytes.
8. Platform boundary. A `Platform` interface the game owns (lifecycle, ads, saves, analytics, purchases) with a `NullPlatform` for local development. Gameplay imports the interface only. See `multi-portal-adapter`.
9. Determinism. Seeded random number generator injected into simulation; `Math.random` only for cosmetics.

## Suggested layout

```
src/
  main.ts            boot, platform selection, loop start
  core/              loop, clock, rng, events, config loading
  platform/          Platform interface, NullPlatform, one adapter per provider
  game/              simulation: entities, systems, rules (no rendering, no DOM)
  render/            renderer bindings, scenes, UI
  assets/manifest.ts
  config/            typed tunables
shared/              (only if multiplayer) message and state types shared with a server
```

Adapt names to the project's existing conventions. The separation that matters: `game/` has no imports from `render/`, `platform/` providers, or the DOM.

## Procedure

1. Read the existing project (if any) and write a one-page current-state map with paths.
2. Propose the target structure and the migration order: smallest first, each step leaves the game playable.
3. Introduce the platform boundary and the typed config early; these unblock release work.
4. Move code in slices, running type checks and the game after each slice.
5. Record the decisions in a short `ARCHITECTURE.md` in the repo so future sessions follow them.

## Output

Finish with the Crunchless handoff (router). Include the decision list with the reason for each.
