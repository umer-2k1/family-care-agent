---
name: feature
description: "Turn a planned or newly requested feature into a detailed buildable spec in current-feature.md with small steps and done-when criteria, then stop for review. Run /feature. Does not implement code."
---

# Feature

Write a buildable spec into `ai-genesis-kit/context/current-feature.md` and stop. Do not implement.

## Select the item

- A number or name selects that build-plan item.
- No argument selects the next unchecked item in `ai-genesis-kit/build-plan.md`.
- If the requested work is not in the plan, propose the plan addition, refresh `/overview` after approval, then spec it.

## Spec shape

Include:

- Title, type (feature), and the build-plan item it fulfills
- Goal and out of scope
- Numbered unchecked build steps. Each step is small, reviewable, and ends with a **Done when** that is observable
- Testing: predicted coverage if the test gate is on
- Verify: the command evidence this spec will need

Refuse to spec if `current-feature.md` already holds unfinished work.

## Stop

Ask the user to review the spec before any code exists. Do not create a branch or start `/implement`.
