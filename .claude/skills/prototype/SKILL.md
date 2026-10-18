---
name: prototype
description: "Create throwaway static HTML and CSS mockups to lock visual theme and page layout before the build loop. Does not implement the real app. Run /prototype."
---

# Prototype

Create throwaway static mockups to lock look and feel before implementation.

## Do

1. Put mockups where the project already keeps them, or under `ai-genesis-kit/` prototypes if the user has no better place.
2. Use static HTML and CSS. Do not wire the real app, data, or auth.
3. Help lock visual theme, page layout, and key screens.
4. Keep the work disposable. A later `/feature` spec should point at the approved mockup.

## Stop

Do not port the mockup into production code here. That is `/implement` after a reviewed spec.
