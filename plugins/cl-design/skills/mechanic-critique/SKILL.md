---
name: mechanic-critique
description: "Critique a mechanic on readability, stakes, agency, payoff, identity, with fixes. Use when a mechanic feels boring, clunky, or wrong, or before building one."
tier: free
tags: ["design"]
---

# Mechanic critique

Mechanics are rules; gameplay is how those rules feel. Most "it feels wrong" complaints are not tuning problems. Diagnose which test fails before changing a number.

Run profile: router.

## The five tests

| Test | Question | Minimum evidence |
| --- | --- | --- |
| Readability | Can the player predict what will happen before it resolves? | A telegraph (animation, sound, UI) precedes every outcome |
| Stakes | Does the player care about the outcome? | The outcome changes something that persists past this moment |
| Agency | Do inputs matter at the moment they are made? | Buffering, cancels, or commitments that reward timing exist and are consistent |
| Payoff | Does success feel earned? | At least two feedback channels fire (visual, audio, haptic, camera) scaled to importance |
| Identity | Does it belong in this game? | Weight, timing, and audio match the entity and the game's style guide |

## Complaint to test

| Complaint | Check first | Before tuning numbers |
| --- | --- | --- |
| "I didn't know that would happen" | Readability | Add or lengthen the telegraph |
| "Why bother" | Stakes | Connect the outcome to progression or risk |
| "It feels laggy or clunky" | Agency | Add input buffering, cancel windows, shorter lockouts |
| "It feels weak" | Payoff | Add feedback channels (see `game-juice`) |
| "It doesn't belong" | Identity | Match timing, weight, and audio texture to the style guide |

## Procedure

1. Describe the mechanic precisely: trigger, states (ready, startup, active, recovery, cancel windows), outcomes, and what persists. Pull the state table from code or the GDD; a mechanic without a state table gets one first.
2. Run the five tests with evidence; mark each pass, weak, or fail.
3. Map the complaints you were given to tests; name the test that fails first.
4. Prescribe fixes in order (readability, stakes, agency, payoff, identity), each with the smallest change, the owner, and a playtest scenario that would show it worked.
5. Only after the five tests pass, tune numbers, and tune one at a time with a before and after.

## Output

```
# Mechanic critique: <mechanic>
State table: <ready | startup | active | recovery | cancel windows>
Tests: readability <pass/weak/fail> | stakes | agency | payoff | identity, each with evidence
Diagnosis: <failing test(s)> -> <complaint explained>
Fixes (ordered): change | owner | playtest scenario
Numbers to tune after: <names>
```

Finish with the Crunchless handoff.
