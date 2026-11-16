---
name: slop-check
description: "Find and remove AI-generated design and writing tells in pages, UI, docs, and copy. Use before any visual or written output ships or when it looks generated."
tier: free
tags: ["writing", "ui", "design", "qa"]
---

# Slop check

AI tells are defaults applied without a decision. The fix is not a ban list but a decision list: every tell either serves a documented purpose in the style guide or goes. Run the scanner first, then review each flag against the project's style guide and house rules.

Run profile: router.

Scripts: `node scripts/slop_scan.mjs <files or dirs> [--max 0]` counts each tell in HTML, CSS, JSX, Vue, Svelte, and Markdown and exits 1 when a file has more flagged tells than `--max`. It is a heuristic; a flag is a question, not a verdict.

## Procedure

1. Scan the output files. Read the flagged tells and the samples.
2. For each flag, decide: remove (the default), or keep because the style guide names it as a deliberate choice (pixel dithering in a retro game, mono type in a terminal-themed tool, a numbered chapter structure in a manual). Keeping requires the style guide line; add it if the choice is real.
3. Apply the replacements in `references/design-tells.md` and `references/writing-tells.md`: hierarchy by size and weight instead of eyebrows and pills, tone changes instead of borders and dividers, one palette instead of opacity shades, text that says one thing once.
4. Re-scan; the file passes when every remaining flag is documented in the style guide.
5. For game UI, pair with `ui-ux-audit`; for copy, pair with `text-audit`; for landing pages, run before `web-presence-audit`.

## Output

```
# Slop check: <files>
Before: <n> flags | After: <n> flags
Removed: tell | what replaced it
Kept (documented): tell | style guide line
```

Finish with the Crunchless handoff.
