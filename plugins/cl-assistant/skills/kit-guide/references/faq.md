# FAQ

## What it is
- **What is Crunchless?** A game dev kit for coding agents (Claude Code, Codex, GitHub Copilot, Cursor, Antigravity, and any agent that reads AGENTS.md): agents, skills, commands, and scripts that audit, design, build, test, and ship games on Unity, web, Roblox, Unreal, Godot, and Cocos, with cheap models doing evidence work and the expensive model only deciding.
- **What is it not?** An engine-primitive library. It does not ship a character controller or a shader; it routes those to the engine's docs or a companion pack and adds the audits, decisions, verification, and shipping on top.
- **Who is it for?** Three entry points: new builders with no design background, solo developers who cannot be five roles, and small teams that want their process enforced across people and sessions.

## Tiers
- **What is free?** A taste at every stage: brainstorm (ideation), scope guard with its hook and tests (development), mechanic critique (polish), ship check lite (publishing); plus the router, scouts and builders, the guard hook, project profile and house rules, scope check, calibrated review, slop check, the engine audits, web architecture, core loop, naming, the competitor snapshot, genre blueprints, itch.io publishing, this guide, and the commands start, help, doctor, audit, ship, brainstorm, ask. MIT licensed.
- **What is Builder?** Everything you need to develop the game: the engine harnesses, gameplay systems, multiplayer, QA automation, CI, release gates, platform and portal integrations with dated SDK notes, the design skills, asset and audio pipelines, localization, accessibility, the learner, and code review. One-time payment, under the early access terms in LICENSE.
- **What is Studio?** Builder plus everything that wraps development: production and the studio loop, live ops, analytics, monetization, compliance, marketing, competitor research and business models, docs, and text checks. One-time payment, under the early access terms in LICENSE.
- **How do I know which tier a member is in?** The routing table in a free or Builder edition marks higher-tier members "(Builder)" or "(Studio)"; `/cl-help` lists installed members and marks unavailable ones with their tier.

## Installing and updating
- **How do I install?** In Claude Code: `/plugin marketplace add crunchless-kits/agentic-gamedev`, then `/plugin install cl-core@crunchless` and the plugins you need; commands are then namespaced (`/cl-core:cl-audit`, `/cl-assistant:cl-ask`). Or vendor into a repo: `node scripts/install.mjs --project <repo> --bundle <name>`, after which the bare `/cl-audit` form works. Codex, GitHub Copilot, Cursor, Antigravity, or another agent: from a clone of the kit, `node scripts/export_agents.mjs --target codex|copilot|cursor|antigravity|generic --bundle <name> --out <repo>`.
- **How do I get Builder or Studio?** Sponsor the maintainer at the Builder or Studio tier with your GitHub account, accept the repository invitation GitHub sends, then install from that repository: export from a clone of it, or in Claude Code `/plugin marketplace add crunchless-kits/agentic-gamedev-builder` (or `crunchless-kits/agentic-gamedev-studio`) and install the plugins you need, such as `cl-unity@crunchless-builder`. It is a one-time payment. What you vendored into a project stays usable for that project.
- **Which bundle?** One engine bundle: `unity`, `web`, `roblox`, `unreal`, `godot`, or `cocos`. Add-ons: `web-portals` (web games to portals), `playables` (ad creatives), `mobile`, `live-ops`, `multiplayer`, `content`, `marketing`, and `studio` (founder tooling). Or `everything`. Combine them with commas, such as `--bundle unity,mobile`. Bundles are install sets; the project profile is the per-repo config file. Different things.
- **How do I update?** Plugins: the marketplace update flow in Claude Code. Vendored: `git pull` the kit, re-run the same install command; edited files are reported as conflicts and left alone unless `--force`. Exports: `git pull` the kit and rerun the same export command.
- **Can I edit the skills?** Yes. Vendored copies you edit are detected by hash and never overwritten silently.
- **How do I turn the assistant off?** Do not install `cl-assistant`, or list plugins explicitly without it when vendoring.

## Running it
- **Where does it run?** Claude Code on your machine (plugins), any repo in cloud or CI sessions (vendored), Claude Projects for design and producer conversations without a repo, Cowork for documents and decks. See usage-paths.
- **How does effort work?** Agents, commands, and forked skills pin `model` and `effort` in frontmatter: scouts haiku low, builders sonnet medium, analysts sonnet high, decision makers opus medium. High effort is opt-in with `--deep`. Self-contained implementation skills fork into the builder (`cl-core:cl-builder`, sonnet), which Claude Code 2.1.319 honors in a live test. `CLAUDE_CODE_EFFORT_LEVEL` overrides everything for the session; `/effort` and `/model` let you override by hand.
- **Why did a skill run on the expensive model?** Skills without `context: fork` run in the main conversation on the session model. The forked ones run in `cl-builder` on sonnet. If `CLAUDE_CODE_SUBAGENT_MODEL_FORCE=1` is set, every subagent runs on the forced model regardless of pins; `CLAUDE_CODE_SUBAGENT_MODEL` alone is only a default.
- **Does it need web access?** For verify-first steps on portals, networks, and stores, yes; without it the skill uses the dated snapshot and stops at `TODO(verify)` where it cannot confirm.
- **What are the snapshot dates?** Each reference note carries a "Last verified" date; `node scripts/verify_refs.mjs` lists ages; a monthly job opens a pull request when sources change.

## Trust and legal
- **Is the content original?** Yes. No skill text is copied from other kits; interface rules cite public sources (WCAG, Apple, Material); no persona of a real person ships.
- **Does it send data anywhere?** The kit itself sends nothing. The snapshot refresh fetches public documentation pages in CI; CC0 asset imports are downloads you run.
- **Can I resell or redistribute Builder or Studio?** No; the commercial license covers use inside your organization and shipping games built with it.
- **Can I ship CC0 assets it imports?** Yes, that is the point; the manifest records license evidence and the ship check blocks anything untraced.

## Support
- **Something did not work.** Run `/cl-doctor` first, then see troubleshooting; then open an issue with the doctor output, the handoff block, and the kit version.
- **Can I request a portal or engine?** Yes. `portal-recon` scaffolds any portal from its official docs today; new engine packs follow the shape of the six that ship.
