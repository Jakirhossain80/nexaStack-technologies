---
description: Audit a component or page against WCAG 2.1 AA
---

Audit **$ARGUMENTS** for accessibility. Target is **WCAG 2.1 AA**, which the root
`CLAUDE.md` section 14 treats as non-negotiable.

Report findings first with file, line, the criterion breached, and the fix.
**Do not change anything until approved.**

## Check

**Semantics**
- [ ] Semantic elements used (`nav`, `main`, `section`, `article`, `button`, `a`)
- [ ] No `<div>` with an onClick standing in for a button
- [ ] ARIA used only where semantic HTML is insufficient — and used correctly
- [ ] Landmarks present and not duplicated

**Headings**
- [ ] Exactly one `<h1>` per page
- [ ] No skipped levels
- [ ] Headings describe content, not styled for size alone

**Keyboard**
- [ ] Every interactive element reachable by Tab
- [ ] Tab order follows visual order
- [ ] Escape closes dialogs and menus
- [ ] Focus trapped inside modals, restored on close
- [ ] No keyboard trap anywhere

**Focus**
- [ ] Visible focus indicator on every focusable element
- [ ] No `outline: none` without an equivalent replacement
- [ ] Focus ring has ≥3:1 contrast against its background

**Contrast**
- [ ] Normal text ≥4.5:1
- [ ] Large text (≥18.66px bold / ≥24px) ≥3:1
- [ ] UI component boundaries and icons ≥3:1
- [ ] Verified in **both** light and dark themes
- [ ] Special attention to white on `#1463FF` (4.93:1 — passes AA for normal text; verify every use)

**Forms**
- [ ] Every control has an associated `<label>`
- [ ] Required fields marked in text, not by colour or asterisk alone
- [ ] Errors linked via `aria-describedby`
- [ ] Error messages explain how to fix, not just that something is wrong
- [ ] `aria-invalid` set on failing fields
- [ ] Success confirmation announced to screen readers

**Images and media**
- [ ] Meaningful `alt` on informative images
- [ ] `alt=""` on decorative images
- [ ] Alt text describes purpose, not appearance
- [ ] No text baked into images

**Colour and meaning**
- [ ] Nothing conveyed by colour alone — paired with text or an icon
- [ ] Status indicators readable without colour perception

**Motion**
- [ ] `prefers-reduced-motion: reduce` removes non-essential animation
- [ ] Nothing auto-plays or loops indefinitely

**Responsive**
- [ ] No horizontal scroll at 320px
- [ ] Touch targets ≥44px
- [ ] Content readable at 200% zoom
- [ ] Works in portrait and landscape

## Then

If a dev server is running and a browser tool is available, load the page and run axe-core
against it, and report what it finds alongside the manual review.

Separate findings into **Violations** (fails AA) and **Improvements** (passes AA but could
be better). Be accurate — do not report a violation you have not verified.
