# Fix or update the UI theme

Apply or fix the UST design system theme across COIH components.

## Theme Source of Truth
- CSS variables and classes: `client/src/index.css`
- Reference project for exact patterns: `/Users/196285/Documents/Dev/IJP_SO_creation/UI_new/src`

## Key Theme Values
- **Font:** Poppins, base 16px
- **Primary:** #006e74 (teal)
- **Background:** #f4f8f9 (page), #ffffff (cards)
- **Border:** #d7e0e3
- **Text:** #161617 (primary), #707070 (secondary), #a8a8a8 (muted)
- **Success:** #01b27c | **Error:** #fc6a59 | **Warning:** #a76700 | **Purple:** #881e87

## Sizing Scale (rem at 16px base)
- Page heading (h1): 1rem / font-weight 600
- Section heading (h2): 0.813rem / 600
- Body text: 0.75rem
- Small labels: 0.688rem
- Tiny/micro: 0.625rem / 0.563rem
- Card padding: 1rem
- Button padding: 0.375rem 1rem (primary), 0.3rem 0.75rem (secondary)
- Input padding: 0.375rem 0.625rem

## Component Classes
- `.card` — white bg, border, 10px radius, shadow-sm
- `.btn-primary` — teal, white text, pill shape
- `.btn-secondary` — transparent, border, rounded 6px
- `.btn-outline` — teal border, teal text, pill shape
- `.btn-success` — green, pill shape
- `.badge .badge-{critical|high|medium|low}` — priority badges
- `.badge-{resolved|open|needs_action|fyi}` — status badges
- `.data-row` — hoverable list item

## Rules
- Use inline styles for component-specific styling
- Use CSS classes only for reusable patterns
- All sizes in rem, not px
- When in doubt, read the reference project at the path above

User request: $ARGUMENTS
