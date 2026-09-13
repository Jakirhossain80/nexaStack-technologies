'use client';

import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { useCallback, useRef, type ReactNode } from 'react';

import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';
import { isTheme, THEME_LABELS, THEMES, type Theme } from '@/lib/theme';

import { useTheme } from './ThemeProvider';

const ICON_PROPS = {
  'aria-hidden': true,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  className: 'size-5',
} as const;

const ICONS: Record<Theme, ReactNode> = {
  light: (
    <svg {...ICON_PROPS}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  ),
  dark: (
    <svg {...ICON_PROPS}>
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>
  ),
  system: (
    <svg {...ICON_PROPS}>
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <path d="M8 21h8M12 17v4" />
    </svg>
  ),
};

/**
 * Which trigger icon is visible is decided by CSS from `data-theme-preference` on <html>, set by
 * the pre-paint script. The server cannot know the stored theme, so all three icons are rendered
 * and the right one shows from first paint — no mounted state, no icon swap after hydration.
 */
const TRIGGER_ICON_CLASSES: Record<Theme, string> = {
  light: 'hidden pref-light:block',
  dark: 'hidden pref-dark:block',
  system: 'hidden pref-system:block',
};

export interface ThemeMenuProps {
  className?: string;
}

/**
 * Header theme selector: one icon button opening a light / dark / system menu. A single-choice
 * setting, so the options are menu radio items (announced with their checked state). The mobile
 * drawer keeps the inline `ThemeToggle` list instead.
 */
export function ThemeMenu({ className }: ThemeMenuProps) {
  const { theme, setTheme } = useTheme();
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Return focus without scrolling: a default focus() can scroll towards the sticky header's
  // in-flow position and jump a scrolled page back to the top (same fix as MobileMenu).
  const returnFocusToTrigger = useCallback((event: Event) => {
    event.preventDefault();
    triggerRef.current?.focus({ preventScroll: true });
  }, []);

  // `theme` is undefined only during server render and hydration; the name refines right after.
  const label = theme ? `Theme: ${THEME_LABELS[theme]}. Change theme` : 'Change theme';

  return (
    // Non-modal: a modal menu locks page scroll, and its scrollbar compensation shifts the header.
    <DropdownMenu.Root modal={false}>
      <DropdownMenu.Trigger ref={triggerRef} asChild>
        <Button variant="secondary" aria-label={label} className={cn('size-12 px-0', className)}>
          {THEMES.map((option) => (
            <span key={option} className={TRIGGER_ICON_CLASSES[option]}>
              {ICONS[option]}
            </span>
          ))}
        </Button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Content
        align="end"
        sideOffset={8}
        collisionPadding={16}
        onCloseAutoFocus={returnFocusToTrigger}
        className="z-50 min-w-40 rounded-card border border-default bg-surface p-1 shadow-card state-open:animate-menu-in state-closed:animate-menu-out"
      >
        <DropdownMenu.RadioGroup
          value={theme}
          onValueChange={(value) => {
            if (isTheme(value)) setTheme(value);
          }}
        >
          {THEMES.map((option) => (
            <DropdownMenu.RadioItem
              key={option}
              value={option}
              className="flex min-h-11 cursor-pointer items-center gap-3 rounded-field px-3 text-label font-medium text-primary transition-colors duration-150 data-highlighted:bg-surface-hover"
            >
              <span className="text-secondary">{ICONS[option]}</span>
              <span className="flex-1">{THEME_LABELS[option]}</span>
              {/* The selected state is a checkmark, not colour alone. */}
              <DropdownMenu.ItemIndicator className="text-primary-blue">
                <svg {...ICON_PROPS}>
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              </DropdownMenu.ItemIndicator>
            </DropdownMenu.RadioItem>
          ))}
        </DropdownMenu.RadioGroup>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  );
}
