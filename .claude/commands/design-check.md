---
description: Audit a component or page against the NexaStack design system
---

Audit **$ARGUMENTS** against the design system in the root `CLAUDE.md` sections 7 and 8.

Report findings as a list. For each: the file, the line, what is wrong, and the fix.
**Do not change anything yet** — report first, then wait for approval.

## Check

**Tokens**
- [ ] No raw hex colours — semantic token classes only
- [ ] No arbitrary Tailwind values (`w-[473px]`, `text-[15px]`, `rounded-[14px]`)
- [ ] Colours used in their intended role (primary text is not the secondary token)

**Radii and borders**
- [ ] Cards 12–16px, buttons 10–12px, large media 16–20px, form fields 8–10px
- [ ] Border width 1px
- [ ] Not fully rounded unless intentionally an avatar or pill badge

**Glassmorphism**
- [ ] Present only in: hero statistic panel, floating technology summary, selected
      decorative elements, or desktop nav background
- [ ] Never on content cards or form fields

**Gradients**
- [ ] Used only as accents — logo-related, hero artwork, highlights, selected headings,
      decorative lines, featured-project accents
- [ ] Not on body text, not on every card, not on every button

**Typography**
- [ ] Sizes match the scale in `CLAUDE.md` 7.3
- [ ] Geist Mono only on technical labels, never on paragraphs
- [ ] Body line height 1.6–1.75, line length 60–75 characters

**Spacing**
- [ ] Section spacing and side padding match the responsive scale
- [ ] Content width capped at 1200–1280px

**Buttons**
- [ ] One of the three approved variants
- [ ] Height 44–48px minimum
- [ ] No glow effect
- [ ] Visible focus ring

**Motion**
- [ ] Durations 150–300ms
- [ ] No parallax, cursor-following, moving background, glitch or kinetic type
- [ ] `prefers-reduced-motion` respected

**Themes**
- [ ] Renders correctly in light and dark
- [ ] Light theme does not use pure white for every surface
- [ ] Dark theme is dim navy, not pure black, and leans on borders over shadows

**Shadows**
- [ ] Soft, low-opacity, vertically restrained
- [ ] No hard or deep floating shadows

## Output

Group findings as **Must fix** (violates a stated rule) and **Consider** (within the rules
but inconsistent with the rest of the codebase). If nothing is wrong, say so plainly rather
than inventing issues.
