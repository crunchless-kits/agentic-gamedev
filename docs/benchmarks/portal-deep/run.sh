#!/usr/bin/env bash
# Skyhop portal benchmark: tasks T1 (audit), T2 (go/no-go), T3 (scoped fix); arms A (no kit) and B (web bundle).
B="$(cd "$(dirname "$0")" && pwd)"
KIT="$B/../../../plugins"
[ -d "$B/fixture/.git" ] || { echo "fixture must be its own git repo"; exit 1; }
T1="Audit this game before we submit it to Poki next week. Give me a ranked list of the problems to fix, each with the file path and line. Do not edit any files."
T2="Is this build ready to submit to Poki? Give a go or no-go decision, with the evidence for each reason. Do not edit any files."
T3="Pressing space after game over sometimes restarts the run several times at once. Fix that bug with the smallest change, and tell me how you verified the fix."
PLUGS=""; for p in cl-core cl-assistant cl-web cl-design cl-qa cl-release cl-platforms cl-ci; do PLUGS="$PLUGS --plugin-dir $KIT/$p"; done
run() { # task model n arm brief
  local task=$1 model=$2 n=$3 arm=$4 brief=$5 id="$1-$2-$4-$3"
  cd "$B/fixture" && git reset -q --hard HEAD && git clean -qfdx
  local extra=""; [ "$arm" = B ] && extra="$PLUGS"
  echo "start $id $(date +%T)"
  env -u CLAUDE_CODE_CHILD_SESSION -u CLAUDE_CODE_MESSAGING_SOCKET -u CLAUDE_CODE_MESSAGING_TOKEN -u CLAUDE_CODE_SIMPLE \
      -u CLAUDE_CODE_ENTRYPOINT -u CLAUDE_CODE_SESSION_ID -u CLAUDE_CODE_HOST_SESSION_ID -u CLAUDE_CODE_SDK_HAS_HOST_AUTH_REFRESH \
      -u CLAUDE_EFFORT -u CLAUDE_CODE_SESSION_ATTENDED -u CLAUDE_CODE_SUBAGENT_MODEL -u CLAUDE_CODE_EFFORT_LEVEL \
    timeout 1200 claude -p "$brief" --model $model --setting-sources project --strict-mcp-config \
      --dangerously-skip-permissions --no-session-persistence --max-budget-usd 6 \
      --output-format stream-json --verbose $extra > "$B/runs/$id.jsonl" 2> "$B/runs/$id.err"
  echo "end $id exit $? $(date +%T)"
  (cd "$B/fixture" && git diff > "$B/runs/$id.diff" && git status --porcelain > "$B/runs/$id.status")
}
for n in 1 2 3; do
  for arm in A B; do run T1 sonnet $n $arm "$T1"; done
  for arm in A B; do run T2 sonnet $n $arm "$T2"; done
  for arm in A B; do run T3 sonnet $n $arm "$T3"; done
  for arm in A B; do run T1 haiku $n $arm "$T1"; done
done
echo done
