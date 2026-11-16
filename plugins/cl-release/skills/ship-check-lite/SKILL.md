---
name: ship-check-lite
description: "Free engine-agnostic release gate: four floor sections, evidence per line, READY or NOT READY. Use before publishing any build without ship-readiness."
tier: free
tags: ["release", "qa"]
---

# Ship check (lite)

The same rule as the full gate: a line passes on a recording, a screenshot, a measured number, or a file, never on a description of what should be true. Lite covers what every game needs regardless of where it ships; the Builder member adds portal and store gates, policy and consent checks, rollback, a quality floor you edit, and dated release records.

Fan-out: evidence by `cl-scout` (one scout per section in parallel, or serially with `--serial`); the verdict by the caller.

## Procedure

1. Identify the candidate: build path or URL, version or commit, build date. No artifact means stop.
2. Collect evidence per line, four sections, recording pass or miss with what was seen:
   - It runs: no crash across 15 minutes of play on the slowest device you have; cold start to first input under 10 seconds; frame time measured in the busiest scene; survives backgrounding and a window resize or rotation.
   - It reads in the first minute: a new player understands the core verb within 10 seconds; a first success or failure within 60 seconds; feedback on every interactive element; no clipped text at the largest text setting.
   - It looks finished: no placeholder text, debug UI, or missing-texture colors; one font family and one UI kit; sound on every interaction; pause, sound toggle, and a way back to the title.
   - It is honest and clean: provenance recorded for every third-party asset (`asset_catalog.py check --ship` when the manifest exists); a privacy policy link if anything is tracked; the store or portal description promises nothing the build lacks.
3. Verdict: READY (every line passes), or NOT READY with the misses in priority order and the smallest fix for each. Never upgrade a miss to a pass because time ran out.
4. Name what this check did not cover and which Builder member covers it: portal SDK lifecycles and preflights, store metadata and ratings, consent and policy, rollback and kill switches, dated release records, the editable quality floor.

## Output

```
# Ship check (lite): <build> <version>
It runs: <line> PASS | MISS (evidence) ...
It reads: ...
It looks finished: ...
It is honest and clean: ...
Verdict: READY | NOT READY
Fix first: <ordered misses>
Not covered here: <list with the Builder member>
```

Finish with the Crunchless handoff (Changed: nothing).
