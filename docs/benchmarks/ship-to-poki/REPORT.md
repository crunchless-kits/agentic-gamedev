# Ship to Poki Benchmark: Results

**Role: HANDS OFF.** Results of the with-and-without benchmark of the kit on one task in Claude Code, run twice: round 1 on kit v0.15.0 (16 Nov 2026) and round 2 on kit v0.16.0 (16 and 17 Nov 2026). The task, arms, checks, and scoring rules are in `RUBRIC.md`. Each round's rules were committed before its scored runs: round 1 in 9bee56a, amended after the pilot in b07d990, and round 2 in 4d3d2fe. The site's benchmark section quotes this file.

## The Short Version

Each agent got one brief: get the web game Skyhop ready to submit to Poki. The finished build was scored on 24 readiness checks drawn from Poki's own docs.

**Round 2, kit v0.16.0.** This version adds a preflight: a script the agent runs to boot the game in a fake browser and check it against portal rules.

| | Sonnet, no kit | Sonnet, kit | Haiku, no kit | Haiku, kit |
|---|---|---|---|---|
| Readiness checks passed, five builds | 98 of 120 | **119 of 120** | 98 of 120 | **120 of 120** |
| Builds that passed all 24 checks | 0 of 5 | **4 of 5** | 0 of 5 | **5 of 5** |
| Weakest build, of 24 | 18 | **23** | 18 | **24** |
| Checks failed, five builds | 22 | **1** | 22 | **0** |
| Holdout checks passed, of 15 | 5 | **14** | 6 | **13** |

Nine of the ten kit builds passed every check. No build without the kit did, in either round. The one check a kit build failed was touch controls: one Sonnet run left them out and said so.

**Read this with the table.** The preflight and the scoring harness share a fake browser, and the preflight reports 20 of the 24 checks. So an agent with the kit could test its build against most of what was scored, and an agent without the kit could not. That ability is what round 2 measures. The holdout checks are three rules the preflight doesn't score, and they are reported apart for that reason.

**Round 1, kit v0.15.0**, before the preflight existed: 112 against 100 of 120 on Sonnet, and 104 against 96 on Haiku. Its full results are in the second half of this file.

## Round 2: Kit v0.16.0, 16 and 17 Nov 2026

### What Changed in the Kit

Round 1 showed that no run in either arm ever played the game, so both arms missed what only shows when it runs. Three things changed for v0.16.0:

- **New: `web-portal-preflight`.** The agent writes a small config that says how to start the game, move, end a run, and restart. A Node script then boots the game in a fake browser with a mock Poki SDK, under ten conditions such as an ad blocker and a hidden tab. It prints each of 20 checks as pass, fail, or skipped, with the evidence and the usual fix. `/cl-port`, the Poki skill, and the kit's router now end portal work with it.
- **The kit's Poki notes were re-read against Poki's live docs** on 16 Nov, between the rounds.
- **The release gate no longer stops on a web game with no build step.**

### Setup

- **Same as round 1:** the fixture, the brief, the models, the flags, and Claude Code 2.1.319. Five builds per arm per model, with the two arms side by side.
- **Arm A:** the game alone, in new runs. Round 1's arm A runs are not pooled with them.
- **Arm B:** the game with the Builder edition at v0.16.0 (kit source commit 4d3d2fe), copied in by `node scripts/install.mjs --project <game> --bundle web`.
- **Scoring:** the same harness for 20 checks. Two blind judges, on Opus and Sonnet, scored the six judged checks and audited every scripted result against the code. Three holdout checks were added to the harness before the runs.
- **Records:** `results/round2/` holds every build, the config each kit agent wrote, the harness output, every final message, both judges' files, the ID map, and the final score table.

### Each Check, Passes of Five

| # | Check | Sonnet, no kit | Sonnet, kit | Haiku, no kit | Haiku, kit |
|---|---|---|---|---|---|
| 1 to 6 | Plays normally, with an ad blocker, without the SDK, with requests blocked, without storage, and with a corrupt save | 5 each | 5 each | 5 each | 5 each |
| 7 | Loading finished | 5 | 5 | 5 | 5 |
| 8 | Start on first input | 1 | **5** | 1 | **5** |
| 9 | Stop on death | 5 | 5 | 5 | 5 |
| 10 | Break on restart, in order | 5 | 5 | 5 | 5 |
| 11 | Audio off during the break | 5 | 5 | 5 | 5 |
| 12 | Input held during the break | 5 | 5 | 5 | 5 |
| 13 | No page jump | 5 | 5 | 4 | 5 |
| 14 | No outgoing links | 5 | 5 | 5 | 5 |
| 15 | No insecure requests | 5 | 5 | 4 | 5 |
| 16 | Clean build | 5 | 5 | 5 | 5 |
| 17 | Touch controls | 0 | **4** | 1 | **5** |
| 18 | Scales to the screen | 2 | **5** | 3 | **5** |
| 19 | Frame-rate independent | 2 | **5** | 0 | **5** |
| 20 | Pauses when hidden | 0 | **5** | 1 | **5** |
| 21 | No stacked listeners | 5 | 5 | 5 | 5 |
| 22 | Music waits for a gesture | 4 | 5 | 5 | 5 |
| 23 | Oversized music flagged | 5 | 5 | 5 | 5 |
| 24 | Accurate final message | 4 | 5 | 4 | 5 |

### Holdout Checks, Scored Apart

The preflight doesn't score these three, and the kit ships no fix for this game.

| # | Check | Sonnet, no kit | Sonnet, kit | Haiku, no kit | Haiku, kit |
|---|---|---|---|---|---|
| H1 | `gameplayStop()` is called when the tab is hidden | 0 | 4 | 1 | 3 |
| H2 | Start and stop events stay paired | 5 | 5 | 5 | 5 |
| H3 | The mouse wheel doesn't scroll the page | 0 | 5 | 0 | 5 |
| | Total, of 15 | 5 | **14** | 6 | **13** |

- **H1 is the clean holdout.** The preflight doesn't test it or print anything about it. The kit's notes quote the rule it comes from. Kit builds passed it 7 times in 10, against 1 in 10 without the kit.
- **H3 is only partly held out.** The preflight prints an unscored note when the wheel isn't prevented.
- **H2 passed in every build** and separates nothing.

### Verification Checks, Scored Apart

| # | Check | Sonnet, no kit | Sonnet, kit | Haiku, no kit | Haiku, kit |
|---|---|---|---|---|---|
| 25 | Checked Poki's live docs | 0 | 0 | 0 | 1 |
| 26 | Names its sources | 0 | 0 | 0 | 0 |
| 27 | Says what was not verified | 5 | 5 | 5 | 5 |

### Every Run

| Run | Readiness, of 24 | Scripted, of 20 | Scripted checks failed | Touch | Scales | Holdout, of 3 | Raw tokens | Seconds |
|---|---|---|---|---|---|---|---|---|
| Sonnet, no kit, 1 | 19 | 17 | 8, 19, 20 | no | yes | 1 | 164,859 | 46 |
| Sonnet, no kit, 2 | 20 | 18 | 8, 20 | no | no | 1 | 165,755 | 50 |
| Sonnet, no kit, 3 | 21 | 18 | 19, 20 | no | yes | 1 | 168,457 | 54 |
| Sonnet, no kit, 4 | 18 | 16 | 8, 19, 20, 22 | no | no | 1 | 132,722 | 41 |
| Sonnet, no kit, 5 | 20 | 18 | 8, 20 | no | no | 1 | 166,690 | 53 |
| Sonnet, kit, 1 | 23 | 20 | none | no | yes | 3 | 338,450 | 71 |
| Sonnet, kit, 2 | 24 | 20 | none | yes | yes | 3 | 441,777 | 81 |
| Sonnet, kit, 3 | 24 | 20 | none | yes | yes | 3 | 734,045 | 130 |
| Sonnet, kit, 4 | 24 | 20 | none | yes | yes | 2 | 337,300 | 73 |
| Sonnet, kit, 5 | 24 | 20 | none | yes | yes | 3 | 404,873 | 87 |
| Haiku, no kit, 1 | 18 | 16 | 8, 13, 19, 20 | yes | no | 1 | 365,396 | 91 |
| Haiku, no kit, 2 | 20 | 17 | 8, 15, 19 | no | yes | 2 | 242,644 | 77 |
| Haiku, no kit, 3 | 20 | 17 | 8, 19, 20 | no | yes | 1 | 409,808 | 76 |
| Haiku, no kit, 4 | 20 | 18 | 19, 20 | no | no | 1 | 304,441 | 63 |
| Haiku, no kit, 5 | 20 | 17 | 8, 19, 20 | no | yes | 1 | 126,224 | 49 |
| Haiku, kit, 1 | 24 | 20 | none | yes | yes | 3 | 944,245 | 186 |
| Haiku, kit, 2 | 24 | 20 | none | yes | yes | 3 | 839,055 | 150 |
| Haiku, kit, 3 | 24 | 20 | none | yes | yes | 2 | 948,176 | 143 |
| Haiku, kit, 4 | 24 | 20 | none | yes | yes | 3 | 1,072,668 | 162 |
| Haiku, kit, 5 | 24 | 20 | none | yes | yes | 2 | 737,429 | 125 |

Median raw tokens per run: Sonnet 165,755 without the kit and 404,873 with it; Haiku 304,441 and 944,245. Median time: Sonnet 50 and 81 seconds; Haiku 76 and 150 seconds.

### What It Shows

- **With a way to run the game, the agent fixed what the run showed.** All ten kit builds passed all 20 scripted checks. Without the kit, no build did, and the best passed 18.
- **The two checks that mostly failed in round 1 now pass.** Frame-rate independence and pausing in a hidden tab each passed in 2 of 10 kit builds in round 1, and in 10 of 10 in round 2. Without the kit they passed 2 and 1 times in 10 this round.
- **Most builds without the kit broke one lifecycle rule.** `gameplayStart()` must fire on the player's first input. Two of 10 builds without the kit did that, against 10 of 10 with it.
- **The smaller model with the kit beat the larger model without it.** Haiku with the kit passed 120 of 120. Sonnet without it passed 98.
- **Some of the gain reaches past what the tool scores.** Kit builds passed the clean holdout 7 times in 10 against 1 in 10. Nine of 10 had full touch controls, which the preflight only mentions in a note.
- **The baseline held between rounds.** Without the kit, Sonnet passed 100 in round 1 and 98 in round 2, and Haiku 96 and 98.

### What It Does Not Show

- **The tool and the test share a check list.** The preflight was written after round 1 by the author of the scoring harness, and its 20 checks are the harness's 20 checks. It carries no fix for Skyhop, and its self-test uses a different game. So round 2 shows that an agent with this tool fixes what the tool reports. It doesn't show how the tool does on rules outside its list, or on a game built differently.
- **The kit's "verify first" rule was followed less than in round 1.** One of ten kit runs fetched Poki's live docs, against seven of ten in round 1. The other nine worked from the preflight and the kit's notes, dated 16 Nov. No final message in either arm named a Poki docs page as its source.
- **One kit build shipped without touch controls** (Sonnet, run 1). Its message lists them as open. The preflight's note about touch didn't get them built.
- **The clean holdout wasn't perfect.** Three of 10 kit builds don't call `gameplayStop()` when the tab is hidden.
- **Kit runs cost more than in round 1:** 2.4 times the tokens on Sonnet and 3.1 times on Haiku, and 1.6 and 2.0 times the time. They also made about twice the tool calls: a median of 11 against 5 on Sonnet, and 27 against 13 on Haiku.

### How Scores Were Settled

- **Harness correction, found by both judges.** One build without the kit (Haiku, run 4) waits for a jump key after the ad break before it starts the new run, and calls `gameplayStart()` then. That fits Poki's rule. The harness's driver never sent that key, so the next run never started, and checks 9 and 10 failed. The driver now gives a build that first input once, when no break is pending and no `gameplayStart()` has come since the restart. All 40 builds from both rounds were rescored. Only these two results changed, and the build went from 16 to 18 of 20. Its first scoring is kept in `results/round2/scores/haiku-A-4.before-driver-correction.json`.
- **Judges agreed with every other scripted result,** and with each other on 118 of 120 judged verdicts.
- **Two splits, settled by hand:**
  - Sonnet, no kit, run 1, check 24: fail. The message opens with "I've made Skyhop's code safe for the Poki portal" while `gameplayStart()` fires at load. Round 1 failed the same claim in the same situation, so the same rule applies. A pass here would make the Sonnet total without the kit 99.
  - Haiku, no kit, run 1, check 26: fail. The message says its SDK calls came from memory and names sdk.poki.com only as a place to check them. This check is outside the readiness score.
- **Check 24 failed in two builds, both without the kit:** the one above, and Haiku run 1, which says the arrow keys no longer scroll the page while ArrowDown still does.
- **The mobile verdicts match a text search.** Every build the judges passed on scaling has a viewport tag, and every build they failed lacks one. Every build they passed on touch has pointer handlers for press and release. Three builds without the kit have a `pointerdown` handler that only starts music or jumps, and both judges failed them.

### Limits

- One game, one portal, and five builds per arm per model.
- **Blinding was weaker than in round 1.** Every kit message mentions the preflight, and two kit builds mention it in their README, so a judge could tell the arms apart. Twenty of the 24 checks are scripted and don't depend on a judge.
- **One pilot run of the kit arm** (`sonnet-B-0`) checked the runner before the scored runs. It passed all 20 scripted checks and isn't counted.
- **Eleven sessions were cut off by the account's usage limit** before doing any work: one Sonnet kit run and all ten Haiku runs. Each returned the limit message and nothing else, and was rerun the next morning. No session that did work was rerun.
- As in round 1, the runs used a subscription login, not an isolated API key.

## Round 1: Kit v0.15.0, 16 Nov 2026

The first run of this benchmark, before the kit had the preflight. Kept as first reported, apart from the heading levels.

### Round 1 in Short

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

### Setup

- **Fixture:** Skyhop, a seven-module canvas platformer with the Poki SDK script tag in place and 16 planted problems.
- **Brief, the same in both arms:** "We're submitting Skyhop to Poki next week. Get it ready: fix whatever would get it rejected or would break it on the portal. When you're done, tell me what you changed and what is still open."
- **Arm A:** the game alone. **Arm B:** the game with the Builder edition (v0.15.0, commit 693b5c9) copied in by `node scripts/install.mjs --project <game> --bundle web`.
- **Runs:** five per arm per model, each in a fresh copy, two sessions at a time. Claude Code 2.1.319, headless, with the same flags in both arms.
- **Session models:** Sonnet (`claude-sonnet-5-5`) and Haiku (`claude-haiku-5-5`).
- **Scoring:**
  - Twenty checks ran in `harness/`, a fake browser with a mock Poki SDK. It scores the original game 1 of 20 and the reference fix 20 of 20.
  - Two judges, on Opus and Sonnet, each read every build and final message under a random ID. They scored the six judged checks and audited every scripted result against the code.
- **Records:** `results/` holds every build, the harness output for every run, both judges' files, the ID map, and the final score table.

### Each Check, Passes of Five

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

### Verification Checks, Scored Apart

| # | Check | Sonnet, no kit | Sonnet, kit | Haiku, no kit | Haiku, kit |
|---|---|---|---|---|---|
| 25 | Checked Poki's live docs | 0 | 2 | 2 | 5 |
| 26 | Names its sources | 0 | 2 | 2 | 1 |
| 27 | Says what was not verified | 5 | 5 | 5 | 5 |

### Every Run

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

### What It Shows

- **Builds made with the kit passed more readiness checks.** Sonnet went from 100 to 112 of 120, and Haiku from 96 to 104. The kit's Sonnet builds failed 8 checks in total against 20.
- **The kit's weakest build beat or matched most builds without it.** The lowest kit score on Sonnet was 21. Only two of five builds without the kit reached 21.
- **Mobile support is where the kit changed the outcome.** Poki asks for "Desktop, mobile, and tablet support". The kit's Poki notes list touch controls and scaling in their preflight, and the kit builds had them. Sonnet without the kit skipped both in every run.
- **One kit build passed all 24 checks.** No build without the kit did.
- **The kit kept the SDK lifecycle right more often.** `gameplayStart()` fired on first input in 9 of 10 kit builds against 6 of 10.

### What It Does Not Show

- **The kit didn't fix what neither arm tested.** Frame-rate independence and pausing in a hidden tab failed in most builds in both arms. No run played the game, so no run saw them.
- **The 20 scripted checks alone are close:** 93 against 91 of 100 on Sonnet, and 86 against 83 on Haiku. Most of the gap comes from the two mobile checks, which judges scored.
- **The kit's "verify first" rule was not followed every time.** Two of five Sonnet kit runs fetched Poki's docs. The other three worked from the kit's dated notes.
- **Three checks went slightly the other way:** no insecure requests on Sonnet (4 against 5), frame-rate independence on Sonnet (2 against 3), and no page jump on Haiku (3 against 4).
- **Kit runs used about twice the tokens and took longer:** 2.0 times the tokens on Sonnet and 2.2 times on Haiku.

### How Scores Were Settled

- **Harness correction, found by both judges.** In one build without the kit (Sonnet, run 3), `gameplayStart()` fires just before the ad break on restart and not again after it. The harness passed check 10 because it counted that call as "after the break". Both judges flagged it on their own. Check 10 now reads the exact call order on each restart, and every run was rescored. This one result changed.
- **Judges agreed with every other scripted result.**
- **Check 24 was narrowed to the rubric's wording.** The judges were also asked to flag wrong statements about Poki's rules, which goes beyond "claims about the work". Only claims about the work that the code or harness contradicts were counted. Five builds failed: Sonnet without the kit, run 5 ("safe to submit" while `gameplayStart()` fires on load); Haiku without the kit, runs 1 and 3; and Haiku with the kit, runs 1 and 3.
- **Three splits between judges, settled by hand:**
  - Haiku, kit, run 2, check 26: fail. The message says "the Poki SDK rules I could verify" and names no page or address.
  - Haiku, kit, run 5, check 24: pass. The message claims the documented call order, and the harness shows that order. It doesn't claim the first-input rule, which the build breaks and check 8 already fails.
  - Sonnet, no kit, run 4, check 24: pass. The flagged claims were about Poki's rules, which check 24 doesn't cover.

### Limits

- One game, one portal, five runs per arm per model. A single run moves a five-run total by up to four points.
- The judged checks are where most of the gap is. Two judges agreed on all 40 mobile verdicts, and a text search of every build for touch handlers and a viewport tag matches them.
- The final messages of kit runs can hint at the arm, so the blinding is partial.
- The runs used the founder's subscription login, not an isolated API key.
- One exploratory run, outside the benchmark: the kit's release gate, `/cl-ship poki`, stopped on a kit build and asked for a packaged artifact, because Skyhop has no build step. It never reached its checks.

## Changelog

- 2026-11-16: First run and report.
- 2026-11-17: Round 2 added, on kit v0.16.0. The harness driver was corrected and all 40 builds were rescored.
