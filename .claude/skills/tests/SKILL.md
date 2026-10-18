---
name: tests
description: "Add or normalize the stack-native unit test runner, add one example test, and document the test command. Updates an existing Verify command. Does not create GitHub CI. Run /tests."
---

# Tests

Add or normalize unit testing for this stack. This is setup, not a product feature.

## Do

1. Detect the stack-native runner. Reuse an existing runner if one already works. Do not invent a second runner.
2. Wire the scripts or commands. Add one small example test that can fail, so an empty suite cannot look like a pass.
3. Update the Commands section of `AGENTS.md`. The opt-in switch is a `test` command there. When Verify already exists, add the real test command to it.
4. Run the resulting test command and show it passing.

`/tests` never creates a GitHub workflow on its own. CI remains `/ci`.

## Stop

Do not write a broad suite for existing product code. Future logic-bearing `/implement` steps own their tests once the gate is on.
