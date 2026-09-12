---
description: Scaffold a new marketing page section following the NexaStack design system
---

Create a new page section component: **$ARGUMENTS**

Follow the design system in the root `CLAUDE.md` section 7 and `apps/web/CLAUDE.md`.

## Requirements

**Location:** `apps/web/components/sections/<Name>.tsx`

**Structure**
- Server Component by default. Only add `'use client'` if it genuinely needs interactivity,
  and if so extract the interactive part into a smaller child component instead.
- Accept content as props with a `<Name>Props` interface. Do not hardcode copy inside the
  component unless it is purely structural.
- Wrap in a `<section>` element with an `aria-labelledby` pointing at its heading.

**Layout**
- Max content width 1200–1280px, centred
- Side padding: 16–20px mobile, 24–32px tablet, 32–48px desktop
- Section vertical spacing: 40–64px mobile, 56–80px tablet, 80–120px desktop
- Use the semantic Tailwind token classes only — no raw hex, no arbitrary pixel values

**Visual rules**
- Cards: solid surface, 1px border, 12–16px radius, subtle shadow, slight hover elevation
- No glassmorphism unless this is specifically a hero statistic panel or floating
  technology summary
- Gradients only as accents — never on body text, never on every card
- Buttons: existing `Button` primitive, never a new one

**Responsive**
- Mobile single column, tablet two columns, desktop as appropriate to the content
- No horizontal overflow at any width
- Touch targets ≥44px

**Accessibility**
- Correct heading level for its position in the page — do not skip levels
- Visible focus rings on anything interactive
- Meaningful `alt` text, or `alt=""` if decorative
- Any animation limited to 150–300ms and disabled under `prefers-reduced-motion`

**Both themes**
- Verify light and dark rendering; dark uses dim navy surfaces and relies on borders
  rather than heavy shadows

## Before finishing

1. Run `pnpm lint` and `pnpm typecheck`
2. List any assumptions you made about the content shape
3. Do not modify unrelated components or pages
