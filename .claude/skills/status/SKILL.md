---
name: status
description: "Show where the project stands: build-plan progress, current work, overview freshness, git state, workflow drift, and the suggested next action. Run /status."
---

# Status

Read-only progress summary.

## Report

- Build-plan progress (checked vs remaining)
- What occupies `current-feature.md`, if anything
- Overview freshness versus the two planning docs
- Git branch, dirty files, and whether work is on a feature/fix branch
- Open findings that would block `/complete`
- Workflow drift warnings
- One suggested next action

## Stop

Edit nothing. Do not start the suggested action unless the user asks.
