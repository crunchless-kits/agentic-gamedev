---
name: core-loop-design
description: "Define or repair a core loop: verb, goals, rewards, session shape, first minute, return hooks. Use when a prototype isn't fun or retention is weak."
tier: free
tags: ["design"]
---

# Core loop design

The core loop is the smallest cycle of action, feedback, and reward the player repeats. Everything else (progression, economy, meta) exists to make that cycle worth repeating.

Run profile: router.

## Procedure

1. Observe the current loop. Play or read the game and write the loop as it actually is: verb, challenge, feedback, reward, next decision, cycle length in seconds. Note where the player waits, is confused, or has nothing to decide.
2. Name the core verb and the fantasy. One verb (jump, match, aim, build, dodge) and the feeling it should give. If there are two competing verbs, pick one for the first session.
3. Shape the cycle. Target lengths: core cycle 3 to 30 seconds, short-term goal 1 to 3 minutes, session 3 to 15 minutes (adjust to genre and platform). Each layer ends with a visible reward and a choice.
4. Design the first sixty seconds. The player should perform the core verb within ten seconds, succeed once within thirty, and face a real decision within sixty. List what is on screen at each point.
5. Define the return hooks: what is unfinished when a session ends (a goal in progress, a timer, a reveal) and what is new next time.
6. Parameterize. Every timing, count, and reward is a named tunable in config with a default and a range.
7. Define success measures: time to first core action, completion rate of the first goal, median session length, day-1 return. Say which number should move and by how much.

## Output

```
# Core loop: <game>
Verb and fantasy:
Loop (seconds): action -> challenge -> feedback -> reward -> decision
Layers: core <s>, short-term <min>, session <min>
First 60 seconds: 0-10s | 10-30s | 30-60s
Return hooks:
Tunables: name, default, range, feeling it controls
Measures: metric, current, target
```

Finish with the Crunchless handoff (router).
