---
name: rollback
description: "Plan a safe reversal of a completed feature from its archived spec and exact git commit, reviewing later dependency risk. Write a guarded rollback spec and stop before product changes. Run /rollback."
---

# Rollback

Plan a reversal of a completed feature. Do not apply product changes in this skill.

## Do

1. Find the archive under `ai-genesis-kit/history/features/` (or fixes) and the exact git commit that landed it.
2. Review later commits and dependents. If later work relies on the feature, say so and propose a guarded plan.
3. Keep the original archive. Write a new rollback spec into `current-feature.md`.
4. Stop for review. Implementation uses the normal `/implement`, `/check`, and `/complete` gates.

## Stop

Do not reset git, revert commits, or delete the original feature archive here.
