# Genre blueprints

Each entry: expected systems, loop shape, numbers that matter, failure points, kit skills to run. Treat defaults as starting ranges, not rules.

## Platformer
- Systems: character controller with coyote time and jump buffering, variable jump height, hazards and checkpoints, collectibles, camera follow with look-ahead, level pacing.
- Loop: move and jump through a space; read a hazard; commit; land; reach a checkpoint.
- Numbers: coyote time 80 to 150 ms, jump buffer 100 to 200 ms, apex hang, acceleration versus top speed, respawn under three seconds.
- Failure points: floaty jumps (gravity too low), unfair deaths (hazards without telegraphs), camera losing the player, checkpoints too sparse.
- Run: `core-loop-design`, `mechanic-critique`, `camera-systems`, `level-blockout`, `difficulty-curve`.

## Roguelike or roguelite
- Systems: seeded procedural runs, permadeath with meta progression, item and synergy pool, turn or real-time combat, minimap and fog, run summary.
- Loop: explore a generated space; fight; choose rewards; die or clear; carry something forward.
- Numbers: run length 20 to 45 minutes, item pool size versus pick count, meta unlock cadence every two to three runs, death to new run under ten seconds.
- Failure points: unwinnable seeds, synergies that trivialize, meta progression that gates fun behind grind, first runs with nothing to learn.
- Run: `procedural-generation`, `economy-balance`, `balance-experiment`, `replay-harness`.

## RPG
- Systems: stats and leveling, inventory and equipment, quests and journal, dialogue, save slots, combat (turn or action), party or companions.
- Loop: take a quest; travel; fight or talk; gain power; return; unlock the next region.
- Numbers: time to level 2 in the first ten minutes, encounter frequency, equipment tiers per region, quest length versus session length.
- Failure points: stat bloat with no decisions, inventory as a chore, quests that are fetch lists, combat without telegraphs, saves that lose progress.
- Run: `gdd-author` per system, `economy-balance`, `dialogue-system`, `save-system-check`, `game-ai-behaviors`.

## Tower defense
- Systems: lane or open-path waves, tower placement with ranges and targeting rules, economy of build and upgrade, enemy roster with counters, wave preview, speed controls.
- Loop: read the next wave; spend; place or upgrade; watch; adjust.
- Numbers: wave count and length, income per wave versus tower cost, counter coverage (every enemy has two answers), leak tolerance.
- Failure points: one dominant tower, waves without preview, pathing exploits, economy that snowballs, nothing to do while a wave plays.
- Run: `economy-balance`, `difficulty-curve`, `game-ai-behaviors`, `balance-experiment`.

## Card game
- Systems: card data and effects as data, zones (deck, hand, board, discard, exile), turn structure with phases, targeting, deck building, rules engine with priority and interrupts.
- Loop: draw; evaluate; play within resources; resolve; pass.
- Numbers: hand size, resource curve, card pool per set, average game length, draw and discard rates.
- Failure points: effects hard-coded instead of data, rules engine without an undo or log, degenerate combos, deck building with no constraints.
- Run: `gdd-author` for the rules engine, `balance-experiment`, `replay-harness`.

## Puzzle
- Systems: board or grid state, rule resolution, undo and hints, level progression and difficulty ramp, move or time limits, juice on matches.
- Loop: read the board; plan; act; watch resolution; approach the goal.
- Numbers: moves per level, solution count, hint cost, level length 30 seconds to 3 minutes for mobile.
- Failure points: luck disguised as skill, rules without visual explanation, no undo, difficulty curve with cliffs, levels generated without validation.
- Run: `core-loop-design`, `difficulty-curve`, `procedural-generation` (when levels are generated), `game-juice`.

## Visual novel
- Systems: branching script, character and background display, text box with skip and auto, choices with consequences, backlog, gallery and endings, saves anywhere.
- Loop: read; choose; see consequence; reach an ending; replay for others.
- Numbers: words per route, choice frequency, route length versus session, skip speed.
- Failure points: choices without consequence, no skip for read text, unlocalizable text, saves that break on script edits.
- Run: `dialogue-system`, `localization-pipeline`, `save-system-check`.

## Idle or simulator
- Systems: generators and multipliers, offline progress, prestige or rebirth, big-number formatting, purchase validation on the server when real money is involved, event cadence.
- Loop: buy; wait or tap; buy more; reset for a multiplier.
- Numbers: cost growth per purchase, time to first prestige, offline cap, prestige multiplier curve.
- Failure points: inflation without sinks, walls that feel like paywalls, numbers that overflow or display badly, client-trusted purchases.
- Run: `economy-balance`, `monetization-iap-ads`, `remote-config-experiments`, `backend-adapter`.

## Shooter (first or third person)
- Systems: controller and camera, weapons as data with feel layers, hit detection (hitscan or projectile), enemy AI with telegraphs, health and cover rules, arenas and encounters.
- Loop: read the arena; position; shoot; manage resources; clear; move.
- Numbers: time to kill, reload and swap times, enemy reaction time, encounter size, ammo economy.
- Failure points: weapons that feel the same, enemies that hit without telegraphs, camera and aim assist mistuned per input device, performance under entity load.
- Run: `mechanic-critique`, `game-juice`, `game-ai-behaviors`, `camera-systems`, the engine profiling skill.

## Survival crafting
- Systems: resource gathering, inventory and stacking, crafting recipes as data, needs (hunger, warmth), base building with placement rules, day and night, saves of a mutable world.
- Loop: gather; craft; satisfy needs; expand; survive the night; reach the next tier.
- Numbers: need decay rates, recipe tiers, gather rates versus consumption, night length.
- Failure points: needs as nagging, inventory tedium, recipes with no discovery, world saves that bloat or corrupt.
- Run: `economy-balance`, `procedural-generation`, `save-system-check`, `level-blockout`.
