---
name: onboard
description: "Tune a freshly scaffolded or early project after installing AI Genesis Kit. Detect the stack, document commands, check gitignore, and prepare files before overview. Use after overlaying onto a new app. Run /onboard or $onboard."
---

# Onboard

Set up AI Genesis Kit in a freshly scaffolded or early project. Do not use this for a brownfield app with shipped features; use `/adopt` instead.

## Read first

- `AGENTS.md`
- `ai-genesis-kit/context/coding-standards.md`
- `ai-genesis-kit/context/ai-interaction.md`
- Root `.gitignore` if present

## Do

1. Detect the real stack, package manager, and existing scripts. Do not invent a stack.
2. Update `AGENTS.md` Commands to the project's actual commands. Keep only commands that exist.
3. Tune `coding-standards.md` and `ai-interaction.md` to the detected stack. Remove defaults that do not apply.
4. If `CLAUDE.md` is present, keep its imports aligned with the project files that exist.
5. Check `.gitignore` for secrets, env files, and whether the user wants AI Genesis Kit workflow files committed or kept local-only. Ask before changing ignore rules.
6. Report existing checks (typecheck, tests, build, GitHub workflows). Do not create CI here. Run /ci or $ci when you want automatic GitHub checks.
7. Tell the user what to fill in before `/overview`: `ai-genesis-kit/project-plan.md` and `ai-genesis-kit/build-plan.md`.
8. Recommend keeping or removing unused adapters (`.agents/` vs `.claude/`) based on the tools they actually use. Do not delete adapters without confirmation.

## Stop

Show the setup summary and stop. Do not write `project-overview.md`. Do not spec or implement features.
