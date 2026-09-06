---
name: fix
description: "Document an unplanned bug or small change that is not in the build plan as the current work item in current-feature.md. Write a short fix spec and stop. Run /fix. Does not start coding."
---

# Fix

Document an ad-hoc bug or small change into `ai-genesis-kit/context/current-feature.md`. Use this when the work is not a planned build-plan feature.

## Do

1. Refuse if unfinished work already occupies `current-feature.md`.
2. Write a short spec: problem, the fix, numbered steps with done-when, and verify evidence.
3. Keep scope tight. If the change is actually a planned feature, use `/feature` instead.
4. If the cause is still unknown, send the user to `/debug` first.

## Stop

Ask for spec review. Do not implement until the spec is approved.
