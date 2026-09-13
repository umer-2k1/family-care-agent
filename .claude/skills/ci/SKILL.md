---
name: ci
description: "Set up automatic GitHub Actions checks for pull requests. Detect real project commands, define one Verify command, and add .github/workflows/verify.yml. Stop before push or remote ruleset changes. Run /ci."
---

# CI

Explicitly set up one project-specific Verify command and matching automatic GitHub checks.

## Do

1. Inspect the real stack, package manager, install command, default branch, and existing workflows.
2. Define one Verify command from checks that already exist, in this order when available: typecheck, tests, then build. Never invent a missing test runner just to fill the command.
3. Record the exact Verify command in `AGENTS.md`.
4. Add or carefully align `.github/workflows/verify.yml` so it runs that same command on pull requests and pushes to the default branch. Preserve existing workflows. Grant only `permissions: contents: read` by default.
5. Run Verify locally.

Never push or change a remote ruleset. Branch protection is a separate remote setting the user applies in GitHub.

## Stop

Do not add git hooks, coverage, browser tests, security scans, or version matrices unless the user asks in this chat.
