# Changelog

## 0.18.0 (2026-11-18)

- New: `/cl-suggest` (free, in cl-core). Logs an idea for changing the kit to `.cl/suggestions.md` and, on your yes, files it as an issue labeled `suggestion` on the public repo. It leaves out game names, code, and people's names unless you say to keep one. `/cl-suggest list` shows the log and the open suggestions. The router sends "the kit should..." here.

## 0.17.1 (2026-11-17)

- Fix: art direction requests now reach the `game-art-feel-director` agent. A test run asked for "the kit's art direction skills", searched only the skill list, found `game-juice`, and said the kit had no art direction. The router now says some jobs are agents and names this one, the routing table row covers "art direction", "the look", and "looks flat or generic", and `game-juice` sends the look to the agent first. A rerun of the same brief read the agent, followed its procedure, and wrote the style guide it asks for.

## 0.17.0 (2026-11-17)

Planning, from a first-time user's feedback and a review of HumanLayer's plan workflows (`.claude/docs/ai/crunchless/v016/humanlayer-review.md`).

- New: `/cl-plan` (free, in cl-core). Researches the code with scouts, settles open decisions with you one at a time, and writes `.cl/plans/YYYY-MM-DD-<topic>.md` in phases. Each phase lists its changes, automated checks taken from the repo, and manual checks, and the plan has a Not Doing list. `--iterate <plan> <feedback>` edits it, and `--next <plan>` builds one phase through `cl-builder`, runs its checks, and stops for yours.
- `/cl-review --plan <plan>` (Builder) reviews against the plan: each check passed, failed, or not run; changed files the phase doesn't list; and anything on the Not Doing list as blocking. Without the flag it uses the plan in progress that matches the diff.
- Game feel references, in the kit's own words: `melee-feel.md` in `game-juice` (layers of a close-range hit with starting numbers), `camera-techniques.md` in `camera-systems` (follow, framing, visibility, and feel), and `telegraphs.md` in `game-ai-behaviors` (enemy warnings). The art director agent gains a step on stylizing mixed assets into one look.
- Site rebuilt around visuals and fewer words: real before-and-after frames from one kit art and juice pass (`docs/benchmarks/juice-pass/`), benchmark bars (all 20 automated Poki checks: 10 of 10 with the kit, 0 of 10 without), new-game and in-progress paths, and a roster of the 30 agents. Cut: the sample audit output, the "why the gap" section, and the benchmark tables. Counts at 341 members.

## 0.16.1 (2026-11-17)

Fixes from the second ship-to-Poki benchmark round, all in `web-portal-preflight`.

- New Poki check `stop-when-hidden`: `gameplayStop()` when the tab hides during play. Three of ten kit builds in the benchmark missed it. On the twenty benchmark builds it agrees with the judges' scoring of that rule on all twenty.
- New Poki check `touch-input`: the game must listen for touch. A Poki build that fails it is a blocker in `/cl-port` and the Poki skill. `"phones": false` in the config skips it. It can't tell whether every action has a touch control, so the agent still checks that by reading.
- Fix: a game that waits for one more input after an ad break no longer fails `stop-on-death` and `break-on-restart` by mistake. The run gives that input once, from the new `afterBreak` config steps or the `start` steps.
- Sources: the output names the date the rules were checked and the docs they come from, says when they are over 90 days old, and the report must name both.
- Shorter output: passing checks print on one line (`--verbose` shows their evidence), repeated SDK calls fold into one entry, and long evidence is cut. On the ten kit builds from the benchmark, the output is 55 to 68 percent shorter.
- 22 checks in all: twelve web and ten Poki. The benchmark report keeps the 0.16 numbers. Its first held-back rule is now a preflight check, so the next round needs new ones.

## 0.16.0 (2026-11-17)

The kit can now run a web game and check it, where before it could only read the code.

- New: `web-portal-preflight` (Builder, in cl-web). A script boots a web game in a fake browser with a mock portal SDK and reports 20 checks as pass, fail, or skipped, each with its evidence and the usual fix: twelve web checks for any portal or embed, and eight Poki checks. It needs Node.js 22 and nothing else, exits 1 on a failed check for CI, and has a self-test that runs in the kit’s own CI.
- `/cl-port`, the Poki skill, and the router now end portal work with the preflight. `/cl-ship` and `ship-readiness` use its output as gate evidence.
- Fix: the release gate no longer stops on a web game with no build step. The folder that holds `index.html` is the release candidate.
- Benchmark: on the ship-to-Poki task, 9 of 10 builds made with this version passed all 24 readiness checks, against 0 of 10 without the kit. The preflight tests 20 of those 24 rules, and the report says what that means: `docs/benchmarks/ship-to-poki/REPORT.md` in the free repository.
- Site: counts at 340 members, and the benchmark section reports the new round.

## 0.15.0 (2026-11-15)

A full rebuild: six engine harnesses, five coding agents, and new plugins for platforms, money, analytics, multiplayer, compliance, and marketing.

- Design: `quest-design` (Builder) picks quest and gameplay types first, derives the assets, then the story; `dialogue-system` and the router point to it.
- Design: `design-pillars` (Builder) checks a concept, prototype, or GDD against six pillars (fun, loop, curiosity, skill, motivation, progression) and maps six design habits to members; `design-audit` and the router route to it.
- Site: new brand, title-case nav, animated game backdrop, stat capsules, a `/cl-audit` flow, measured charts (hub listing cut, model split), and a tag explorer with all 247 tags (`liveops` merged into `live-ops`) generated by `scripts/site_tags.mjs` (checked in CI). GitHub Pages workflow ships with the free edition.
- Pricing: one-time, Builder $10 and Studio $100, early access.
- Site and FAQ: install steps per agent (Claude Code, Codex, Copilot, Cursor, Antigravity) in tabs, model tiers named small, mid, and top, shorter chart captions, counts at 339 members, and Antigravity in place of Gemini.
- Site layout: capsules of equal height with fuller stats, a benchmark section from the first with-and-without run (`docs/benchmarks/2026-11-16-coin-dash.md`), audience cards in the tier colors, the numbers folded into the install section, the guide and FAQ folded into What’s Inside, and the three-rules section cut.
- Benchmarks: three with-and-without runs in Claude Code, with every build, score, and judge file in `docs/benchmarks/`. The site shows the ship-to-Poki readiness score and the audit replication, and the free edition now ships the records.
- Poki notes refreshed on 16 Nov from `developers.poki.com`, which replaced `sdk.poki.com`: first-input rule, external requests policy, page-jump snippet, scaling, and web exclusivity. The Poki preflight list gained three checks.
- Kit FAQ: names all six engines and every bundle, and says one-time payment where it said updates while subscribed.
- Coding agents: new `antigravity` export target (`.agents/skills/`, `.agents/agents/` with Flash or Pro per role), since Gemini CLI no longer signs in personal Google accounts. Every export now rewrites Claude Code's Skill and Agent tool wording into "open it by path" and "hand the task to that agent", and Claude model names into role names such as "builder model". On Antigravity, Copilot, Gemini CLI, and generic exports, hub members move to `.crunchless/members/`, so the agent lists only hubs, free skills, and commands. Install and update steps in `cl-start` and the FAQ lead with the export command, and `.crunchless/INDEX.md` gives member counts per plugin. The `compat-lite` test and its first four-agent run are in `docs/agent-tests/`.
- **Engine harnesses:** every engine follows one 16-surface standard.
  - New: Roblox, Unreal Engine 5, and Cocos Creator. Flax and O3DE were built, then dropped for low demand.
  - Unity, web, and Godot gained setup, audio, data, world, builds, test hooks, and services. Web also gained Capacitor and desktop wraps.
  - Each engine has a `primitives.json`. Primitives now ship as pinned dependencies pulled from upstream, never copied into the kit.
- **New plugins:**
  - `cl-platforms`: Steam, GOG, Epic, Google Play, App Store, portals, OS targets, and console readiness. The portal skills moved here.
  - `cl-monetize`: IAP per engine, web payments, ad networks, playable previews, economy backends, and Nakama.
  - `cl-analytics`: event plans, providers, MMPs, the metrics log, and insights.
  - `cl-multiplayer`: netcode per engine, transports, lobbies, and authority.
  - `cl-compliance`: privacy, consent, kids' rules, age ratings, store data forms, and loot box rules. Not legal advice.
- **Design:** competitor research, business models, game UI standards by audience age, and UI pitfalls.
- **Content:** asset sources, opt-in gen AI asset services, script fit, store capsules, trailers, and UA creatives.
- **QA:** the testability-hooks standard with log contract v1, agent playtests, the `qa-adversary` agent, bug and QA reports, and the device matrix.
- **Core and studio:**
  - `/cl-learn` and `.cl/house/`, plus `/cl-review` with `code-reviewer` and `dev-review`.
  - `/cl-producer`, with project tracking, next steps, calendar, usage, expenses, and ticketing connectors.
  - The `docs-writer` agent, and `proto-scoping` (formerly `vertical-slice-planner`).
- **Portability:** `scripts/export_agents.mjs` builds Codex, Copilot, Cursor, Gemini CLI, and generic AGENTS.md layouts. `docs/portability.md` covers each agent, and `docs/agent-tests/` holds a test handoff per agent.
- **Round 3 fixes:**
  - Forked skills now declare `model: sonnet`, and the registry fails a fork without a model.
  - Descriptions are capped at 300 characters, with a registry warning, and quoted for strict YAML parsers.
  - `cl-guide` searches only its own install.
- **Registry and help:**
  - The registry carries `tags` and `harness-surface` and generates `TAGS.md`, the SEO keyword list.
  - `/cl-help` answers from the manifest, and the routing table was rewritten around the harness standard.
- **Bundles:** one per engine, plus add-ons, combined with commas.
- **Tiers:** Pro split into Builder (everything to make the game) and Studio (Builder plus marketing, money, analytics, production, docs, and text). `scripts/export_edition.mjs` builds the free, builder, and studio editions, with distinct marketplace names (`crunchless`, `crunchless-builder`, `crunchless-studio`). Repos live under `crunchless-kits/agentic-gamedev`.
- **Free hooks:** `competitor-snapshot` (one game, free), `itch-io` publishing is free, and `/cl-audit` covers all eight engines and labels the tier of the member that fixes each finding.
- **Marketing:** new `cl-marketing` plugin with `/cl-market`, the `marketing-lead` agent, a content calendar, post ideas from the week's work, platform-native drafts, devlogs, press kits, creator outreach, launch campaigns, community management, and marketing metrics. Store pages, capsules, trailers, UA creatives, web presence, and structured data moved here from `cl-content`.
- **Diagnostics agents:** use `disallowedTools: Write, Edit, NotebookEdit` in place of a tool allowlist, so engine MCP read tools keep working while edits are blocked.
- **Agent tests:** each handoff adds an adversarial pass and a report section for it.
- **Hubs:** each plugin has one listed hub skill (20 in total, counting the router for cl-core) that holds a generated table of its members. The other 253 skills stay complete but come off the model's skill menu (`disable-model-invocation`), and hubs read them by path or hand them to `cl-core:cl-builder`. Every bundle except `everything` now fits the 200K listing budget (35% to 75%), and smoke fails if one goes over. Live check: a Unity rebinding request went from the hub to the builder to `unity-input-system`.
- **Token and model optimization:**
  - Opus agents cut from 18 to 14, all at medium effort. High effort is opt-in with `--deep`.
  - Skill descriptions average 149 characters, down from 272.
  - The Unity bundle's description load fell from 24,204 to 14,198 characters.
  - New: `docs/model-routing.md`, `model-map.json` (applied per target by the exporter), `scripts/token_budget.mjs` (`npm run budget`), and `docs/benchmark-token-method.md`.
- **Fix pass from the cold reviews:**
  - Forked skills name `agent: cl-core:cl-builder`. A live test on 2.1.319 showed plugin agents need the prefix; the vendored installer strips it.
  - `kit-index.json` ships inside `cl-core` and `cl-assistant`, so help, audit, and the guide work after a marketplace install.
  - The vendored installer copies plugin scripts, references, primitives, and MCP examples.
  - `detect-engine.mjs` covers all eight engines, and doctor checks the description budget.
  - `cl-qa` and `cl-release` no longer pull in `cl-web`.
  - Editions describe only their own members and carry no placeholders.
  - The guard hook uses a tokenizer and blocks every listed bypass (84 regression cases).
  - The scope guard allows each engine's normal layout (35 cases).
  - The snapshot-refresh job no longer writes files from fetched pages.
- **Verification pass:** 506 `TODO(verify)` markers checked against official sources, leaving 262, each with a reason. Corrections: Quaternius license (no longer CC0), FishNet license, Unity IAP 5.5, Capacitor 8 minimums, Apple US external links, Flax `Engine.CommandLine`, O3DE double-hyphen flags.

## 0.14.0 (2026-11-09)
- Round-two review fixes. Install: the marketplace command no longer doubles the slug; plugin commands documented in their namespaced form; every plugin pulls in cl-core; the guard hook goes through the manifest and conflict rules, registers once with a portable command, and matches PowerShell; `--local-only` also excludes `.cl/`, warns about already-tracked files, and changes the closing line.
- Free edition export: filtered bundles, Pro commands marked, a Pro member list for the assistant, a required `--holder` for the MIT license, and the exported smoke test runs as part of the export.
- CI no longer embeds dates: product knowledge has no generation date, the coverage table has no age column, and `guide_knowledge.mjs --check` exists. The roster moved to ROSTER.md so the README is a buyer head that passes the kit's own scanner.
- Scanner: word-boundary matching, narrower stock-phrase list, dithering checked in prose only, negation-pivot detection, document length and colon headlines as warnings for Markdown. Playable validator: `--cap` validated, verified caps silence the source warning, archives measured, `--strict`.
- New `/cl-doctor` with `doctor.mjs`; `checkpoint.mjs` keyed by run id; `llms.txt` generated from the registry; `LICENSE.md` at the root; plain JavaScript projects detected as web games; nested Unity manifests guarded; TileMapLayer version note; field incidents labeled with where they were observed; neutral house-rules template; store listing never saves the owner's page.
- Copy: README head rewritten for a reader (concrete opener, definitions, start-here line, Free and Pro table, how to get Pro, total monthly cost, early-access status); routing section states that `context: fork` and `paths` were not honored for plugin skills on Claude Code 2.1.318 and what that means for cost; the no-refund reality of GitHub Sponsors replaces the 14-day promise; primitives wording reconciled with the building skills; profile gained a generic three-scope AI policy and a pitch-format gate.

## 0.13.0 (2026-11-09)
- Platform facts corrected after external review: agents pin `effort`; self-contained implementation skills declare `context: fork` with `agent: cl-builder`; engine building skills carry `paths`; the dependency trace forks into the scout; README and guide point at `CLAUDE_CODE_EFFORT_LEVEL` and `CLAUDE_CODE_SUBAGENT_MODEL_FORCE` as the only overrides.
- Free tier now gives a taste at every stage: `scope-guard` and `/cl-ship` are free, and a new `ship-check-lite` covers the four universal floor sections; the full gate stays Pro.
- Install profiles renamed bundles (`web-portals`, `playables`, `unity`, `godot`, `studio`, `everything`) to stop colliding with the project profile; the installer wires the guard hook into `.claude/settings.json`, adds `--local-only`, and `--no-hooks`.
- `/cl-audit` and `/cl-ship` gained `--serial`, a parallel cap (`maxParallelAgents`, `CL_MAX_PARALLEL`), checkpoints, and `--resume`.
- `check_playable.mjs` reports the source confidence of each network cap and warns on third-party caps; field-incident checks added (ASTC on Unity web, desktop frame cap, bounded live queries, archive paths, forced dark mode).
- Builder definition of done includes the project's smoke test or a headless scene run where one exists, and the handoff states the declared model and effort.
- Assistant gained dated market notes; README rewritten for a buyer (what it is, what it is not, what you need, plain tiers, early-access pricing through GitHub Sponsors, coverage and freshness block, release notes); `freshness.mjs` and a tag-triggered release workflow added; American spelling pass; landing page rewritten for a buyer with cross-engine positioning.

## 0.12.0 (2026-11-09)
- `cl-assistant` plugin (free, optional): `cl-guide` agent on sonnet, read-only; `/cl-ask`; `kit-guide` skill with a generated product-knowledge file, FAQ, usage paths (Claude Code plugins, vendored repos, Claude Projects, Cowork, CI), Claude Project instructions, and troubleshooting. Profiles now include it; `profiles.json` is the single source for install profiles.

## 0.11.0 (2026-11-09)
- `slop-check` (free): scanner for 25 design tells and the common writing tells across HTML, CSS, component files, and Markdown, with replacement lists; required in the builder's definition of done and wired into the UI, store, web presence, text, pitch, and art-direction skills. Applied to the kit's own landing page (six flags to zero).

## 0.10.0 (2026-11-09)
- Studio loop folded in as original members: project profile and house rules; scope guard (Node hook for SessionStart, PreToolUse, Stop, seeder with local-only mode, 17 tests), scope check, calibrated review; UI/UX audit rebuilt with public-source rule files, first-run notes, and a measurement script; cold read and text audit with a runt script; web presence audit and structured data; quality floor template wired into ship readiness; slice spec rewritten around the fifteen-second ad gate with a SPEC template and a one-way mirror script; opportunity review with a refute pass; prototype retro with RETRO and NOTES templates; collaborator brief; code persona builder.
- Router shared rules gained the profile-first step, evidence labels, zero-context checking, fix-the-source, one-home, and draft-show-stop habits; routing table gained the studio loop.

## 0.9.1 (2026-11-07)
- Repo and package slug `crunchless-gamedev-skills` for discoverability; descriptive README title; GitHub topics checklist; marketplace name unchanged.

## 0.9.0 (2026-11-07)
- Building skills inside the engine plugins: web UI layer, animation and tweens, physics and collisions, tilemaps, 3D scene; Unity input system, UI Toolkit, animation, physics, tilemaps, Addressables; Godot GDScript style, Control UI, animation, physics, tilemaps, input map. All Pro.

## 0.8.0 (2026-11-07)
- Renamed to Crunchless: plugins `cl-*`, commands `/cl-*`, marketplace `crunchless`, manifest `crunchless.manifest.json`, CLAUDE.md markers `crunchless:start`. Level 1 name checks recorded in `.claude/docs/ai/crunchless/10x/decisions.md`.

## 0.7.0 (2026-11-06)
- Renamed to Crunchless: plugins `cl-*`, commands `/cl-*`, marketplace `crunchless`, manifest `crunchless.manifest.json`, CLAUDE.md markers `crunchless:start`. `scripts/rename.mjs` performs the whole rename and can flip to another brand later.

## 0.6.0 (2026-11-06)
- `game-naming` skill with categories, rubric, and a verification checklist.
- cl-gameplay plugin: AI behaviors, procedural generation, dialogue, level blockout, cameras, genre blueprints; feature playbooks for web, Unity, and Godot.
- Free and Pro tiers in frontmatter, `export_free.mjs` builds the MIT free edition, commercial license template, companion routing for engine-primitive packs.

## 0.5.0 (2026-11-06)
- `/cl-start` onboarding and `/cl-help` listing commands.
- Install profiles: `--profile portal-web | playables | unity-mobile | godot-indie | studio | everything`.
- Monthly snapshot refresh job (`snapshot-refresh.yml`): fingerprints every reference source, opens a review pull request when sources change, optional Claude Code draft step.
- `verify_refs.mjs` gains `--fingerprint --write` and a reviewer report.
- Builder plan mode, router snapshot-age nudge, this changelog, strategy and decision records under `.claude/docs/ai/crunchless/`.

## 0.4.0 (2026-11-06)
- CC0 asset library skill with provenance manifest, placeholder tags, credits, and ship check; wired into ship readiness.
- Design additions: brainstorm, blueprint, GDD author, mechanic critique, design audit, balance experiment; `/cl-brainstorm` and `/cl-gdd`.

## 0.3.0 (2026-11-06)
- Execution model: haiku scouts, sonnet builders, opus specialists; run profiles on every member; parallel plans in commands.
- Scripts: TypeScript health, size report and determinism, playable validator, Unity facts and GUID index; kit smoke test and snapshot verifier.
- New plugins: cl-godot, cl-ci, cl-qa, cl-content, cl-studio; portal recon and backend adapter skills; guard hook; eval cases.

## 0.2.0 (2026-11-06)
- cl-unity plugin; dated SDK snapshots for Poki, CrazyGames, GameDistribution, YouTube Playables; playable ad network specs.

## 0.1.0 (2026-11-06)
- Marketplace scaffold, installer, registry; cl-core, cl-web, cl-design, cl-release.
