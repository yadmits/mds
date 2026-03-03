# Component: Button

## Meta
- `id`: button
- `status`: in_progress
- `figma_node_url`: https://www.figma.com/design/IawDi2Zwy7mvMMrsHvIFg1/%F0%9F%9B%A0%EF%B8%8F-Mindbox-Promo-Library?node-id=6483-5558&t=37QSIedZodPM0hws-11
- `figma_node_id`: 6483:5558
- `code_target`: preview/tokens.html#buttons
- `design_owner`: TODO_DESIGN_OWNER
- `frontend_owner`: TODO_FE_OWNER

## Purpose
Primary interactive control for CTA, form submit, and navigational actions. Supports filled button mode and link-like mode with shared behavior.

## Anatomy
- Label text
- Optional right arrow icon
- Optional icon-only mode in the source component set (`Text=False` variants)

## Variants
| Variant | Description | Figma ref | Implemented |
| --- | --- | --- | --- |
| `filled` | BG enabled (`BG=true`) | node 6483:5558 component set | yes |
| `link` | BG disabled (`BG=false`) | node 6483:5558 component set | yes |
| `night` | Night color sets | `Night=true` variants | yes |
| `rounded` | Rounded/pill style | `Rounded=true` variants | yes |

## Sizes
| Size | Height | Text style |
| --- | --- | --- |
| `XL` | 56 | `Button Component/Button XL` or `Button Component/Link XL` |
| `L` | 44 | `Button Component/Button L` or `Button Component/Link L` |
| `M` | 36 | `Button Component/Button M` or `Button Component/Link M` |
| `S` | 32 | `Button Component/Button S` or `Button Component/Link S` |
| `XS` | 24 | `Button Component/Button XS` or `Button Component/Link XS` |
| `XXS` | 20 | `Button Component/Button XXS` or `Button Component/Link XXS` |

## States
| State | Visual change | Interaction rule | Implemented |
| --- | --- | --- | --- |
| `default` | Base tokens by type/night | idle state | yes |
| `hover` | Uses corresponding hover tokens | pointer hover | yes |
| `active` | Whole component scales to `0.98` | pointer down / click | yes |

## Motion
- Hover transition: soft and quick (`~160-180ms`)
- Active transition: `transform: scale(0.98)`
- Right-arrow animation on hover: `translateX(+6px)`

## Tokens
- Background: `BG/Button/*`, `BG/Button/Hover/*`, plus success mapping
- Text: `Text/*`, `Link/*`, `Link/Hover/*`
- Typography: `Button Component/Button *`, `Button Component/Link *`

## Accessibility
- Ensure icon-only variants have accessible label (`aria-label`)
- Disabled states must not be interactive
- Contrast must be checked per type/night combination

## QA Checklist
- [x] Size matrix assembled
- [x] Type matrix assembled
- [x] Filled and link modes separated
- [x] Hover token mapping applied
- [x] Active scale behavior applied
- [x] Right-arrow hover animation applied
- [ ] Contrast audit per variant
- [ ] Keyboard/focus-visible state validation

## Changelog
- 2026-03-03: Added button matrix page and behavior mapping in preview.
