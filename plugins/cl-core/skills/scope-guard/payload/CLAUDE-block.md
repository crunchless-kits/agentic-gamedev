## Scope guard

Scope: {{SCOPE}}
Line budget for this session: {{BUDGET}} changed lines (added plus deleted, excluding build output and lockfiles).

- Build only what the scope line names. Before adding a file, a dependency, a config, or a doc, stop and ask.
- Comments: none that explain what code does; short labels for sections of long methods only.
- Review findings are failure paths. "No findings." is valid. A fix never adds files or dependencies.
- Review loop: stop at the first clean review or after two rounds.
- Run `/scope-check` before a commit or when the stop hook blocks; cut the extras it names.
