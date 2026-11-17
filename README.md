# Crunchless (Free edition): a game dev kit for coding agents

Crunchless is a set of plugins for your coding agent. Each plugin holds skills (step-by-step instructions your agent follows), agents (specialists your agent hands work to), commands you type, and scripts that run without a model, so they cost no tokens. Start with the audit command, `/cl-core:cl-audit` in Claude Code, in your game's folder: your agent returns a ranked list of what to fix, with file paths. Install steps are below. It works in Claude Code, Codex, GitHub Copilot, Cursor, and Antigravity, on Unity, web, Roblox, Unreal, Godot, and Cocos.

## What This Edition Holds

- Project audits for Unity, web, Roblox, Unreal, Godot, and Cocos, each with a ranked list of fixes
- Brainstorming, a competitor snapshot, core loop design, and mechanic critique
- A scope guard that stops your agent from building what you didn't ask for
- A code review sized to the change, where every finding names how it fails
- A web game architecture guide
- A release check, `/cl-core:cl-ship`, that marks a build ready or not ready and names the file or log behind each line, plus steps for shipping on itch.io

Builder ($10) and Studio ($100), each a one-time sponsorship, add the skills that build, test, and ship the game. [See every tier](https://crunchless-kits.github.io/agentic-gamedev/#pricing).

## Install in Claude Code

1. Add this repository as a plugin marketplace. It registers under the name `crunchless`: `/plugin marketplace add crunchless-kits/agentic-gamedev`
2. Install the core plugin, which holds the audit and the shared agents: `/plugin install cl-core@crunchless`
3. Install the plugin for your engine, such as `/plugin install cl-unity@crunchless`. The engine plugins are `cl-unity`, `cl-web`, `cl-roblox`, `cl-unreal`, `cl-godot`, and `cl-cocos`.
4. In your game's folder, run the audit: `/cl-core:cl-audit`

Claude Code puts the plugin name in front of each command, so the audit is `/cl-core:cl-audit`. If anything looks off, run `/cl-core:cl-doctor`.

## Install Into One Game's Repository

This copies the kit into the game's `.claude/` folder instead of installing plugins, so anyone who opens Claude Code in that repository gets it, and the shorter `/cl-audit` works. A bundle is the set of plugins for one engine, the core included. Run it from any folder. Files you have edited are reported and left alone, and your CLAUDE.md is backed up before the kit adds its block. You need Git and Node.js 22 or newer.

```
git clone https://github.com/crunchless-kits/agentic-gamedev crunchless
node crunchless/scripts/install.mjs --project /path/to/game --bundle unity
```

## Install in Codex, Copilot, Cursor, or Antigravity

This writes the kit into your game's folder in your agent's own layout: its skills folder, its agents folder, and its instructions file. You need Git and Node.js 22 or newer.

```
git clone https://github.com/crunchless-kits/agentic-gamedev crunchless
node crunchless/scripts/export_agents.mjs --target codex --bundle unity --out /path/to/game
```

Swap `codex` for `copilot`, `cursor`, or `antigravity`. In both install commands, swap `unity` for `web`, `roblox`, `unreal`, `godot`, or `cocos`. Then run the audit: `$cl-audit` in Codex, `/cl-audit` in Cursor and Antigravity, or ask Copilot to "run cl-audit".

## Benchmark

One task, run in Claude Code with and without the kit: get a small web game ready for the Poki portal. Of ten builds made with the Builder edition, nine passed all 24 readiness checks. Of ten made without the kit, none did. In the version benchmarked, the Builder edition's preflight tested 20 of those 24 rules, which is most of the gap, and the report says so. The free core wasn't benchmarked. [Read the report](docs/benchmarks/ship-to-poki/REPORT.md).

## Get Builder or Studio

1. Sponsor on [GitHub Sponsors](https://github.com/sponsors/crunchless-kits) with a one-time payment: $10 for Builder or $100 for Studio. The repository invitation goes to the GitHub account you sponsor with, so use the one you'll install from.
2. Accept the invitation to `crunchless-kits/agentic-gamedev-builder` or `crunchless-kits/agentic-gamedev-studio`.
3. Install from that repository. Its README has the same steps, with its own repository and plugin names.

## More

- ROSTER.md lists every skill, agent, and command in this edition.
- FRESHNESS.md shows when the kit last checked each store's rules and each SDK's current version, since those change often.
- CHANGELOG.md holds the release notes.
- docs/benchmarks/ holds the benchmark reports, with every build and score.
- Ask questions in GitHub Discussions on [crunchless-kits/agentic-gamedev](https://github.com/crunchless-kits/agentic-gamedev).

## License

MIT. See LICENSE.
