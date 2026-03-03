# Figma Intake Checklist

Use this before implementing or refactoring any component.

1. Confirm exact node URL and variant in Figma.
2. Capture screenshot of the exact node.
3. Extract:
- layout (auto-layout rules, min/max sizing)
- typography styles
- color/effect tokens
- states and interactions
4. Map node to existing code component (if any).
5. Decide action:
- reuse as-is
- refactor existing component
- create new component
6. Add or update:
- `components.index.json`
- component spec file
- token references in `tokens.catalog.json` if missing
