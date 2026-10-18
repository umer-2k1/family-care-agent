---
name: debug
description: "Reproduce and isolate a failing test, build, request, or unexpected regression without editing code or AI Genesis Kit state. Diagnose the root cause, then hand confirmed repair to /fix or /implement. Run /debug."
---

# Debug

Reproduce a failure and isolate the root cause. Edit no product code and no AI Genesis Kit workflow files.

## Do

1. Reproduce the failing test, build, request, or behavior with the project's real commands.
2. Capture evidence: command, output, file, and the condition that fails.
3. Narrow the cause. Do not guess past what the evidence supports.
4. Stop with a diagnosis packet: what failed, root cause, evidence, and whether repair belongs in `/fix` (unplanned) or `/implement` (already in the current spec).

## Stop

Do not apply the fix here. Do not write `current-feature.md` unless the user then asks for `/fix` or `/implement`.
