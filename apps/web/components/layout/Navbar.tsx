import { Button } from '@/components/ui/Button';
import { navigationActions } from '@/config/navigation';

import { DesktopNav } from './DesktopNav';
import { Logo } from './Logo';
import { MobileMenu } from './MobileMenu';
import { StickyHeader } from './StickyHeader';
import { ThemeToggle } from './ThemeToggle';
import { WhatsAppLink } from './WhatsAppLink';

/**
 * Global site header for the marketing site. A Server Component: only the scrolled state, the
 * active-link check, the theme control and the mobile drawer run on the client.
 *
 * The full bar appears from `xl` (1280px). Below that, eight links plus three controls do not fit
 * the content width, so the drawer is used.
 */
export function Navbar() {
  return (
    <StickyHeader>
      {/* A size container so the header theme control can drop out on very narrow screens. */}
      <div className="@container page-container flex h-16 items-center gap-2 xl:h-18 xl:gap-6">
        <Logo />

        <DesktopNav className="hidden xl:mx-auto xl:block" />

        {/* gap-1 below xl keeps logo + theme + menu inside a 360px viewport with full gutters. */}
        <div className="ml-auto flex items-center gap-1 xl:ml-0 xl:gap-2">
          {/* Hidden only when the row is narrower than 20rem; the drawer always has it. */}
          <ThemeToggle variant="compact" className="hidden @xs:inline-flex" />
          <WhatsAppLink iconOnly className="hidden xl:inline-flex" />
          <Button href={navigationActions.quote.href} className="hidden xl:inline-flex">
            {navigationActions.quote.label}
          </Button>
          <MobileMenu className="xl:hidden" />
        </div>
      </div>
    </StickyHeader>
  );
}
