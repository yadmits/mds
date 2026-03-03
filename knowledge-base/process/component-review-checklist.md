# Component Review Checklist

A component can move to `done` only if all checks pass.

## Design Fidelity
- [ ] Screenshot diff reviewed against Figma reference
- [ ] Spacing, typography, radius, and effects match expected tokens
- [ ] All declared variants implemented

## API and Behavior
- [ ] API is minimal and consistent with design system naming
- [ ] Edge cases covered (long text, empty states, loading/error if relevant)
- [ ] No breaking change without migration note

## Accessibility
- [ ] Correct semantic role and labeling
- [ ] Keyboard support and visible focus
- [ ] Contrast and reduced-motion behavior verified

## Engineering
- [ ] Uses global tokens only
- [ ] Tests updated (unit/integration where relevant)
- [ ] Docs/examples updated

## Governance
- [ ] `components.index.json` updated
- [ ] Component spec updated
- [ ] Owner and review date set
