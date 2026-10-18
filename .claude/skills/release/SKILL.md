---
name: release
description: "Prepare Render or Vercel deployment readiness: local config, environment variables, health checks, and smoke-test steps. Never deploy or change remote services without a separate yes. Run /release."
---

# Release

Prepare local Render or Vercel deployment readiness. This is optional and explicit.

## Do

1. Detect which provider the user named (`render` or `vercel`) or ask.
2. Prepare local config, review environment variables, and run build/start checks that already exist.
3. Write a smoke-test path the human can run after a deploy.
4. Stop before deploy, remote service creation, remote env changes, push, or publish unless the user gives a separate yes in this chat.

## Stop

Readiness is not a production deploy. Do not treat config files as a live release.
