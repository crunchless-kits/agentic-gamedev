---
description: "Say what the kit can do for a goal, engine, platform, or service, and the next command. Use when unsure which member fits or what is installed."
model: haiku
effort: low
argument-hint: [goal, topic, engine, platform, service, or member name]
tier: free
tags: ["help", "onboarding"]
---

Help the user use Crunchless. Request: $ARGUMENTS (when empty, give the overview).

Run profile: router. No subagents. Read files, don't guess.

## Sources

1. `${CLAUDE_PLUGIN_ROOT}/kit-index.json`: the kit version, edition, tiers, bundles, and one line per member with its tier, tags, and harness surface. `role: "hub"` marks each plugin's hub, the one listed skill that runs the rest; `invocable: false` marks a hidden member, and its `hub` names the hub that reaches it. In an edition, `upgrades` lists the Builder or Studio members it lacks, and `upgradeUrl` says where to get them. Read only this file for the catalog; never search above the plugin folder.
2. The skills, agents, and commands that are actually available in this session.
3. `${CLAUDE_PLUGIN_ROOT}/skills/cl-router/references/routing-table.md` for which member takes which task.

## Steps

1. **Classify the request.**
   - Empty: give the overview (step 2).
   - A goal ("make my game run on iPad", "add ads", "why are players leaving"): find the matching tags and routing rows.
   - A topic (an engine, platform, OS, service, or discipline): find the members whose `tags` include it in `kit-index.json`.
   - A member name: read that member's file.
2. **Overview.** Give one line per installed plugin: its hub, what it covers, and its member counts. List the plugins that aren't installed, each with its install command. Then give three starting commands for this project's stage:
   - `/cl-start` when you're unsure where to begin.
   - `/cl-brainstorm` for a new idea.
   - `/cl-audit` for an existing project.
   - `/cl-plan` for a change that spans files or sessions.
   - `/cl-ship` before release.
   - `/cl-producer` for planning.
   - `/cl-market` to turn this week's work into posts.
3. **Goal or topic.** Answer in at most six lines:
   - Which members do the job, in the order to run them. For a hidden member, say to ask in plain words (its hub picks it up) or to type `/<member>`; never call the Skill tool on it.
   - The exact command to type first.
   - Which members are in Builder or Studio, or not installed, with how to get them. Read each tier from `kit-index.json`.

   For a vibe coder, define any game dev term on first use.
4. **Command form.** Plugin installs are namespaced (`/cl-core:cl-audit`). Vendored installs are bare (`/cl-audit`). Name the kit version from `kit-index.json`.
5. **Hand-offs.** If the request is a task rather than a question, name the member and command, and offer to run it. Hand kit questions beyond the manifest (pricing, licensing, troubleshooting) to `/cl-ask`.

## Output

```
<answer>
Run: <first command>
Then: <next member or command>
Not installed: <member> (Builder, Studio, or plugin missing): <how to get it>
```
