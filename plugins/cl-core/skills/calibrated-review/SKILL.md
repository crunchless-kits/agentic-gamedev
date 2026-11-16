---
name: calibrated-review
description: 'Scope-calibrated code review: failure path per finding, "No findings." is valid, two rounds max. Use for any code review, especially ever-growing ones.'
tier: free
tags: ["qa", "production"]
---

# Calibrated review

Review inflation is real: ten findings on a hello-world repo, then twelve. A calibrated review reports what would fail, not what could be nicer.

Run profile: router.

## Rules

1. A finding is a failure path: input, action, wrong result, and where in the code. No failure path, no finding. Style notes go under "Optional" and never block.
2. "No findings." is a complete, correct review when nothing would fail.
3. Fixes stay inside the scope line (see `scope-check`): no new files, dependencies, configs, or docs unless the user asks. A finding that needs them is reported as a question, not a fix.
4. Loop exit: stop at the first review with no blocking findings, or after two rounds. A third round needs the user.
5. Severity by consequence: blocker (data loss, crash, security, wrong result for a normal input), high (wrong result for a plausible input), medium (fails under load or rare input), low (maintainability with a concrete cost).
6. Verify before asserting: run the test, reproduce the failure, or mark the finding as unverified.

## Output

```
# Review: <scope or change>
Round: <1 | 2>
Findings (ranked): [severity] <failure path> | <file:line> | fix inside scope: <yes | question>
Optional: <style notes, none blocking>
Verdict: <No findings. | n blocking findings>
```
