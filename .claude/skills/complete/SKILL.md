---
name: complete
description: "Final safety pass for finished work: archive the spec, squash merge the branch with approval, and stop before pushing. Refuse while P0/P1 findings are open or fixed. Run /complete."
---

# Complete

Close the current feature, fix, or rollback after it is built and reviewed.

## Safety pass

Refuse to proceed while any P0 or P1 finding in `findings.md` is `open` or `fixed`. Those need a fresh audit that moves them to `closed`, or an explicit on-record waiver.

Check the active spec, branch, changed files, and evidence. If `AGENTS.md` declares a Verify command, run the exact `Verify` command from `AGENTS.md`. If none exists, use the fallback build and tests. Confirm a manual try path exists. If workflow skill files changed, keep Codex and Claude adapters in sync.

## Log and merge

1. Archive the spec under `ai-genesis-kit/history/features/` or `ai-genesis-kit/history/fixes/` (rollbacks under `rollbacks/`).
2. Check the item off in `build-plan.md` when it is a planned feature.
3. Reset `current-feature.md` to its stub. Archive resolved findings with the work and reset `findings.md`.
4. Ask before the feature commit. Use a conventional message. No AI attribution.
5. Squash-merge to main only after an explicit yes, then delete the branch.
6. Ask separately before pushing main. Merge approval is not push approval.

## Stop

Do not deploy. Point to `/release` if they want deployment prep.
