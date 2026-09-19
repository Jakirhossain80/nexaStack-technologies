'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';

/**
 * Next.js App Router client-side navigation never moves focus or announces the new page to
 * assistive technology on its own — only a full page load does that natively. On every pathname
 * change (the initial mount is skipped, since a fresh load already gets native focus handling),
 * this moves focus to the new page's own `<h1>` inside `#main-content`, so a keyboard or
 * screen-reader user gets a real signal they arrived somewhere new and hears its actual title —
 * falling back to `#main-content` itself on the rare page with no h1 yet rendered.
 *
 * Same `tabIndex="-1"` + `.focus()` idiom already used for local post-action focus moves (e.g.
 * `TemporaryPasswordPanel.tsx`, `EnquiryStatusControl.tsx`), generalized to any h1 instead of a
 * single component's own ref. The temporary `tabindex` is removed again on blur so the heading
 * doesn't linger in the tab order.
 *
 * The "skip the first run" guard compares the previous pathname to the current one, rather than
 * a one-shot boolean: React's Strict Mode (development only) double-invokes this effect on
 * mount, and a boolean flag only blocks the FIRST of those two invocations, so the second one
 * would steal focus onto the h1 on every fresh page load, not just real client-side navigations
 * (caught by a real dynamic test, not a code read — the effect looked correct on paper).
 * Comparing pathnames is correct either way: both mount invocations see the same (unchanged)
 * pathname and no-op, and a genuine navigation is the only thing that changes it.
 */
export function RouteFocusManager() {
  const pathname = usePathname();
  const previousPathname = useRef(pathname);

  useEffect(() => {
    if (previousPathname.current === pathname) return;
    previousPathname.current = pathname;

    const main = document.getElementById('main-content');
    const target = main?.querySelector('h1') ?? main;
    if (!(target instanceof HTMLElement)) return;

    const hadTabIndex = target.hasAttribute('tabindex');
    if (!hadTabIndex) target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: false });

    function handleBlur() {
      if (!hadTabIndex) target?.removeAttribute('tabindex');
      target?.removeEventListener('blur', handleBlur);
    }
    target.addEventListener('blur', handleBlur);
  }, [pathname]);

  return null;
}
