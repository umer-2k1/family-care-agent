---
name: adopt
description: "Bootstrap AI Genesis Kit into an existing mature brownfield codebase with shipped features. Survey the repo and generate plans and standards from what already exists. Use /adopt for existing repositories, not freshly scaffolded apps."
---

# Adopt

Bootstrap AI Genesis Kit into an existing codebase that already has shipped features. Do not use this on a freshly scaffolded empty app; use `/onboard` instead.

## Read first

Survey the real repo: README, package manifests, app entrypoints, tests, CI, lint, and the current architecture.

## Do

1. Protect the project's root README. Never replace it with AI Genesis Kit docs.
2. Draft `ai-genesis-kit/project-plan.md` and `ai-genesis-kit/build-plan.md` from existing behavior plus intent the code cannot reveal. Ask for that intent.
3. Tune `coding-standards.md` to the stack that is actually in use.
4. Report existing checks. Run /ci or $ci when you want automatic GitHub checks.
5. Keep generated plans reviewable. Do not start `/overview` until the user accepts the draft plans.

## Stop

Present the generated plans and standards for review. Do not spec features or change product code.
