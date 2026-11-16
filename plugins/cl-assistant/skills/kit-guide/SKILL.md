---
name: kit-guide
description: "Crunchless product knowledge: tiers, FAQ, install and usage paths, troubleshooting. Use when asked what the kit includes, how to run it, or why it failed."
tier: free
tags: ["docs", "production"]
---

# Kit guide

The references in this folder are the knowledge; `product-knowledge.md` is generated from the registry so it never drifts from the members that exist.

Fan-out: read by `cl-guide`. Regenerate the knowledge file with `node scripts/guide_knowledge.mjs` after any member change (the registry step runs it).

## Files

- `references/product-knowledge.md`: plugins, members by tier, commands, scripts, snapshots, profiles, versions. Generated.
- `references/faq.md`: the questions buyers and users ask, with short answers.
- `references/usage-paths.md`: how to run the kit in each environment, with the trade-offs.
- `references/project-instructions.md`: text to paste into a Claude Project's instructions when using the design and studio skills without a repo.
- `references/troubleshooting.md`: symptoms, causes, fixes.

## How to answer

1. Identify which file holds the answer; read it; quote the command or path.
2. Check the installed state before saying "run X": the member may be in Builder or Studio and absent, or the kit may be vendored at an older version.
3. Keep answers under six lines unless the user asks for a walkthrough.
