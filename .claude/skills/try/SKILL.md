---
name: try
description: "Give a human click-by-click review guide so someone can manually test this feature themselves: what to start, where to go, expected and incorrect results. Does not capture agent evidence. Run /try."
---

# Try

Write a manual review guide the human can follow. Do not run the flow for them unless they ask; do not edit files.

## Include

- What to start (dev server, command, URL)
- Where to go and what to click, type, or run
- What to expect on the happy path
- What would count as wrong
- Edge states the spec cares about

## Stop

This is not `/check`. Do not treat the guide as proof. Proof stays with `/check` evidence.
