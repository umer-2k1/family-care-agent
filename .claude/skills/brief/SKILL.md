---
name: brief
description: "Read-only briefing that previews the next build-plan feature before we write its spec: scope, dependencies, what it touches, and size, without changing files. Run /brief before /feature."
---

# Brief

Preview an upcoming build-plan item without writing a spec or editing files.

## Do

1. Select the named feature, or the next unchecked item in `ai-genesis-kit/build-plan.md`.
2. Report scope, likely files, dependencies on earlier items, size, and whether it should be split.
3. Name risks that a later spec must resolve.
4. Write nothing. This is a read-only briefing.

## Stop

End with a recommendation: spec it as-is, split it, or do something else first.
