#!/usr/bin/env bash
# Ship to Poki benchmark runner.
#   bash run.sh setup                 build base-A and base-B
#   bash run.sh one <model> <arm> <n> one run, in a fresh copy of the arm's base
#   bash run.sh batch <model> <first> <last>   arms A and B side by side, runs first..last
B="$(cd "$(dirname "$0")" && pwd)"
KITREPO="$(cd "$B/../../../.." && pwd)"
BRIEF="We're submitting Skyhop to Poki next week. Get it ready: fix whatever would get it rejected or would break it on the portal. When you're done, tell me what you changed and what is still open."

setup() {
  [ -e "$B/base-A" ] && { echo "bases exist"; return; }
  mkdir -p "$B/runs" "$B/work" "$B/scores"
  cp -r "$KITREPO/docs/benchmarks/ship-to-poki/fixture" "$B/base-A"
  cp -r "$KITREPO/docs/benchmarks/ship-to-poki/fixture" "$B/base-B"
  (cd "$KITREPO/dist/builder" && node scripts/install.mjs --project "$B/base-B" --bundle web) | tail -4
  for arm in A B; do (cd "$B/base-$arm" && git init -q -b main && git add -A && git -c user.email=bench@local -c user.name=bench commit -qm "Skyhop 0.9.0" && echo "base-$arm $(git rev-parse --short HEAD) $(git ls-files | wc -l) files"); done
}

one() { # model arm n
  local model=$1 arm=$2 n=$3 id="$1-$2-$3"
  local dir="$B/work/$id"
  [ -e "$dir" ] && { echo "skip $id (exists)"; return; }
  cp -r "$B/base-$arm" "$dir"
  echo "start $id $(date +%T)"
  ( cd "$dir" && env -u CLAUDE_CODE_CHILD_SESSION -u CLAUDE_CODE_MESSAGING_SOCKET -u CLAUDE_CODE_MESSAGING_TOKEN -u CLAUDE_CODE_SIMPLE \
      -u CLAUDE_CODE_ENTRYPOINT -u CLAUDE_CODE_SESSION_ID -u CLAUDE_CODE_HOST_SESSION_ID -u CLAUDE_CODE_SDK_HAS_HOST_AUTH_REFRESH \
      -u CLAUDE_EFFORT -u CLAUDE_CODE_SESSION_ATTENDED -u CLAUDE_CODE_SUBAGENT_MODEL -u CLAUDE_CODE_EFFORT_LEVEL \
    timeout 1800 claude -p "$BRIEF" --model "$model" --setting-sources project --strict-mcp-config \
      --dangerously-skip-permissions --no-session-persistence --max-budget-usd 10 \
      --output-format stream-json --verbose > "$B/runs/$id.jsonl" 2> "$B/runs/$id.err" )
  echo "end $id exit $? $(date +%T)"
  ( cd "$dir" && git add -A -N . 2>/dev/null; git diff --stat -- . ':!.claude' ':!CLAUDE.md' | tail -1 > "$B/runs/$id.stat" )
}

case "$1" in
  setup) setup ;;
  one) one "$2" "$3" "$4" ;;
  batch) for arm in A B; do ( for n in $(seq "$3" "$4"); do one "$2" "$arm" "$n"; done ) & done; wait; echo "batch $2 $3-$4 done" ;;
  *) echo "usage: setup | one <model> <arm> <n> | batch <model> <first> <last>" ;;
esac
