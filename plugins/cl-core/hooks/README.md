# cl-core Hooks

Role: how the core guard hook works, what it catches, and the stronger layer to pair with it.

## The Guard Hook Is a Tripwire

`hooks.json` registers `scripts/guard-bash.mjs` as a PreToolUse hook on Bash and PowerShell. It splits each command with a small shell tokenizer (quotes, `;`, `&&`, `||`, pipes, `$( )`, and `bash -c`, `pwsh -Command`, or `cmd /c` bodies) and blocks the usual forms of these accidents:

- Recursive deletes (`rm -r`, `Remove-Item -Recurse` and its aliases `ri`, `rm`, `del`, `rd`, `rmdir`, cmd's `rd /s`, `rmdir /s`, `del /s`, and `find -delete`) unless every target sits inside the project under `node_modules`, `dist`, `build`, `out`, or `.cache`, or under `/tmp`.
- Force pushes, including `+refspec` pushes.
- Commands that throw away uncommitted work: `git reset --hard`, `git clean -f`, `git branch -D`, `git checkout .`, `git restore .`, and `git stash drop` or `clear`.

It is not a sandbox. Variables, scripts written to disk and then run, other interpreters such as `python -c`, and deliberate obfuscation get past it. The regression cases live in `scripts/guard-bash.test.mjs`; run `node plugins/cl-core/scripts/guard-bash.test.mjs`.

## The Stronger Layer: `permissions.deny`

Claude Code applies deny rules before any hook, to every subcommand of a compound command, including commands inside `$( )` and loop bodies, and PowerShell aliases match their cmdlet's rule. Add this to `.claude/settings.json` (shared) or `.claude/settings.local.json` (yours only), and merge it into any `permissions` block already there:

```json
{
  "permissions": {
    "deny": [
      "Bash(rm -rf /*)",
      "Bash(rm -rf ~*)",
      "Bash(git push --force *)",
      "Bash(git push -f *)",
      "Bash(git reset --hard *)",
      "Bash(git clean -f*)",
      "Bash(git branch -D *)",
      "Bash(git checkout .)",
      "Bash(git restore .)",
      "Bash(git stash drop *)",
      "Bash(git stash clear *)",
      "PowerShell(Remove-Item * -Recurse*)",
      "PowerShell(git push --force *)",
      "PowerShell(git reset --hard *)"
    ],
    "ask": [
      "Bash(rm -r *)",
      "Bash(rm -rf *)",
      "Bash(find * -delete*)",
      "Bash(rd *)",
      "Bash(rmdir *)"
    ]
  }
}
```

The `ask` rules prompt instead of refusing, so `rm -rf dist` still runs after one click. Claude Code's own docs say rules that constrain arguments are fragile: `rm -fr` or `rm -r -f` will not match `rm -rf *`. Deny rules stop the forms an agent usually writes; the hook catches more of the variants. Neither one replaces backups and pushed commits.

## Changelog

- 2026-11-15: Created with the v0.15 fix pass: tripwire scope, the deny and ask snippet.
