#!/usr/bin/env bash
# Replication of the Skyhop audit (task T1): 10 runs per arm per model, arms side by side.
#   bash rep.sh <model>
B="$(cd "$(dirname "$0")" && pwd)"
KIT="$B/../../../plugins"
T1="Audit this game before we submit it to Poki next week. Give me a ranked list of the problems to fix, each with the file path and line. Do not edit any files."
PLUGS=""; for p in cl-core cl-assistant cl-web cl-design cl-qa cl-release cl-platforms cl-ci; do PLUGS="$PLUGS --plugin-dir $KIT/$p"; done
mkdir -p "$B/rep-runs" "$B/rep-work"
one() { # model arm n
  local model=$1 arm=$2 n=$3 id="R1-$1-$2-$3"
  [ -e "$B/rep-runs/$id.jsonl" ] && { echo "skip $id"; return; }
  local dir="$B/rep-work/$id"; cp -r "$B/fixture" "$dir"
  local extra=""; [ "$arm" = B ] && extra="$PLUGS"
  echo "start $id $(date +%T)"
  ( cd "$dir" && env -u CLAUDE_CODE_CHILD_SESSION -u CLAUDE_CODE_MESSAGING_SOCKET -u CLAUDE_CODE_MESSAGING_TOKEN -u CLAUDE_CODE_SIMPLE \
      -u CLAUDE_CODE_ENTRYPOINT -u CLAUDE_CODE_SESSION_ID -u CLAUDE_CODE_HOST_SESSION_ID -u CLAUDE_CODE_SDK_HAS_HOST_AUTH_REFRESH \
      -u CLAUDE_EFFORT -u CLAUDE_CODE_SESSION_ATTENDED -u CLAUDE_CODE_SUBAGENT_MODEL -u CLAUDE_CODE_EFFORT_LEVEL \
    timeout 1200 claude -p "$T1" --model "$model" --setting-sources project --strict-mcp-config \
      --dangerously-skip-permissions --no-session-persistence --max-budget-usd 6 \
      --output-format stream-json --verbose $extra > "$B/rep-runs/$id.jsonl" 2> "$B/rep-runs/$id.err" )
  echo "end $id exit $? $(date +%T)"
}
for arm in A B; do ( for n in $(seq 1 10); do one "$1" "$arm" "$n"; done ) & done; wait; echo "rep $1 done"
