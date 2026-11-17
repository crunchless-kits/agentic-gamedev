---
description: "Turn a task into a phased plan with checks per phase and a Not Doing list, then refine it or build it one phase at a time. Use before a change that spans files or sessions."
model: sonnet
effort: medium
argument-hint: [task, ticket, or file] | --iterate <plan> <feedback> | --next <plan>
tier: free
tags: ["production", "design"]
---

Plan a change to this game. Request: $ARGUMENTS (when empty, ask one question: what is changing, and what will be true when it's done?)

Run profile: router. Fan-out: up to three `cl-scout` agents for facts; this command writes the plan itself. It changes no game files.

## Make a Plan

1. **Load the bar.** Read the request or ticket, the spec or GDD for the system (`docs/SPEC.md`, `design/`), the project profile (`docs/crunchless.profile.json`), and `.cl/house/` when present. Detect the engine with `node "${CLAUDE_PLUGIN_ROOT}/scripts/detect-engine.mjs" .`.
2. **Research before writing.** Launch scouts in parallel, one question each: where the code for this lives (files and entry points as `file:line`), how it works today, and an existing pattern in the repo to follow. Facts only. Read every file a scout names before the plan relies on it.
3. **Settle decisions with the user.** Put each open decision to the user one at a time, with your recommended answer, until none is left. Don't ask what the code or the spec already answers.
4. **Write the plan** to `.cl/plans/YYYY-MM-DD-<topic>.md` in the shape below. Keep phases small enough to review on their own, ordered so the game still runs after each one. Five phases at most; split bigger work into two plans.
5. **Checks for every phase.** Automated checks are commands an agent can run: the engine's test runner, a build, a lint, `web-portal-preflight` for web games. Manual checks are what a person does: play the level, try it on a phone, listen to the mix. Take every command from the repo (package scripts, Makefile, CI files, the engine's test runner) or mark it `TODO(verify)`. Never invent one. If the project has no automated checks, say so in the phase and suggest the engine's test-hooks skill. For a web game headed to a portal, set up `web-portal-preflight` in phase 1 and run it in every phase's checks, since it is the strongest automated check the kit has; a failing count that drops phase by phase is progress.
6. **Not Doing.** List what the plan leaves out on purpose, so the build doesn't grow past it.
7. **No open questions.** A plan with an unanswered question stays `Status: draft`, with the question at the top.
8. **Show the summary**: goal, phases, and each phase's checks. Then name the next step: `/cl-plan --next <plan>` to build phase 1, and after each phase `/cl-review --plan <plan>` (Builder) or the `scope-check` skill (free).

## Refine a Plan: `--iterate <plan> <feedback>`

1. Read the whole plan first.
2. Research only when the feedback needs facts the plan doesn't have.
3. Restate the change in five lines at most. When it changes scope, confirm with the user before editing.
4. Edit only the sections the feedback touches. Keep phase numbers stable, never tick a check that hasn't passed, and move anything cut into Not Doing.
5. Add a line to the plan's changelog.

## Build the Next Phase: `--next <plan>`

1. Find the first phase with an unticked check.
2. Hand that phase to `cl-builder` with the plan's absolute path and the phase number. The builder changes only what the phase lists.
3. Run the phase's automated checks. Tick the ones that pass, and paste the failing output for the rest.
4. List the phase's manual checks for the user, and stop. Start the next phase only after the user confirms them.
5. Set `Status: in progress`, or `done` when every check in every phase is ticked.

## Plan Shape

```
# Plan: <change>
Status: draft | ready | in progress | done
Goal: <one line>. Done when: <what a player or tester can see>
Engine: <engine and version>. Spec: <path or none>

## Now
<how it works today, with file:line>

## Not Doing
- <left out on purpose>

## Phase 1: <name>
Changes:
- <file>: <what changes>
Automated checks:
- [ ] `<command>`: <expected result>
Manual checks:
- [ ] <what to try>: <expected result>

## Phase 2: <name>
...

## Risks
- <risk>: <the cheapest test that settles it>

## Changelog
- YYYY-MM-DD: <created, or what changed>
```

## Rules

- The plan describes the change; the builder makes it. This command edits only files under `.cl/plans/`.
- Every claim about current code has a `file:line` that was read in this session.
- A check passes only on output seen in this session. Write "not run" otherwise.

End with the Crunchless handoff.
