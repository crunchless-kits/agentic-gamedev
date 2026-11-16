# Skyhop Portal Benchmark: Results, 16 Nov 2026

**Role: HANDS OFF.** Results of the second with-and-without benchmark of the kit in Claude Code. The tasks, arms, and scoring are in `RUBRIC.md`, committed before any run (commit 154722d). The site's benchmark section quotes this file.

## Setup

- **Fixture:** Skyhop, a seven-module web platformer about to go to Poki, with 16 planted problems. Ten of them are specific to Poki.
- **Arms:** three runs per arm per task, interleaved. Arm B adds the web bundle as `--plugin-dir`.
- **Environment:** Claude Code 2.1.319, headless, with the same flags in both arms.
- **Session models:** Sonnet (`claude-sonnet-5-5`) for all three tasks. The audit also ran with Haiku (`claude-haiku-5-5`).
- **Scoring:** a judge on Opus read each T1 and T2 answer under a random ID and checked it against the source. Kit member names were masked before judging. Scripts checked the T3 diffs.
- **Records:**
  - Judge scores: `scores-judge.json`, with IDs matched to runs in `blind-map.json`.
  - Answers and diffs: `answers/`.
  - Run script: `run.sh`.

## Results

### T1, Audit Before Submitting to Poki

| Measure | Sonnet, no kit | Sonnet, kit | Haiku, no kit | Haiku, kit |
|---|---|---|---|---|
| Planted problems found, all runs | 45 of 48 | **48 of 48** | 41 of 48 | **46 of 48** |
| Found per run | 14, 15, 16 | **16, 16, 16** | 13, 14, 14 | 15, 15, 16 |
| Poki problems found, all runs | 28 of 30 | **30 of 30** | 25 of 30 | **29 of 30** |
| Claims the code or Poki's docs don't support | 0 | 4 | 12 | **0** |
| Findings citing a file and line (median) | 95% | 100% | 89% | **100%** |
| Findings with a concrete fix (median) | 67% | 67% | 30% | 26% |
| Real problems found beyond the planted 16 (median) | 5 | 4 | 8 | 7 |
| Raw tokens per run (median) | 78,602 | 121,356 | 118,079 | 135,512 |
| Time per run (median) | 26 s | 32 s | 43 s | 48 s |

### T2, Go or No-Go for Poki (Sonnet)

| Measure | No kit | Kit |
|---|---|---|
| Correct no-go decision | 3 of 3 | 3 of 3 |
| Said what it could not verify | 3 of 3 | 3 of 3 |
| Planted problems named, all runs | 36 of 48 | **42 of 48** |
| Poki problems named, all runs | 25 of 30 | **27 of 30** |
| Reasons backed by file evidence (median) | 36% | **75%** |
| Claims the code or Poki's docs don't support | 2 | 1 |
| Raw tokens per run (median) | 77,804 | 118,078 |
| Time per run (median) | 17 s | 20 s |

### T3, Scoped Fix of the Stacked-Restart Bug (Sonnet)

| Measure | No kit | Kit |
|---|---|---|
| Bug fixed (listeners bound once) | 3 of 3 | 3 of 3 |
| Files changed outside the fix | 0 | 0 |
| Lines changed | 8, 8, 2 | 8, 8, 2 |
| Raw tokens per run (median) | 101,591 | 116,832 |
| Time per run (median) | 15 s | 16 s |

Both arms produced the same diffs, so this task doesn't separate them.

## Replication, Ten Audits per Arm

The first run had three audits per arm. The replication repeated the audit task (T1) with ten new runs per arm per model. Its plan was added to `RUBRIC.md` before the runs (a6abe5a). One judge on Opus scored all 40 answers blind, this time with Poki's rules from `developers.poki.com` in hand. Records are in `replication/`.

| Measure | Sonnet, no kit | Sonnet, kit | Haiku, no kit | Haiku, kit |
|---|---|---|---|---|
| Audits that found all 16 planted problems | 4 of 10 | **9 of 10** | 1 of 10 | **6 of 10** |
| Planted problems found, all audits | 152 of 160 | **159 of 160** | 138 of 160 | **152 of 160** |
| Poki problems found, all audits | 97 of 100 | **100 of 100** | 90 of 100 | **94 of 100** |
| Unsupported claims, all audits | 14 | **4** | 26 | **10** |
| Audits with no unsupported claim | 0 of 10 | **7 of 10** | 0 of 10 | **8 of 10** |
| Findings citing a file and line | 96% | 99% | 97% | 99% |
| Raw tokens per run (median) | 76,772 | 120,941 | 145,904 | 136,723 |
| Time per run (median) | 25 s | 36 s | 46 s | 48 s |

- **The first run's pattern held with more runs.** With the kit, Sonnet found every planted problem in 9 of 10 audits, against 4 of 10 without. On Haiku it was 6 of 10 against 1 of 10.
- **The kit's audits made fewer unsupported claims.** Every audit without the kit made at least one: a line number that doesn't exist, or a Poki rule that Poki's docs don't state. Most kit audits made none. Haiku's 10 with the kit all came from two runs that cited lines that don't exist.
- **The problem missed most was the hidden-tab pause.** Without the kit it was missed in 5 of 10 Sonnet audits and 9 of 10 Haiku audits. With the kit it was missed once on each model.
- **The kit's audit skill did not always run.** In this arm the kit was loaded with `--plugin-dir`. The session chose the audit skill in 7 of 10 Sonnet runs and 3 of 10 Haiku runs.
- **Counts of unsupported claims can't be pooled with the first run.** The first judge had no copy of Poki's rules, and those counts were rechecked by hand to a different bar. Counts of planted problems use the same list in both rounds. Pooled, Sonnet found 197 of 208 without the kit and 207 of 208 with it, and Haiku found 179 of 208 and 198 of 208.

## What the First Run Showed

- **With the kit, Sonnet found every planted problem in every audit run.** That was 48 of 48 in total. Without the kit, the count varied from 14 to 16 per run.
- **The kit helps the small model most.** Haiku with the kit found 46 of 48 planted problems and made no unsupported claim. Without the kit, Haiku found 41 of 48 and made 12. Eleven of those 12 came from one run that cited lines that don't exist.
- **The kit's go or no-go answers carry their evidence.** A median of 75% of reasons pointed at a file, against 36% without the kit.
- **The kit doesn't change a small, well-scoped fix.** Both arms made identical edits.
- **Every kit arm used more tokens and took a few seconds longer.** Sonnet audits used 1.54 times the tokens of the arm without the kit. The other arms used 1.15 to 1.52 times as many.
- **Sonnet with the kit made more unsupported claims in its audits: 4 against 0.** All four were statements about Poki policy that Poki's docs don't back, such as a required mute control or a recommended storage API.

## Limits

- One fixture, three runs per arm. Medians of three move with a single run.
- The judge masked member names, but the answer formats can still hint at the arm.
- The judge had no copy of Poki's rules. Its counts of unsupported claims were rechecked by hand against Poki's docs.
- The runs used the founder's subscription login, not an isolated API key. Four user-level plugins loaded in both arms.

## Changelog

- 2026-11-16: First run and report.
- 2026-11-16: Corrected the unsupported-claims rows. The judge had no copy of Poki's rules and counted "Poki blocks external requests" as unsupported. Poki's External resources policy says exactly that, so I rechecked every flagged claim against `developers.poki.com` (`claims-recheck.json`). Sonnet audits moved from 3 and 5 to 0 and 4, and the go or no-go task from 4 and 3 to 2 and 1. Haiku did not change.
- 2026-11-16: Replication added: ten audits per arm per model, judged with Poki's rules in hand.
