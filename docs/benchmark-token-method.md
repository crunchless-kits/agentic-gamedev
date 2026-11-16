# Benchmark Token Method

**Role: INSTRUCTS.** How to measure token use and cost fairly for the same game-dev tasks run with and without Crunchless, and how to report quality next to it. Uses Claude Code's headless `stream-json` output. Cost figures are estimates at list price, never invoices.

## What a Run Is

One run is one headless Claude Code session on one task brief in one fixture repository:

```
claude -p "<brief>" --output-format stream-json --verbose --model <model> [kit flags] > runs/<task>-<arm>-<n>.jsonl
```

- **Arm A, no kit:** the fixture repo with no `.claude/` folder and no `--plugin-dir`.
- **Arm B, kit:** the same fixture with the bundle installed (`node scripts/install.mjs --project <fixture> --bundle <name>`), or the same plugins passed as `--plugin-dir <kit>/plugins/<plugin>` for each bundle member. Pick one mode per study and say which.
- Everything else is identical: the brief text, `--model`, the default session effort (set it in neither arm), allowed tools (`--allowedTools`), permission mode, Claude Code version, and the fixture's starting commit.

## Fairness Rules

1. **Isolate the config.** Point `CLAUDE_CONFIG_DIR` at a fresh empty folder for every run, authenticated with `ANTHROPIC_API_KEY`. The platform test (`.claude/docs/ai/crunchless/v015/reviews/platform-test-2026-11-15.md`) found that a founder's global plugins and MCP tools load alongside `--plugin-dir` and inflate cost. No user `CLAUDE.md`, plugins, or MCP servers in either arm.
2. **Same starting state.** Reset the fixture with `git reset --hard <commit> && git clean -fdx` (in the scratch fixture only) before each run.
3. **Pin the environment.** Unset `CLAUDE_CODE_SUBAGENT_MODEL`, `CLAUDE_CODE_SUBAGENT_MODEL_FORCE`, and `CLAUDE_CODE_EFFORT_LEVEL`, since each overrides the kit's frontmatter pins. Record `claude --version` and `system.init.claude_code_version`.
4. **Same session model.** Both arms start on the same `--model`. The kit's subagents and forks then run on their pinned models (haiku, sonnet, opus); that difference is the thing being measured, so keep it, and report it per model.
5. **Interleave arms.** Run A, B, A, B, and so on, at least 3 runs per arm per task, to spread rate limits and cache timing evenly.
6. **No human in the loop.** Headless only. A run that stops to ask a question counts as a fail for quality, and its tokens still count.

## What to Read From Each Run

The final event in the `.jsonl` file has `"type": "result"`. Read:

| Field | Meaning |
| --- | --- |
| `usage.input_tokens` | Uncached input tokens for the main session |
| `usage.cache_creation_input_tokens` | Input tokens written to the prompt cache |
| `usage.cache_read_input_tokens` | Input tokens read from the prompt cache |
| `usage.output_tokens` | Output tokens, including thinking |
| `modelUsage.<model id>` | Per-model totals for the whole session, subagents and forks included: `inputTokens`, `outputTokens`, `cacheReadInputTokens`, `cacheCreationInputTokens`, `costUSD` |
| `total_cost_usd` | Claude Code's own cost estimate for the run |
| `num_turns`, `duration_ms` | Turns and wall time |

Use `modelUsage` for totals, since `usage` covers the main session only. The `system` init event lists the loaded `agents`, `skills`, and `plugins`; keep it as proof of what each arm loaded. `task_started.subagent_type` events show which agents ran.

Extract with Node 22 (no dependencies):

```
node -e "const l=require('fs').readFileSync(process.argv[1],'utf8').trim().split('\n').map(JSON.parse);const r=l.findLast(e=>e.type==='result');console.log(JSON.stringify({usage:r.usage,modelUsage:r.modelUsage,cost:r.total_cost_usd,turns:r.num_turns,ms:r.duration_ms}))" runs/<file>.jsonl
```

## Cache Effects

- The first run after a gap writes the cache (`cache_creation`); runs within the cache lifetime read it (`cache_read`). The kit's fixed prompt text (router, skill listing, agent prompts) caches well, so back-to-back B runs look cheaper than a cold B run.
- Report two totals per run:
  - **Raw tokens:** input + cache creation + cache read + output, summed across `modelUsage`.
  - **Billed-weight tokens:** each class weighted by its list-price ratio to base input (cache writes cost more than base input, cache reads much less). Take the ratios from the pricing page on the day of the study.
- Either start every run cold (wait past the cache lifetime between runs) or run both arms warm in the same interleaved order. State which.

## Cost

`estimated cost = sum over models and token classes (tokens / 1,000,000 × list price per million)`

- Use the published per-model list prices from <https://www.anthropic.com/pricing> on the study date, and write that date next to the table.
- Label every figure "estimated, list price". Compare it with `total_cost_usd`; if they differ by more than 5%, report both and say why.
- Never adjust a figure to look better. A failed or aborted run keeps its tokens.

## Quality

Score each run before looking at its token numbers, with the arm hidden where possible:

- **Pass checks:** the task's own tests, type check, build, and smoke test, run by a script. Pass or fail.
- **Rubric:** 3 to 5 criteria per task, each 0 to 2, written before any run (for example: correct cause found, no unrequested files, handoff evidence true).
- **Report quality per cost:** rubric points per 100K raw tokens and per estimated dollar, next to the raw numbers.

## Results Template

Study: `<name>` · Claude Code `<version>` · session model `<model>` · bundle `<name>` · install mode `<plugin-dir | vendored>` · cache `<cold | warm interleaved>` · prices as of `<date>`

| Task | Arm | Run | Pass | Rubric (of N) | Raw tokens | Billed-weight tokens | Haiku tokens | Sonnet tokens | Opus tokens | Est. cost (list) | `total_cost_usd` | Turns | Wall time |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `<task>` | A no kit | 1 | | | | | | | | | | | |
| `<task>` | B kit | 1 | | | | | | | | | | | |

Summary per task (median of runs):

| Task | Arm | Pass rate | Median rubric | Median raw tokens | Median est. cost | Rubric per 100K tokens | Change vs A |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `<task>` | A | | | | | | baseline |
| `<task>` | B | | | | | | |

Notes: anything that broke the method (a run that asked a question, a rate limit, a cache miss), each with its run file.

## Changelog

- 2026-11-15: First version.
