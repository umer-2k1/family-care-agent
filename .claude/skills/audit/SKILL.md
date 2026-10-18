---
name: audit
description: "Read-only code review that records findings with durable IDs in findings.md. Supports quality, security, performance, and tests lenses plus current or full-project scope. Run /audit. Does not edit product code."
---

# Audit

Review code and record findings in `ai-genesis-kit/context/findings.md`. Edit no product code.

## Scope and lens

- Scope: `current` (feature-branch delta) or full-project. Default to current when wrapping up a feature.
- Lens: all concerns, or one of `quality`, `security`, `performance`, `tests`. A focused lens must stay inside that concern.

## Record findings

Append entries using durable IDs and this header shape:

`### F-NN [P0-P3] <status> - <title>`

Statuses: `unverified`, `open`, `fixed`, `closed`, `accepted`, `invalid`.

Include file, found date, lens, scope, why it matters, suggested fix, and resolution.

P0/P1 must be confirmed before they block `/complete`. Repairs happen through `/implement` or `/fix`, not this skill. A later audit pass moves `fixed` to `closed` after re-review.

## Stop

Summarize new, open, and blocking findings. Do not start repairs unless the user explicitly asks to implement them.
