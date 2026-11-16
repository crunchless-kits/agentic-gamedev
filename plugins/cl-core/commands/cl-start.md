---
description: "First-hour onboarding: detect engine and stage, recommend plugins, run the audit script, name next commands. Use when new to the kit or a project."
model: sonnet
effort: low
argument-hint: [what you are building, or nothing]
tier: free
tags: ["production", "design"]
---

Onboard this project. Context from the user: $ARGUMENTS (when empty, ask one question with tappable options: where are you starting from: idea only, prototype, mid-development, or live game).

Run profile: router. Detection by one `cl-scout`; the recommendation is short.

1. Detect the engine with `node "${CLAUDE_PLUGIN_ROOT}/scripts/detect-engine.mjs" .` (Unity, Godot, Roblox, Unreal, Cocos Creator, or web; `none` means the idea stage). Then check the stage from `design/`, `releases/`, `.github/workflows/`, `assets/third-party/ASSET_MANIFEST.json`, and the installed kit members. Quote what you found. If `all` lists more than one engine, ask which one this session is for.
2. If `docs/crunchless.profile.json` is missing, offer `project-profile` as the first step after install; it saves every later skill a round of questions.
3. Recommend the plugin set: the detected engine's bundle (`unity`, `web`, `roblox`, `unreal`, `godot`, or `cocos`), plus add-ons by buyer shape: portals (`web-portals`), playable ads (`playables`), mobile (`mobile`), a founder planning a studio (`studio`). Bundles and tiers are in `${CLAUDE_PLUGIN_ROOT}/kit-index.json`. Name what is missing, the edition that holds it (Free, Builder, or Studio, from the member's `tier`, or `upgrades` when this edition lacks it), and the install command for each path: `/plugin install <plugin>@<marketplace>`, or, from a clone of the kit, `node scripts/install.mjs --project . --bundle <name>`.
4. If a project exists, open the audit skill the detector named in `audit`. If it ships `scripts/` (web, Unity, and Unreal do), have a scout run them; otherwise have a scout follow the skill's procedure. Summarize the top three facts. If no project exists, recommend `/cl-brainstorm` and `design-blueprint` (through `design-hub`).
5. Check snapshot ages for any portal, network, or store work the user named; warn when older than 90 days.
6. Explain in three lines how cost works here: each command and agent pins its own model and effort, scouts run on haiku, builders on sonnet, and only decisions use opus at medium; add `--deep` to `/cl-audit`, `/cl-review`, or `/cl-ship` for high effort.
7. End with exactly three next commands in order and the Crunchless handoff.
