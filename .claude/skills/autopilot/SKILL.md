---
name: autopilot
description: "Explicit opt-in only. Take one feature or fix through spec, build, check, and targeted audit without pausing after each passing step. Stop with a review packet before /complete, merge, push, or deploy. Run /autopilot."
---

# Autopilot

Explicit opt-in only. Do not suggest Autopilot as the default next action.

## Bounded pass

When directly invoked, run one spec/build/check and targeted-audit pass for a single work item:

1. Spec if needed (`/feature` or `/fix` rules), then build the spec.
2. Do not pause after each passing implementation step.
3. You may create checkpoint commits on the feature or fix branch after passing steps.
4. If `AGENTS.md` declares a Verify command, run the exact `Verify` command from `AGENTS.md` after implementation and after repairs.
5. Audit the changed code. Repair confirmed P0/P1 findings that are in scope, then rerun affected checks.

## Hard stop

Stop with a review packet before `/complete`, merge, push, deploy, publish, destructive actions, or hiding failing checks. The user runs `/complete` separately.
