#!/usr/bin/env bash
# Interleaved A/B runs of the Coin Dash audit. Arm A: no kit. Arm B: the web bundle as --plugin-dir.
B="$(cd "$(dirname "$0")" && pwd)"
KIT="$B/../../../plugins"
# Safety: the fixture must be its own git repo, or the resets below would hit the kit repo.
[ -d "$B/fixture/.git" ] || { echo "Run first: cd fixture && git init && git add -A && git commit -m fixture"; exit 1; }
BRIEF="Audit this game project before it goes to web portals. Give me a ranked list of the most important problems to fix, each with the file path and line. Do not edit any files."
PLUGS=""
for p in cl-core cl-assistant cl-web cl-design cl-qa cl-release cl-platforms cl-ci; do PLUGS="$PLUGS --plugin-dir $KIT/$p"; done
for n in 1 2 3; do
  for arm in A B; do
    cd "$B/fixture" && git reset -q --hard HEAD && git clean -qfdx
    extra=""; [ "$arm" = B ] && extra="$PLUGS"
    echo "start $arm$n $(date +%T)"
    env -u CLAUDE_CODE_CHILD_SESSION -u CLAUDE_CODE_MESSAGING_SOCKET -u CLAUDE_CODE_MESSAGING_TOKEN -u CLAUDE_CODE_SIMPLE \
        -u CLAUDE_CODE_ENTRYPOINT -u CLAUDE_CODE_SESSION_ID -u CLAUDE_CODE_HOST_SESSION_ID -u CLAUDE_CODE_SDK_HAS_HOST_AUTH_REFRESH \
        -u CLAUDE_EFFORT -u CLAUDE_CODE_SESSION_ATTENDED -u CLAUDE_CODE_SUBAGENT_MODEL -u CLAUDE_CODE_EFFORT_LEVEL \
      timeout 900 claude -p "$BRIEF" --model sonnet --setting-sources project --strict-mcp-config \
        --dangerously-skip-permissions --no-session-persistence --max-budget-usd 4 \
        --output-format stream-json --verbose $extra > "$B/runs/audit-$arm-$n.jsonl" 2> "$B/runs/audit-$arm-$n.err"
    echo "end $arm$n exit $? $(date +%T)"
    (cd "$B/fixture" && git status --porcelain > "$B/runs/audit-$arm-$n.dirty")
  done
done
echo done
