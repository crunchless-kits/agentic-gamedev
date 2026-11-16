# Crunchless (Free edition): a game dev kit for coding agents

Run `/cl-audit` in your game project and get a ranked list of what to fix, with file paths. That is the first thing Crunchless does; the rest follows the same shape.

This is the free, MIT-licensed core: a taste at every stage (brainstorm for ideation, scope guard for development, mechanic critique for polish, ship check lite for publishing), the engine audits for every supported engine, the project profile and house rules, the slop check, the assistant, and all scripts. Builder adds everything you need to develop the game: the engine harnesses, gameplay, multiplayer, QA, CI, release, and platforms. Studio is Builder plus everything that wraps development: production, live ops, marketing, docs, and text. Get either at https://crunchless-kits.github.io/agentic-gamedev/#pricing

## Install

Claude Code: `/plugin marketplace add crunchless-kits/agentic-gamedev`, then `/plugin install cl-core@crunchless` and the plugins you want. Plugin commands are namespaced: `/cl-core:cl-start`, `/cl-core:cl-audit`, `/cl-assistant:cl-ask`. Vendored into a repo: `node scripts/install.mjs --project /path/to/game --bundle web-portals`, after which the bare `/cl-audit` form works. Run `/cl-core:cl-doctor` first if anything looks off. Codex, GitHub Copilot, Cursor, and Antigravity: `node scripts/export_agents.mjs --target codex --bundle unity` (or copilot, cursor, antigravity, gemini, generic), then copy the output folder into your game repository.

## How to Get Builder or Studio

Sponsor once at https://github.com/sponsors/crunchless-kits, on the tier you want, with the GitHub account your coding agent signs in with. Accept the invitation to `crunchless-kits/agentic-gamedev-builder` or `crunchless-kits/agentic-gamedev-studio`. In Claude Code, run `/plugin marketplace add` with that repository's name and install the plugins you need. For other coding agents, clone that repository and run its export script. Every tier in detail: https://crunchless-kits.github.io/agentic-gamedev/#pricing

See ROSTER.md for every member, FRESHNESS.md for what each platform note was last verified against, and CHANGELOG.md for release notes.

## License

MIT. See LICENSE.
