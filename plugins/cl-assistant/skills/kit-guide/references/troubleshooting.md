# Troubleshooting

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| A member named in the routing table is not available | It is in Builder or Studio and not installed, or its plugin is not installed | `/cl-help` shows what is installed; install the plugin or the Builder or Studio marketplace |
| Everything runs on the expensive model | `CLAUDE_CODE_SUBAGENT_MODEL_FORCE=1` is set, or an inline skill ran in the main conversation | Unset the force variable; use the forked skills or ask for `cl-builder` by name |
| Effort pins seem ignored | `CLAUDE_CODE_EFFORT_LEVEL` is set session-wide, or the Claude Code version predates frontmatter effort | Unset the variable; update Claude Code; check `/tasks` for the running effort |
| Guard hook does not block anything | Vendored install without the settings entry, or plugin hooks disabled | Add the `PreToolUse` entry from the README; for scope guard, re-run the seeder |
| Scope guard blocks a legitimate file | Path outside `allowNew` or a denied pattern | Edit `.claude/scope-guard.json`; the message names the key |
| Stop keeps being blocked | Changed lines over budget | Run `/scope-check`, cut extras, or raise the budget deliberately |
| Portal skill stops with TODO(verify) | No web access, or the live docs moved | Provide the docs, run with web access, or re-verify the snapshot |
| Snapshot older than 90 days | Monthly refresh not merged or not running | `node scripts/verify_refs.mjs --fetch --fingerprint --write`; merge the refresh pull request |
| Installer reports conflicts | You edited vendored files | Review the files, re-run with `--force` to overwrite, or keep your edits |
| Registry check fails | Frontmatter name, tier, or description problem | The message names the file; fix and re-run `node scripts/registry.mjs` |
| Slop scan flags a deliberate choice | The style guide does not name it | Add the choice to the house rules "Design tells we allow on purpose" section |
| A bare `/cl-ask` or `/cl-audit` is not found | Plugin commands are namespaced by plugin | Use `/cl-assistant:cl-ask`, `/cl-core:cl-audit`, or type the name in the command menu; vendored installs use the bare form |
| `/cl-start` says idea stage for a real project | Plain JavaScript with no `package.json`, or two engines in one repo | Pass what you are building as the argument; `index.html` plus `.js` files counts as a web game |
| `/cl-start` recommends the wrong bundle | Engine detection found two engines or none | Pass what you are building as the argument |
