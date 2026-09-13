'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { useCallback, useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/Button';
import { navigationActions, primaryNavigation } from '@/config/navigation';
import { cn } from '@/lib/cn';

import { Logo } from './Logo';
import { NavLink } from './NavLink';
import { ThemeToggle } from './ThemeToggle';
import { WhatsAppLink } from './WhatsAppLink';

/** Must match Tailwind's `xl` breakpoint, where the desktop nav takes over. */
const DESKTOP_MEDIA_QUERY = '(min-width: 80rem)';

const ICON_PROPS = {
  'aria-hidden': true,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  className: 'size-6',
} as const;

export interface MobileMenuProps {
  className?: string;
}

/**
 * Full-height navigation drawer below the desktop breakpoint. Radix Dialog provides the focus
 * move/trap/return, Escape to close, background scroll lock and the trigger's ARIA wiring.
 */
export function MobileMenu({ className }: MobileMenuProps) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Return focus to the trigger without scrolling. Radix's default focus() lets the browser scroll
  // towards the sticky header's in-flow position, which jumps a scrolled page back to the top.
  const returnFocusToTrigger = useCallback((event: Event) => {
    event.preventDefault();
    triggerRef.current?.focus({ preventScroll: true });
  }, []);

  // Close if the viewport grows past the breakpoint while open, so the scroll lock is released.
  useEffect(() => {
    if (!open) return;
    const media = window.matchMedia(DESKTOP_MEDIA_QUERY);
    const onChange = (event: MediaQueryListEvent) => {
      if (event.matches) setOpen(false);
    };
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, [open]);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger ref={triggerRef} asChild>
        <Button variant="secondary" aria-label="Menu" className={cn('size-12 px-0', className)}>
          <svg {...ICON_PROPS}>
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </Button>
      </Dialog.Trigger>

      <Dialog.Portal>
        {/*
         * Radix applies the background scroll lock in the overlay, so it must be rendered. It is
         * transparent: the drawer is full-screen, so there is no visible backdrop to style.
         */}
        <Dialog.Overlay className="fixed inset-0 z-50 xl:hidden" />
        <Dialog.Content
          aria-describedby={undefined}
          onCloseAutoFocus={returnFocusToTrigger}
          className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-background xl:hidden state-open:animate-drawer-in state-closed:animate-drawer-out"
        >
          <Dialog.Title className="sr-only">Site menu</Dialog.Title>

          <div className="page-container flex h-16 shrink-0 items-center justify-between gap-2 border-b border-default">
            <Logo onNavigate={close} />
            <Dialog.Close asChild>
              <Button variant="secondary" aria-label="Close menu" className="size-12 px-0">
                <svg {...ICON_PROPS}>
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </Button>
            </Dialog.Close>
          </div>

          <nav aria-label="Primary" className="page-container py-4">
            <ul className="flex flex-col gap-1">
              {primaryNavigation.map((item) => (
                <li key={item.href}>
                  <NavLink href={item.href} label={item.label} layout="drawer" onNavigate={close} />
                </li>
              ))}
            </ul>
          </nav>

          <div className="page-container mt-auto flex flex-col gap-4 border-t border-default py-6">
            <ThemeToggle />
            <WhatsAppLink className="w-full" />
            <Button href={navigationActions.quote.href} onNavigate={close} className="w-full">
              {navigationActions.quote.label}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
