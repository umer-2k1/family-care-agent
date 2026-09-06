---
name: implement
description: "Build the approved current-feature spec one small reviewable step at a time, then run tests after each step. Uses Verify when declared. Ends with a compact review packet. Run /implement."
---

# Implement

Build the current spec in `ai-genesis-kit/context/current-feature.md` one small step at a time.

## Before coding

- The spec must already exist and have been reviewed.
- Create branch `feature/[name]` or `fix/[name]` if you are not already on it.
- Work only the first unchecked step unless the user asks for a named step.

## Each step

1. Make the smallest change that meets that step's done-when.
2. If `AGENTS.md` declares a `Verify` command, run that exact command as the final automated gate after the step. If no Verify command exists, use the fallback build and tests documented in Commands.
3. If the test gate is on and the step added logic, ship a passing test in the same diff.
4. Check the step off in `current-feature.md` only after the done-when is evidenced.
5. Show the diff, a short summary, and the done-when proof. Wait for review before the next step.

## After the last step

End with a compact review packet: changed files, checks run, manual try path, risks, and next action (`/check`, `/audit current`, or `/complete`).

Do not merge, push, or run `/complete` from this skill.
