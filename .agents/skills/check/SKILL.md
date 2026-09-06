---
name: check
description: "Prove the done-when criteria against the running app and show evidence. Verify the feature's real behavior without editing source or workflow state. Run /check. Agent-side proof, not a manual walkthrough."
---

# Check

Prove the current spec against the running app. This is agent-side evidence, not a human click-through (that is `/try`).

## Do

1. Read `current-feature.md` done-whens and Verify notes.
2. Exercise the real behavior: run the app, command, or request the spec names.
3. Report pass or fail for every done-when with the observed evidence.
4. Edit nothing: no source changes, no spec edits, no commits.

## Stop

If a done-when fails, say which one and what you observed. Leave repair to `/implement` or `/debug`.
