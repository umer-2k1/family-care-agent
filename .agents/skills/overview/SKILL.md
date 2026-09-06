---
name: overview
description: "Generate the AI-facing project-overview.md from the project plan and build plan. Check plan quality and normalize rough build-plan bullets when approved. Run /overview after writing or editing the two planning docs."
---

# Overview

Distill `ai-genesis-kit/project-plan.md` and `ai-genesis-kit/build-plan.md` into `ai-genesis-kit/context/project-overview.md`.

## Do

1. Read both planning docs. If either is empty or too vague to drive a build loop, stop and say what is missing.
2. If the build plan is loose bullets instead of a numbered checkbox list, propose a cleaned checkbox version and wait for approval before writing it.
3. Replace `project-overview.md` with the distilled source of truth: product, users, stack, current behavior, planned work, and constraints.
4. Do not hand-edit the overview later as a living scratchpad. Re-run this skill when the plans change.

## Stop

Show what changed in the overview. Do not spec or implement the next feature unless the user asks.
