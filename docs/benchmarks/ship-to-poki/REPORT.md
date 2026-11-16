# Ship to Poki Benchmark: Results, 16 Nov 2026

**Role: HANDS OFF.** Results of the third with-and-without benchmark of the kit in Claude Code. The task, arms, checks, and scoring rules are in `RUBRIC.md`, committed with the test harness before any run (9bee56a) and amended once after the pilot, before any scored run (b07d990). The site's benchmark section quotes this file.

## The Short Version

Each agent got one brief: get the web game Skyhop ready to submit to Poki. The finished build was scored on 24 readiness checks drawn from Poki's own docs.

| | Sonnet, no kit | Sonnet, kit | Haiku, no kit | Haiku, kit |
|---|---|---|---|---|
| Readiness checks passed, five runs | 100 of 120 | **112 of 120** | 96 of 120 | **104 of 120** |
| Average per build, of 24 | 20.0 | **22.4** | 19.2 | **20.8** |
| Weakest build | 18 | **21** | 16 | **20** |
| Best build | 22 | **24** | 21 | **22** |
| Checks failed, five runs | 20 | **8** | 24 | **16** |
| Mobile checks passed (touch and scaling), of 10 | 0 | **9** | 5 | **10** |

The largest difference is mobile support, which Poki requires. Without the kit, no Sonnet build had touch controls or a canvas that scales. With the kit, four of five had full touch controls and all five scaled.

## Setup

- **Fixture:** Skyhop, a seven-module canvas platformer with the Poki SDK script tag in place and 16 planted problems.
- **Brief, the same in both arms:** "We're submitting Skyhop to Poki next week. Get it ready: fix whatever would get it rejected or would break it on the portal. When you're done, tell me what you changed and what is still open."
- **Arm A:** the game alone. **Arm B:** the game with the Builder edition (v0.15.0, commit 693b5c9) copied in by `node scripts/install.mjs --project <game> --bundle web`.
- **Runs:** five per arm per model, each in a fresh copy, two sessions at a time. Claude Code 2.1.319, headless, with the same flags in both arms.
- **Session models:** Sonnet (`claude-sonnet-5-5`) and Haiku (`claude-haiku-5-5`).
- **Scoring:**
  - Twenty checks ran in `harness/`, a fake browser with a mock Poki SDK. It scores the original game 1 of 20 and the reference fix 20 of 20.
  - Two judges, on Opus and Sonnet, each read every build and final message under a random ID. They scored the six judged checks and audited every scripted result against the code.
- **Records:** `results/` holds every build, the harness output for every run, both judges' files, the ID map, and the final score table.

## Each Check, Passes of Five

| # | Check | Sonnet, no kit | Sonnet, kit | Haiku, no kit | Haiku, kit |
|---|---|---|---|---|---|
| 1 to 6 | Plays normally, with an ad blocker, without the SDK, with requests blocked, without storage, and with a corrupt save | 5 each | 5 each | 5 each | 5 each |
| 7 | Loading finished | 5 | 5 | 3 | 5 |
| 8 | Start on first input | 3 | 5 | 3 | 4 |
| 9 | Stop on death | 5 | 5 | 5 | 5 |
| 10 | Break on restart, in order | 4 | 5 | 5 | 5 |
| 11 | Audio off during the break | 5 | 5 | 5 | 5 |
| 12 | Input held during the break | 5 | 5 | 5 | 5 |
| 13 | No page jump | 5 | 5 | 4 | 3 |
| 14 | No outgoing links | 5 | 5 | 5 | 5 |
| 15 | No insecure requests | 5 | 4 | 4 | 4 |
| 16 | Clean build | 5 | 5 | 5 | 5 |
| 17 | Touch controls | 0 | **4** | 2 | **5** |
| 18 | Scales to the screen | 0 | **5** | 3 | **5** |
| 19 | Frame-rate independent | 3 | 2 | 0 | 0 |
| 20 | Pauses when hidden | 1 | 2 | 0 | 0 |
| 21 | No stacked listeners | 5 | 5 | 5 | 5 |
| 22 | Music waits for a gesture | 5 | 5 | 4 | 5 |
| 23 | Oversized music flagged | 5 | 5 | 5 | 5 |
| 24 | Accurate final message | 4 | 5 | 3 | 3 |

## Verification Checks, Scored Apart

| # | Check | Sonnet, no kit | Sonnet, kit | Haiku, no kit | Haiku, kit |
|---|---|---|---|---|---|
| 25 | Checked Poki's live docs | 0 | 2 | 2 | 5 |
| 26 | Names its sources | 0 | 2 | 2 | 1 |
| 27 | Says what was not verified | 5 | 5 | 5 | 5 |

## Every Run

| Run | Readiness, of 24 | Scripted, of 20 | Scripted checks failed | Touch | Scales | Raw tokens | Seconds |
|---|---|---|---|---|---|---|---|
| Sonnet, no kit, 1 | 20 | 18 | 8, 20 | no | no | 239,002 | 70 |
| Sonnet, no kit, 2 | 22 | 20 | none | no | no | 137,041 | 47 |
| Sonnet, no kit, 3 | 19 | 17 | 10, 19, 20 | no | no | 164,812 | 36 |
| Sonnet, no kit, 4 | 21 | 19 | 20 | no | no | 168,057 | 45 |
| Sonnet, no kit, 5 | 18 | 17 | 8, 19, 20 | no | no | 132,568 | 37 |
| Sonnet, kit, 1 | 24 | 20 | none | yes | yes | 235,393 | 67 |
| Sonnet, kit, 2 | 22 | 18 | 19, 20 | yes | yes | 352,205 | 77 |
| Sonnet, kit, 3 | 22 | 18 | 19, 20 | yes | yes | 336,420 | 65 |
| Sonnet, kit, 4 | 21 | 18 | 19, 20 | no | yes | 422,683 | 108 |
| Sonnet, kit, 5 | 23 | 19 | 15 | yes | yes | 276,956 | 63 |
| Haiku, no kit, 1 | 20 | 17 | 13, 19, 20 | yes | yes | 529,839 | 149 |
| Haiku, no kit, 2 | 21 | 17 | 7, 19, 20 | yes | yes | 375,659 | 135 |
| Haiku, no kit, 3 | 16 | 15 | 8, 15, 19, 20, 22 | no | no | 352,144 | 67 |
| Haiku, no kit, 4 | 19 | 17 | 7, 19, 20 | no | no | 289,163 | 77 |
| Haiku, no kit, 5 | 20 | 17 | 8, 19, 20 | no | yes | 308,118 | 77 |
| Haiku, kit, 1 | 20 | 17 | 13, 19, 20 | yes | yes | 790,852 | 265 |
| Haiku, kit, 2 | 22 | 18 | 19, 20 | yes | yes | 698,815 | 194 |
| Haiku, kit, 3 | 20 | 17 | 15, 19, 20 | yes | yes | 966,812 | 231 |
| Haiku, kit, 4 | 22 | 18 | 19, 20 | yes | yes | 559,750 | 134 |
| Haiku, kit, 5 | 20 | 16 | 8, 13, 19, 20 | yes | yes | 1,096,209 | 162 |

Median raw tokens per run: Sonnet 164,812 without the kit and 336,420 with it; Haiku 352,144 and 790,852. Median time: Sonnet 45 and 67 seconds; Haiku 77 and 194 seconds.

## What It Shows

- **Builds made with the kit passed more readiness checks.** Sonnet went from 100 to 112 of 120, and Haiku from 96 to 104. The kit's Sonnet builds failed 8 checks in total against 20.
- **The kit's weakest build beat or matched most builds without it.** The lowest kit score on Sonnet was 21. Only two of five builds without the kit reached 21.
- **Mobile support is where the kit changed the outcome.** Poki asks for "Desktop, mobile, and tablet support". The kit's Poki notes list touch controls and scaling in their preflight, and the kit builds had them. Sonnet without the kit skipped both in every run.
- **One kit build passed all 24 checks.** No build without the kit did.
- **The kit kept the SDK lifecycle right more often.** `gameplayStart()` fired on first input in 9 of 10 kit builds against 6 of 10.

## What It Does Not Show

- **The kit didn't fix what neither arm tested.** Frame-rate independence and pausing in a hidden tab failed in most builds in both arms. No run played the game, so no run saw them.
- **The 20 scripted checks alone are close:** 93 against 91 of 100 on Sonnet, and 86 against 83 on Haiku. Most of the gap comes from the two mobile checks, which judges scored.
- **The kit's "verify first" rule was not followed every time.** Two of five Sonnet kit runs fetched Poki's docs. The other three worked from the kit's dated notes.
- **Three checks went slightly the other way:** no insecure requests on Sonnet (4 against 5), frame-rate independence on Sonnet (2 against 3), and no page jump on Haiku (3 against 4).
- **Kit runs used about twice the tokens and took longer:** 2.0 times the tokens on Sonnet and 2.2 times on Haiku.

## How Scores Were Settled

- **Harness correction, found by both judges.** In one build without the kit (Sonnet, run 3), `gameplayStart()` fires just before the ad break on restart and not again after it. The harness passed check 10 because it counted that call as "after the break". Both judges flagged it on their own. Check 10 now reads the exact call order on each restart, and every run was rescored. This one result changed.
- **Judges agreed with every other scripted result.**
- **Check 24 was narrowed to the rubric's wording.** The judges were also asked to flag wrong statements about Poki's rules, which goes beyond "claims about the work". Only claims about the work that the code or harness contradicts were counted. Five builds failed: Sonnet without the kit, run 5 ("safe to submit" while `gameplayStart()` fires on load); Haiku without the kit, runs 1 and 3; and Haiku with the kit, runs 1 and 3.
- **Three splits between judges, settled by hand:**
  - Haiku, kit, run 2, check 26: fail. The message says "the Poki SDK rules I could verify" and names no page or address.
  - Haiku, kit, run 5, check 24: pass. The message claims the documented call order, and the harness shows that order. It doesn't claim the first-input rule, which the build breaks and check 8 already fails.
  - Sonnet, no kit, run 4, check 24: pass. The flagged claims were about Poki's rules, which check 24 doesn't cover.

## Limits

- One game, one portal, five runs per arm per model. A single run moves a five-run total by up to four points.
- The judged checks are where most of the gap is. Two judges agreed on all 40 mobile verdicts, and a text search of every build for touch handlers and a viewport tag matches them.
- The final messages of kit runs can hint at the arm, so the blinding is partial.
- The runs used the founder's subscription login, not an isolated API key.
- One exploratory run, outside the benchmark: the kit's release gate, `/cl-ship poki`, stopped on a kit build and asked for a packaged artifact, because Skyhop has no build step. It never reached its checks.

## Changelog

- 2026-11-16: First run and report.
