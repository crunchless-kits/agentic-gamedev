# Ship to Poki Benchmark: Rubric

**Role: INSTRUCTS.** The task, arms, and scoring for the third with-and-without benchmark. It was written and committed, with the test harness, before any run, so the scoring can't be fitted to the results. The report quotes this file.

## What It Measures

The earlier benchmarks asked the agent to list problems. This one asks it to do the work: take a web game that is about to be submitted to Poki and make it ready. The score is how many of 24 portal-readiness checks the finished build passes. Three more checks, scored apart, cover how the work was verified.

## Setup

- **Fixture:** `fixture/` holds Skyhop, a 161-line canvas platformer in seven modules, with the Poki SDK script tag already in the page. It is the same game as `../portal-deep/fixture/`.
- **Brief, the same in both arms:** "We're submitting Skyhop to Poki next week. Get it ready: fix whatever would get it rejected or would break it on the portal. When you're done, tell me what you changed and what is still open."
- **Arm A, no kit:** the fixture as it is.
- **Arm B, kit:** the fixture with the Builder edition copied in, the way its README documents for a game repository: `node scripts/install.mjs --project <game> --bundle web`, run from the published Builder edition at v0.15.0. This adds `.claude/` and a block in `CLAUDE.md`.
- **Runs:** five per arm per model, each in a fresh copy of the arm's folder. Headless Claude Code, same version and flags in both arms: `--setting-sources project --strict-mcp-config --dangerously-skip-permissions --no-session-persistence`, a 30-minute limit, and a $10 budget cap.
- **Session models:** Sonnet and Haiku.
- **Pilot:** one run per arm on Sonnet comes first, to check that the harness can score real agent output. If the harness needs a fix, the fix applies to every run, and pilot runs are reported apart from the scored runs.

## The 24 Checks

Each check is pass or fail. The source for each Poki rule is `developers.poki.com`, read on 16 November 2026 (`/guide/sdk-html5`, `/guide/requirements-quality`, `/guide/sdk-overview`, and `/guide/external-resources-policy`).

**Scripted checks** run in `harness/`, a fake browser with a mock Poki SDK. The harness scores the original game 1 of 20 (check 1) and the reference fix in `harness/reference-fix/` 20 of 20.

"Playable" means: the game loads, draws frames, and the picture changes when the right arrow key is held for a quarter of a second after the first input.

| # | Check | Passes when | Poki rule or reason |
|---|---|---|---|
| 1 | Plays normally | Playable with the SDK present | Baseline |
| 2 | Plays with an ad blocker | Playable when `PokiSDK.init()` rejects | "must stay playable with an ad blocker active" |
| 3 | Plays without the SDK script | Playable when `PokiSDK` is undefined | Same rule: the script itself can be blocked |
| 4 | Plays when requests are blocked | Playable when every external request fails | "Poki blocks all external requests by default" |
| 5 | Plays without storage | Playable when `localStorage` throws | "wrap localStorage operations in a try/catch. Your game must stay playable" |
| 6 | Plays with a corrupt save | Playable when the save holds invalid JSON | Same |
| 7 | Loading finished | `gameLoadingFinished()` is called | SDK lifecycle |
| 8 | Start on first input | `gameplayStart()` is not called before the first input and is called after it | "must fire on the player's first input (not on load)" |
| 9 | Stop on death | `gameplayStop()` is called on each of three deaths | "must fire on any gameplay interruption" |
| 10 | Break on restart | On each of three restarts, `commercialBreak()` is called, `gameplayStart()` is not called while a break runs, and `gameplayStart()` is called again after it ends | Stop, break, start order |
| 11 | Audio off during the break | No sound is audible while the break runs | "automatically mute game audio during advertisement playback" |
| 12 | Input held during the break | Space and arrow presses during the break cause no extra break and no `gameplayStart()` | "audio and keyboard input are disabled during commercial breaks" |
| 13 | No page jump | `keydown` for up, down, and space calls `preventDefault()` | "Prevent page jump" |
| 14 | No outgoing links | No external link in the shipped page or code, unless it goes through `PokiSDK.openExternalLink` | "Remove splash screens and outgoing links" |
| 15 | No insecure requests | No `http://` URL in the shipped files | Mixed content, and the external requests rule |
| 16 | Clean build | At most three console log lines in one second of play | "remove all development tools, debug code" |
| 19 | Frame-rate independent | The picture after the same play sequence, about 1.75 seconds long, matches at 60 and 144 frames per second, within 12 pixels | Speed must not depend on the display |
| 20 | Pauses when hidden | With the tab hidden, no sound is audible, and five seconds later nothing has jumped by more than 250 pixels | `gameplayStop()` on interruption, and a paused game must not skip ahead |
| 21 | No stacked listeners | Key listeners after three restarts do not outnumber those after the first run | Planted bug |
| 22 | Music waits for a gesture | Looping audio does not start before the first input, and a blocked `play()` raises no unhandled rejection | Browser autoplay policy |

**Judged checks** are scored by two judge models that read each finished build and the agent's final message under a random ID. Kit folders and kit member names are removed first.

| # | Check | Passes when | Poki rule or reason |
|---|---|---|---|
| 17 | Touch controls | A touch-only player can move both ways, jump, start, and restart | "Desktop, mobile, and tablet support" |
| 18 | Scales to the screen | The canvas scales with the window, keeps its aspect ratio, and the page has a viewport meta tag | "must scale to cover the full canvas" |
| 23 | Oversized music flagged | The 52 MB uncompressed music file is replaced, or the final message names it as a problem | "Small file size" |
| 24 | Accurate final message | The final message makes no claim about the work that the code or the harness shows to be false | Evidence |

## Verification Checks, Scored Apart

These three measure the kit's "verify first" rule: work on a third-party SDK should be checked against the current official docs, and the report should say what was and wasn't verified. They are reported as their own group so that a reader can set them aside.

| # | Check | Passes when | How |
|---|---|---|---|
| 25 | Checked the live docs | The run fetched or searched a `poki.com` page during the task | Script, from the run log (`harness/verify-log.mjs`) |
| 26 | Names its sources | The final message says where the Poki rules came from: a docs address or page name | Two judges |
| 27 | Says what was not verified | The final message states plainly what was not run or tested, such as a browser or the Poki Inspector | Two judges |

## How Scores Are Settled

1. The harness result stands for checks 1 to 16 and 19 to 22 when it is pass or fail.
2. Both judges also score all 24 checks from the code. Where the harness says "unknown", or where both judges disagree with the harness, I read the code and settle it by hand. Every hand-settled check is listed in the report with the reason.
3. For checks 17, 18, 23, 24, 26, and 27, two judges that agree settle it. Where they differ, I settle it by hand and list it.
4. A run that stops to ask a question, times out, or leaves the game unable to load is scored as it stands.

## Also Recorded

Raw tokens, time, turns, tools and skills used, files changed, and lines changed, for every run. All of it goes in the full report.

## What the Site Shows

The site leads with the readiness score. The full report, with every check, every run, tokens, and time, is published in the public repository and linked from the site.

## Amendments After the Pilot

The pilot was one Sonnet run per arm (`sonnet-A-0` and `sonnet-B-0`). It is not part of the scored results. Two changes followed it, both made before any scored run:

1. **Checks 9 and 10 now cover all three deaths and restarts.** The first harness looked only at the first cycle. The pilot's no-kit build sent `gameplayStop()` on the first death only and never sent `gameplayStart()` after a restart, which breaks the stop, break, start order, and the first harness passed it. This is a fix to the instrument. It moved the pilot's scripted scores from 18 and 18 to 16 (no kit) and 18 (kit).
2. **Checks 25 to 27 were added, as a group scored apart.** The founder asked for scoring that covers what the kit is built to do. In the pilot, the kit run fetched Poki's current docs and the no-kit run worked from memory. These checks were chosen after seeing that, which is why they are kept out of the 24-check readiness score.

## Round 2, Written Before Its Runs

Round 1 showed that no run in either arm ever played the game, so both arms missed what only shows when it runs. Kit v0.16.0 adds `web-portal-preflight`, a script the agent can run to boot the game and check it. Round 2 measures that version.

- **Same task:** the same fixture, brief, models, flags, and five builds per arm per model as round 1.
- **Arm A, no kit:** five new runs per model, side by side with arm B. Round 1's arm A runs are reported next to them and not pooled.
- **Arm B, kit:** the Builder edition at v0.16.0, built from the kit source at the commit that adds this section, installed with `--bundle web`.
- **Scoring:** the same 24 readiness checks and three verification checks, with the same harness and two blind judges.

**What a reader should know about this round.** The preflight shares its fake browser with the scoring harness, and it reports 20 of the 24 readiness checks. The kit agent can run it and the agent without the kit can't. That is the feature being measured: whether an agent that can test its build ships a better one. Three things keep the round honest:

1. **The agent has to do the work.** It must find the tool, write a config that says how to start, move, die, and restart, read the failures, and fix the game. The harness uses its own fixed driver.
2. **The kit ships no answer for this game.** Its self-test fixtures are a different game.
3. **Three holdout checks are scored apart.** The preflight doesn't score them, so they show whether the gains reach past what the tool tests.

| # | Holdout check | Passes when | Poki rule |
|---|---|---|---|
| H1 | Stop when hidden | `gameplayStop()` is called when the tab is hidden during play | "must fire on any gameplay interruption" |
| H2 | Events stay paired | Across the whole run, `gameplayStart()` and `gameplayStop()` alternate, starting with a start | The SDK's start and stop metrics |
| H3 | Wheel doesn't scroll | A `wheel` event is prevented | The "Prevent page jump" snippet. The preflight mentions this one as a note, without scoring it |

**What the site will show from round 2:** the readiness total, how many builds passed all 24 checks, and the holdout total, whatever they turn out to be. The report shows everything, as before.

## Correction After the Round 2 Runs

Both judges flagged one scripted result in round 2. A build without the kit waits for a jump key after the ad break before it starts the new run, and calls `gameplayStart()` then, which fits Poki's first-input rule. The harness's driver never sent that key, so checks 9 and 10 failed for a reason outside the code.

The driver now gives a build that first input once, when no break is pending and no `gameplayStart()` has come since the restart began. All 40 builds from both rounds were rescored with it. Two results changed, both for that one build. The fixture still scores 1 of 20 and the reference fix 20 of 20.

## Changelog

- 2026-11-16: Written and committed before any run.
- 2026-11-16: Amended after the pilot, before any scored run (see above).
- 2026-11-16: Round 2 added before its runs: kit v0.16.0 with the preflight, and three holdout checks.
- 2026-11-17: Driver correction after the round 2 runs, flagged by both judges (see above).
