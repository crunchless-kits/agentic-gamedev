> Members marked (Builder) or (Studio) live in the Builder or Studio edition: https://crunchless-kits.github.io/agentic-gamedev/#pricing

# Routing Table

Members by task. Profile = who does each step and its band. "high" marks the judgment step, which runs at the caller's pinned model and effort (opus at medium for decisions); `--deep` raises it to high effort. Pinned values per member: `docs/model-routing.md` in the kit repo.

Most skills named here are hidden from the Skill tool. Free skills, hubs, and commands are listed and invoked directly; every other skill is reached through the hub named in its section heading (engines: `<engine>-harness`), which reads the member's SKILL.md and runs it inline or in a `cl-builder` or `cl-scout` agent. Never call the Skill tool on a hidden member, and never ask the user to type it. The Hubs table in `cl-router` lists every hub.

Plugin installs namespace commands by plugin (`/cl-core:cl-audit`). Vendored installs use the bare form. If a plugin named here isn't installed, apply the shared rules and say which member would normally take the task. `/cl-help <goal>` finds members by tag from `registry.json` and `TAGS.md`.

## Studio Loop (Idea to Retro)

| Stage | Member | Profile |
| --- | --- | --- |
| 0. Set the project profile and teach the kit your house rules | skill `project-profile`, `/cl-learn` (Builder) (skill `learn` (Builder)) | scout low, user confirms |
| 1. Decide what to build next | skills `opportunity-review` (Studio), `competitor-research` (Studio), `business-model` (Studio) | high, refute pass at the same tier |
| 2. Scope a vertical slice or demo snapshot | `/cl-producer scope` (skill `proto-scoping` (Studio)) | high, one question at a time |
| 3. Seed the repo with guardrails and test hooks | skills `scope-guard`, `testability-hooks` (Builder) | builder low |
| 4. Build in the house style | the engine harness (below), `code-persona-builder` (Studio) | medium |
| 5. Review with discipline | `/cl-review` (Builder) (agent `code-reviewer` (Builder), skill `dev-review` (Builder)), skills `calibrated-review`, `scope-check` | review high, check low |
| 6. Try to break it | agent `qa-adversary` (Builder), skill `agent-playtest` (Builder) | sonnet high; playtests by builder |
| 7. Audit the interface and every word | skills `ui-ux-audit` (Builder), `game-ui-standards` (Builder), `text-audit` (Studio), `cold-read` (Studio) | inventory low, findings high |
| 8. Gate the release | `/cl-ship`, skill `ship-readiness` (Builder), agent `compliance-reviewer` (Studio) | scouts low, decision high |
| 9. Ship to the platform and sell the page | `cl-platforms` skills, `store-listing` (Studio), `store-capsules` (Studio) | builder medium, copy high |
| 10. Measure, learn, and plan the next one | skills `metrics-log` (Studio), `insights-review` (Studio), `prototype-retro` (Studio), then `/cl-learn` (Builder) | analyst sonnet, decisions high |

## Any Engine

| Task | Member | Profile |
| --- | --- | --- |
| What can the kit do, or which member fits | `/cl-help` | low, read-only |
| Plan a change in phases, refine the plan, or build it one phase at a time | `/cl-plan`, then `/cl-review --plan` | plan medium, review high |
| Questions about the kit itself (tiers, install, licensing) | `/cl-ask`, agent `cl-guide` | haiku, low |
| Gather facts, run a bundled script, fill a checklist | agent `cl-scout` | haiku, low, parallel per question |
| Execute one bounded skill on known files | agent `cl-builder` | sonnet, medium, parallel on disjoint files |
| Check the environment before a first run | `/cl-doctor` | script |
| Audit a project and route the findings | `/cl-audit` | scouts low, ranking high |
| Remove AI tells from a page, UI, doc, or copy | skills `slop-check`, `ui-pitfalls` (Builder) | scout low, review medium |
| Plan, track, and report across projects | `/cl-producer` (Studio), agent `studio-producer` (Studio) | sonnet, high |

## Engine Harnesses

Every engine plugin has the same surfaces, named `<engine>-<surface>`, behind one hub, `<engine>-harness` (`unity-harness` (Builder), `web-harness` (Builder), `roblox-harness` (Builder), `unreal-harness` (Builder), `godot-harness` (Builder), and `cocos-harness` (Builder)). The `<engine>-project-audit` skills are free and listed. The engines are `unity`, `web`, `roblox`, `unreal`, `godot`, and `cocos`. Older Unity, Godot, and web skills keep their names and declare `harness-surface`.

| Task | Surface | Profile |
| --- | --- | --- |
| Install, versions, CLI, MCP, primitives | `<engine>-setup` | builder medium |
| Audit a project | `<engine>-project-audit` | scouts low (script first), ranking high |
| Add a feature the engine's way | `<engine>-feature-playbook`, agent `<engine>-game-developer` | opus medium; builder executes |
| Scenes or levels as data | `<engine>-scene-manifest` | builder medium |
| Input, UI, audio, animation, physics, world, data | `<engine>-input`, `-ui`, `-audio`, `-animation`, `-physics`, `-world`, `-data` | decision high, builder medium |
| Profiling and budgets | `<engine>-performance` | captures medium, ranking high |
| Builds per OS and platform | `<engine>-build` | builder medium |
| Make the game testable by agents | `<engine>-test-hooks` (follows `testability-hooks` (Builder)) | builder medium |
| Unknown cause, failures, references | `<engine>-diagnostics`, agent `<engine>-diagnostics-engineer` | sonnet medium; escalate after two hypotheses |
| IAP, ads, analytics, backend, platform SDK wiring | `<engine>-services` | design high, builder medium |

Engine-specific extras:
- **Unity:** `unity-ui-toolkit` (Builder) and `unity-ui` (Builder) (uGUI), `unity-addressables` (Builder), `unity-tilemaps-2d` (Builder), `unity-webgl-build` (Builder), `unity-package-audit` (Builder), `unity-reorganize` (Builder), `unity-dependency-trace` (Builder).
- **Web:** `web-game-architecture`, `web-capacitor` (Builder) (Android and iOS), `web-desktop` (Builder) (Steam), `web-3d-scene` (Builder), `web-tilemaps-2d` (Builder), `multi-portal-adapter` (Builder), `playable-ad-pack` (Builder), `backend-adapter` (Builder).
- **Roblox:** `roblox-monetization` (Builder) (game passes, developer products, subscriptions, Immersive Ads), `roblox-open-cloud` (Builder) (API automation, publishing, Luau Execution).
- **Godot:** `godot-gdscript-style` (Builder), `godot-tilemaps-2d` (Builder), `godot-web-export` (Builder), `godot-addons-audit` (Builder), `godot-reorganize` (Builder), `godot-dependency-trace` (Builder).
- **Port to a portal or ad network:** `/cl-port` (Builder).

## Gameplay Systems (cl-gameplay, hub `gameplay-hub` (Builder))

| Task | Member | Profile |
| --- | --- | --- |
| Enemies, companions, anything that decides | skill `game-ai-behaviors` (Builder) | high; builder implements |
| Generated levels, loot, terrain | skill `procedural-generation` (Builder) | high; builder implements |
| Branching dialogue and narrative | skill `dialogue-system` (Builder) | high; builder implements |
| Level layout and greybox | skill `level-blockout` (Builder) | high; builder greyboxes |
| Camera follow, rigs, shake | skill `camera-systems` (Builder) | high; builder implements |
| Starting a game in a known genre | skill `genre-blueprints` | high |
| Name a game, studio, or feature | skill `game-naming` | high; scouts check collisions |

## Design (cl-design, hub `design-hub` (Builder))

| Task | Member | Profile |
| --- | --- | --- |
| Options for a new game or one problem | `/cl-brainstorm`, skill `game-brainstorm` | high |
| Up to 5 comparable games: numbers, reviews, likes, and dislikes | skill `competitor-research` (Studio) | scouts low, synthesis high |
| Premium, free-to-play, freemium, or live service | skill `business-model` (Studio) | high |
| Loop sentence to systems and contracts | skill `design-blueprint` (Builder) | high |
| Spec one system an engineer can build | `/cl-gdd` (Builder), skill `gdd-author` (Builder) | rules high, drafting medium |
| A mechanic feels wrong | skill `mechanic-critique` | high |
| Review a concept, prototype, or GDD | skill `design-audit` (Builder) | inventory low, findings high |
| Check a design against the six pillars, or "the game feels flat" with no single mechanic to blame | skill `design-pillars` (Builder) | medium |
| Plan a quest, mission, side quest, or live event, or turn a story idea into playable content | skill `quest-design` (Builder) | medium |
| Balance, loop, difficulty, economy | skills `balance-experiment` (Builder), `core-loop-design`, `difficulty-curve` (Builder), `economy-balance` (Builder) | high |
| Playtest results | skill `playtest-synthesis` (Builder) | tagging low, synthesis high |
| Feedback and juice | skill `game-juice` (Builder) | builder medium |
| UI rules by audience age, platform numbers | skill `game-ui-standards` (Builder) | high |
| Interface design and review | agent `game-ui-ux-designer` (Builder), skill `ui-ux-audit` (Builder) | opus, medium |
| Visual direction | agent `game-art-feel-director` (Builder) | opus, medium |
| Several mechanics at once | agent `game-systems-designer` (Builder) | opus, medium |

## Content (cl-content, hub `content-hub` (Builder))

| Task | Member | Profile |
| --- | --- | --- |
| Where to get assets with clean licenses (CC0, CC-BY, stores) | skills `asset-sources` (Builder), `cc0-asset-library` (Builder) | scout low, import medium |
| Connect a gen AI asset service the user chose | skill `genai-asset-services` (Builder) | opt-in only |
| Writing fits the game as designed | skill `script-fit-check` (Studio) | high |
| Every reader-facing word | skills `text-audit` (Studio), `cold-read` (Studio) | builder medium, fresh readers isolated |
| Localization, accessibility, audio, textures | skills `localization-pipeline` (Builder), `accessibility-pass` (Builder), `audio-pipeline` (Builder), `texture-atlas-pipeline` (Builder) | builder medium |

## Marketing (cl-marketing, hub `marketing-hub` (Studio))

| Task | Member | Profile |
| --- | --- | --- |
| Turn this week's work into a post plan and drafts | `/cl-market` (Studio), agent `marketing-lead` (Studio) | sonnet high; drafts by builder medium |
| Set the posting days and per-platform frequency | `/cl-market` (Studio) (skill `content-calendar` (Studio)) | low, two questions |
| Find post ideas in commits, notes, and media | `/cl-market` (Studio) (skill `post-ideas` (Studio)) | scout low, ranking high |
| Platform-native drafts, devlogs, press kit | skills `post-writer` (Studio), `devlog` (Studio), `press-kit` (Studio) | copy high, `slop-check` and `text-audit` (Studio) before showing |
| Creators, keys, and outreach emails | skill `creator-outreach` (Studio) | scout low, drafts high |
| Wishlists, festivals, announce, demo, and launch beats | skill `launch-campaign` (Studio) | high |
| Discord setup, feedback channels, review replies | skill `community-management` (Studio) | medium |
| Wishlists, follows, CTR, and conversion | skill `marketing-metrics` (Studio), then `metrics-log` (Studio), `insights-review` (Studio) | analyst sonnet |
| Store pages, capsules, trailers, ad creatives | skills `store-listing` (Studio), `store-capsules` (Studio), `trailer-plan` (Studio), `ua-creatives` (Studio) | copy high, specs low |
| Web presence and structured data | skills `web-presence-audit` (Studio), `structured-data` (Studio) | scout low, copy high |

## Platforms (cl-platforms, hub `platforms-hub` (Builder))

| Task | Member | Profile |
| --- | --- | --- |
| Steam, GOG, Epic | skills `steam-steamworks` (Builder), `gog-galaxy` (Builder), `epic-games-store` (Builder) | builder medium |
| Google Play, App Store | skills `google-play` (Builder), `app-store` (Builder) | builder medium |
| Web portals | skills `poki-integration` (Builder), `crazygames-integration` (Builder), `gamedistribution-integration` (Builder), `youtube-playables-integration` (Builder), `wavedash` (Builder), `coolmath-games` (Builder), `itch-io`, `newgrounds` (Builder) | builder medium, parallel per portal |
| Any other surface, or a portal with no skill | skills `portal-directory` (Builder), `portal-recon` (Builder) | scout low, scaffold high |
| Check a web build against portal rules by running it | skill `web-portal-preflight` (Builder) (in cl-web) | script, then builder medium for fixes |
| OS targets, tablets, Steam Deck, ChromeOS | skill `os-targets` (Builder) | medium |
| Console porting readiness | skill `console-readiness` (Builder) | high |
| Multi-platform release and live layer | agent `publishing-liveops-engineer` (Builder) | sonnet, high |

## Monetization (cl-monetize, hub `monetize-hub` (Studio))

| Task | Member | Profile |
| --- | --- | --- |
| Where to start on money | skill `monetization-iap-ads` (Studio) (hub), agent `monetization-engineer` (Studio) | high |
| In-app purchases | skills `iap-unity` (Studio), `iap-native` (Studio), `iap-revenuecat` (Studio), `iap-capacitor` (Studio) | design high, builder medium |
| Web payments | skill `web-payments` (Studio) | high |
| Ads and mediation | skills `ads-admob` (Studio), `ads-levelplay` (Studio), `ads-applovin-max` (Studio), `ads-web` (Studio), `ads-network-directory` (Studio) | builder medium |
| Test playable ads before upload | skill `playable-preview-test` (Studio) | builder medium |
| Economy backend, rewards, receipts | skills `economy-backend` (Studio), `backend-nakama` (Studio), `rewards-and-receipts` (Studio) | design high, builder medium |
| Review the whole money setup | skill `monetization-audit` (Studio) | high |

## Analytics and Live Ops (cl-analytics, hub `analytics-hub` (Studio))

| Task | Member | Profile |
| --- | --- | --- |
| Plan events and KPIs | skills `analytics-plan` (Studio), `analytics-events` (Studio) | taxonomy high, plumbing medium |
| Wire a provider | skills `analytics-amplitude` (Studio), `analytics-firebase` (Studio), `analytics-gameanalytics` (Studio), `analytics-unity` (Studio), `analytics-directory` (Studio) | builder medium |
| Install attribution | skill `attribution-mmp` (Studio) | builder medium |
| Log how the game does on each platform | skill `metrics-log` (Studio) | scout low, user supplies numbers |
| Why it succeeds or fails, and what to change | skill `insights-review` (Studio), agent `analytics-analyst` (Studio) | sonnet; decisions high |
| Flags, rollouts, experiments | skill `remote-config-experiments` (Studio) | design high, plumbing medium |

## Multiplayer (cl-multiplayer, hub `multiplayer-hub` (Builder))

| Task | Member | Profile |
| --- | --- | --- |
| Pick netcode for this engine and game | skill `netcode-choice` (Builder), agent `multiplayer-engineer` (Builder) | opus, medium |
| Engine netcode | skills `mp-fishnet` (Builder), `mp-unity-ngo` (Builder), `mp-godot` (Builder), `mp-unreal` (Builder), `mp-roblox` (Builder), `mp-web` (Builder) | builder medium |
| Transports, relays, lobbies | skills `mp-transports` (Builder), `mp-lobbies` (Builder) | design high, builder medium |
| Authority and cheating | skill `mp-authority` (Builder) | high |
| Test with several clients | skill `mp-testing` (Builder) | builder medium |

## QA (cl-qa, hub `qa-hub` (Builder))

| Task | Member | Profile |
| --- | --- | --- |
| Make the game testable by agents | skill `testability-hooks` (Builder) | builder medium |
| Play the game through its hooks | skill `agent-playtest` (Builder) | builder medium, parallel per preset |
| Adversarial QA | agent `qa-adversary` (Builder) | sonnet, high |
| Bugs and QA reports | skills `bug-report` (Builder), `qa-report` (Builder) | medium |
| Phone, tablet, and desktop coverage | skill `device-matrix` (Builder) | scout low |
| Smoke tests, replays, soak runs, test scaffolds | skills `web-smoke-tests` (Builder), `replay-harness` (Builder), `soak-runner` (Builder), `engine-test-scaffold` (Builder) | builder medium |

## Compliance (cl-compliance, hub `compliance-hub` (Studio))

Common knowledge only. This is not legal advice: have a lawyer review before launch.

| Task | Member | Profile |
| --- | --- | --- |
| Privacy policy and consent | skills `privacy-policy` (Studio), `consent-management` (Studio) | high |
| Kids and COPPA | skill `kids-and-coppa` (Studio) | high |
| Age ratings, store data forms, loot box rules | skills `age-ratings` (Studio), `store-data-forms` (Studio), `monetization-rules` (Studio) | medium |
| Pre-launch compliance review | agent `compliance-reviewer` (Studio) | sonnet, read-only |

## Release (cl-release, hub `release-hub` (Builder))

| Task | Member | Profile |
| --- | --- | --- |
| Decide whether a build ships | `/cl-ship`, skills `ship-readiness` (Builder), `ship-check-lite`, agent `qa-release-engineer` (Builder) | scouts low, decision high |
| Test plan | skill `qa-test-plan` (Builder) | medium |
| Post-release bug | skill `regression-triage` (Builder) | repro medium, cause high |
| Saves | skill `save-system-check` (Builder) | builder medium |
| Performance campaign | agent `game-performance-engineer` (Builder) | opus, medium |

## Studio and Production (cl-studio, hub `studio-hub` (Studio))

| Task | Member | Profile |
| --- | --- | --- |
| Track projects, say what's next | `/cl-producer status`, `next` (skills `project-tracker` (Studio), `next-steps` (Studio)) | sonnet, medium |
| Calendar, token usage, expenses | `/cl-producer week`, `usage`, `expenses` (skills `calendar-brief` (Studio), `usage-tracker` (Studio), `expense-tracker` (Studio)) | low |
| Tickets in Jira, Linear, Trello, Monday, and others | skill `ticketing-connectors` (Studio) | low |
| GDDs, one-pagers, high-concept docs, reports | agent `docs-writer` (Studio), skills `one-pager` (Studio), `high-concept-doc` (Studio), `report-writer` (Studio) | drafting medium |
| Milestones, risks, release calendar | skills `milestone-plan` (Studio), `risk-register` (Studio), `release-calendar` (Studio) | high |
| Pitch, postmortem, onboarding, briefs | skills `publisher-pitch-package` (Studio), `postmortem` (Studio), `team-onboarding-doc` (Studio), `collaborator-brief` (Studio) | high |

## CI (cl-ci, hub `ci-hub` (Builder))

| Task | Member | Profile |
| --- | --- | --- |
| CI for web, Unity, Godot, and releases | skills `ci-web-pipeline` (Builder), `ci-unity-pipeline` (Builder), `ci-godot-pipeline` (Builder), `ci-release-tagging` (Builder) | builder medium |

## Changelog

- 2026-11-15: Hubs. Section headings name each plugin's hub; hidden members are reached through it, never through the Skill tool.
