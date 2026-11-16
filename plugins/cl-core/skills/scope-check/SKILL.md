---
name: scope-check
description: "Check the change set against the scope line and line budget: what grew, what to cut. Use before a review or commit, or when a task keeps growing."
tier: free
tags: ["production", "qa"]
---

# Scope check

Over-building is the default failure of coding agents: a small check grows tenfold, a hello-world repo gains CI, Docker, and a contributor guide. This check compares what exists to what was asked and names the cut.

Run profile: router.

## Procedure

1. Read the scope line and budget from the `CLAUDE.md` scope-guard block (or `.claude/scope-guard.json`); if neither exists, ask for the scope in one sentence.
2. Measure: `git diff --stat` against the session baseline (`.git/scope-guard/<session id>` when the hook recorded one, otherwise the last commit), plus untracked files. Count added plus deleted lines, minus excluded globs.
3. Classify every changed file: asked (serves the scope line), needed (required for the asked change to work), extra (anything else: tooling, config, docs, tests beyond the asked behavior, abstractions for later).
4. Report in five lines: scope line; lines changed versus budget; asked, needed, extra counts; the extras to remove; the one next action.
5. If the extras exist because a reviewer asked for them, say so; a fix rule in the block says a review finding never adds a new file or dependency without the user.

## Output

```
Scope: <line>
Changed: <n> of <budget> lines
Asked <n> | needed <n> | extra <n>
Cut: <files>
Next: <action>
```
