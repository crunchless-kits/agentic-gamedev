# Skyhop Portal Benchmark: Rubric

**Role: INSTRUCTS.** The tasks, arms, and scoring for the second with-and-without benchmark. It was written and committed before any run, so the scoring can't be fitted to the results. The report quotes this file.

## Setup

- **Fixture:** `fixture/` holds Skyhop, a 161-line canvas platformer across seven modules, about to be submitted to Poki. It has 16 planted problems, listed below.
- **Arms:** A has no kit. B has the web bundle (`cl-core`, `cl-assistant`, `cl-web`, `cl-design`, `cl-qa`, `cl-release`, `cl-platforms`, `cl-ci`) passed as `--plugin-dir`, from the Studio source (every Builder member present).
- **Runs:** 3 per arm per task, interleaved A, B, A, B. Headless Claude Code, same flags in both arms.
- **Session models:** Sonnet for all three tasks. Task 1 also runs with Haiku as the session model.

## Planted Problems

Portal-specific problems are marked P.

1. Movement and gravity are per frame, so speed depends on the display's refresh rate (`src/main.js` update).
2. `newRun()` calls `bindKeys()` on every run, so key listeners stack (`src/main.js`, `src/input.js`).
3. `localStorage` and `JSON.parse` have no try/catch, which throws in sandboxed iframes and on corrupt saves (`src/save.js`).
4. Music starts at boot with no user gesture, and the `play()` promises are unhandled (`src/audio.js`, `src/main.js` boot).
5. Nothing pauses on `visibilitychange` or blur.
6. The canvas is a fixed 960 by 540, with no resize, devicePixelRatio, or viewport meta tag (`index.html`, `src/main.js`).
7. P: The commercial break runs without pausing the game, muting audio, or disabling input (`src/main.js` restart, `src/sdk.js`).
8. P: `gameplayStart` and `gameplayStop` are never called.
9. P: The SDK's loading-finished signal is never sent.
10. P: SDK calls are unguarded. An ad blocker or a missing `PokiSDK` blocks or crashes boot (`src/sdk.js`, `src/main.js` boot).
11. P: An external link sits in the page footer (`index.html`).
12. P: Arrow keys and space don't call `preventDefault`, so they scroll the host page in an iframe (`src/input.js`).
13. P: Input is keyboard only, with no touch controls for mobile players.
14. P: The leaderboard is fetched over `http://` (blocked as mixed content on an https portal), and a failed fetch blocks boot (`src/net.js`, `src/main.js` boot).
15. P: `assets/music.wav` is 52 MB uncompressed (`assets/manifest.json`), which is far too large for a web portal download.
16. P: `console.log` runs every frame (`src/main.js` update).

## Tasks

**T1, audit (Sonnet and Haiku):** "Audit this game before we submit it to Poki next week. Give me a ranked list of the problems to fix, each with the file path and line. Do not edit any files."

**T2, release decision (Sonnet):** "Is this build ready to submit to Poki? Give a go or no-go decision, with the evidence for each reason. Do not edit any files."

**T3, scoped fix (Sonnet):** "Pressing space after game over sometimes restarts the run several times at once. Fix that bug with the smallest change, and tell me how you verified the fix."

## Scoring

Scores come from a judge model that sees each answer under a random ID, with the arm hidden. Where an answer names a kit member, the arm can be inferred, so the blinding is partial. Scripted checks cover anything that can be checked mechanically.

**T1 and T2, per run:**

| Measure | How |
|---|---|
| Planted problems found, of 16 | Judge, with file named |
| Portal problems found, of 10 | Judge, items 7 to 16 |
| Findings with file and line evidence | Judge, share of findings |
| Findings with a concrete fix | Judge, share of findings |
| Unsupported or wrong claims | Judge, count |
| T2 only: correct no-go decision | Judge |
| T2 only: says what it could not verify | Judge, yes or no |

**T3, per run:**

| Measure | How |
|---|---|
| Bug fixed: listeners bound once | Script: `bindKeys` is not called from `newRun` and is called once |
| Files changed outside `src/main.js` and `src/input.js` | Script: `git diff --stat` |
| Lines changed | Script |
| Fixed unrelated planted problems without being asked | Judge, count |
| Says how the fix was verified | Judge, yes or no |

**Also recorded for every run:** raw tokens, time, turns, and the tools and skills used. All of these appear in the full report.

## What the Site Shows

The site leads with the measures where the arms differ most, chosen after the results come in. Each one comes straight from this scoring and is labeled with what it measures. The full report, with every measure including tokens and time, is linked from the site.

## Replication, Written Before Its Runs

The first run had three audits per arm, which is too few to lean on. The replication repeats task T1 only, with ten new runs per arm on Sonnet and ten per arm on Haiku, using the same brief, fixture, arms, and flags.

- **Judge:** one judge on Opus, blind as before. This time it gets Poki's rules as read from `developers.poki.com` on 16 November 2026, so it can tell a supported policy claim from an unsupported one.
- **Measures:** planted problems found of 16, Poki problems found of 10, and unsupported claims (claims the code or Poki's docs contradict or don't support). Tokens and time are recorded as before.
- **Reporting:** the replication is reported on its own and next to the first run. Nothing from the first run is dropped.

## Changelog

- 2026-11-16: Written before any run.
- 2026-11-16: Replication section added before its runs.
