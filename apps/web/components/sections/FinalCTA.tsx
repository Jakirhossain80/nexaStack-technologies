import { Button } from '@/components/ui/Button';
import { ScrollReveal } from '@/components/ui/ScrollReveal';
import { WhatsAppLink } from '@/components/layout/WhatsAppLink';
import { navigationActions } from '@/config/navigation';

const HIGHLIGHT = 'better';
const HEADING = `Ready to build something ${HIGHLIGHT}?`;

/**
 * Homepage's one true closing CTA — bigger and more deliberate than any prompt above it,
 * directly before the Footer. Server Component: `WhatsAppLink` (reused from the Navbar/FAQ,
 * not rebuilt) needs no client JavaScript of its own.
 *
 * `bg-background-alt` plus two low-opacity, heavily blurred corner orbs (same brand-gradient
 * stops as Hero's eyebrow dot) mark this as a distinct closing block without a full-bleed
 * gradient fill (root CLAUDE.md 7.2) — no glassmorphism either, this isn't one of the four
 * permitted places (root CLAUDE.md 8).
 */
export function FinalCTA() {
  return (
    <section
      aria-labelledby="final-cta-heading"
      className="relative isolate overflow-hidden bg-background-alt"
    >
      <div
        aria-hidden="true"
        className="absolute -top-24 -right-24 size-72 rounded-full bg-linear-to-br from-cyan via-primary-blue to-violet opacity-10 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="absolute -bottom-24 -left-24 size-72 rounded-full bg-linear-to-tr from-cyan via-primary-blue to-violet opacity-10 blur-3xl"
      />

      <div className="page-container section-y">
        <ScrollReveal className="relative mx-auto max-w-2xl text-center">
          <p className="font-mono text-label tracking-wide text-primary-blue uppercase">
            Let&rsquo;s Talk
          </p>

          <h2
            id="final-cta-heading"
            className="mt-4 text-section font-semibold tracking-tight text-primary"
          >
            {HEADING.split(HIGHLIGHT).map((part, index, parts) => (
              <span key={index}>
                {part}
                {index < parts.length - 1 && (
                  <span className="gradient-underline">{HIGHLIGHT}</span>
                )}
              </span>
            ))}
          </h2>

          <p className="mt-4 text-body-lg text-secondary">
            Tell us what you&rsquo;re building — you&rsquo;ll hear back with a clear next step,
            not a sales pitch.
          </p>

          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Button href={navigationActions.quote.href} className="w-full sm:w-auto">
              {navigationActions.quote.label}
            </Button>
            <Button href="/contact" variant="secondary" className="w-full sm:w-auto">
              Contact
            </Button>
            <WhatsAppLink className="w-full sm:w-auto" />
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
