---
description: "Suggest a change to the kit itself: a missing skill, a wrong step, or a rule it should know. Logs it and, on your yes, files it on GitHub for the next update."
model: haiku
effort: low
argument-hint: [what the kit should do] | list
tier: free
tags: ["help", "production"]
---

Log a suggestion for the next Crunchless update. Request: $ARGUMENTS (when empty, ask one question: what should the kit do that it didn't?)

Run profile: router. No subagents. Changes no game files.

The public tracker is `crunchless-kits/agentic-gamedev`, label `suggestion`.

1. `list`: print `.cl/suggestions.md` when it exists, then run `gh issue list --repo crunchless-kits/agentic-gamedev --label suggestion --state open --limit 30`. When `gh` is missing or signed out, say so in one line and print the issues link. Stop there.
2. Shape the suggestion in at most five lines:
   - **Title**: under 70 characters, starting with a verb.
   - **What happened**: what the user asked for, and what the kit did or lacked.
   - **What it should do**: the change, in the user's words where possible.
   - **Touches**: the kit member it concerns, looked up in `${CLAUDE_PLUGIN_ROOT}/../cl-assistant/kit-index.json` when installed, or "new".
   - **Kit**: the version from `${CLAUDE_PLUGIN_ROOT}/.claude-plugin/plugin.json`, and the engine from `docs/crunchless.profile.json` when it exists.
3. Keep the project private. The tracker is public: leave out game names, code, file contents, people's names, keys, and anything from the house files. When the suggestion can't be understood without one of those, ask before keeping it.
4. Append it to `.cl/suggestions.md` under today's date with status `logged`. Create the file with a one-line header when missing.
5. Show the issue as it will be filed and ask one question: file it on GitHub? On yes, run `gh issue create --repo crunchless-kits/agentic-gamedev --label suggestion --title <title> --body <body>`, then set the log entry's status to the issue link. When the label is missing, file it without the label. When `gh` is missing or signed out, print the body in one code block and the link `https://github.com/crunchless-kits/agentic-gamedev/issues/new?labels=suggestion`.
6. End with one line: logged, filed with the link, or ready to paste.
