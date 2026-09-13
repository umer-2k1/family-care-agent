---
name: doctor
description: "Read-only health check for whether AI Genesis Kit is installed and configured correctly. Inspect adapters, commands, ignore rules, planning readiness, and git state without editing files. Run /doctor."
---

# Doctor

Run a read-only health check of the AI Genesis Kit setup. Edit nothing.

## Check

- Required overlay files exist: `AGENTS.md`, `ai-genesis-kit/` context, plans, history, findings, current-feature
- Installed adapters match what the project uses: `.agents/skills/` for Codex, `.claude/skills/` for Claude Code
- Matching Codex and Claude skill files stay identical when both adapters are present
- `AGENTS.md` Commands match real scripts
- A missing `Verify` command or GitHub workflow is informational. Report it; do not treat it as a broken install
- Root README is still the app README; AI Genesis Kit docs live at `ai-genesis-kit/README.md`
- Ignore rules are not hiding workflow files the user meant to keep
- Planning docs and `project-overview.md` freshness
- Workflow drift: current-feature occupied, open findings, unexpected git state

## Stop

Report findings as healthy, warning, or broken. Suggest the next command. Do not repair files in this skill.
