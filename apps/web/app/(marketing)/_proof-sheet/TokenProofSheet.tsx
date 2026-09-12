/**
 * TEMPORARY — design token proof sheet.
 *
 * A development aid for verifying the tokens in styles/tokens.css and styles/globals.css
 * against CLAUDE.md section 7 before any real page is built. Delete this folder when the real
 * homepage replaces it. Not a pattern to copy: real sections live in components/sections/.
 */
import { CONTENT_STATUSES, ROLES } from '@nexastack/shared';
import type { ReactNode } from 'react';

import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { Button } from '@/components/ui/Button';
import { company } from '@/config/company';
import { cn } from '@/lib/cn';

import { ResolvedValue } from './ResolvedValue';

type SwatchKind = 'fill' | 'text' | 'border' | 'on-primary';

interface Swatch {
  role: string;
  classes: string;
  previewClass: string;
  kind: SwatchKind;
  variable: `--nx-${string}`;
  note?: string;
}

// Full class strings are written out so Tailwind can detect them.
const SWATCHES: readonly Swatch[] = [
  {
    role: 'Background',
    classes: 'bg-background',
    previewClass: 'bg-background',
    kind: 'fill',
    variable: '--nx-background',
  },
  {
    role: 'Background alt',
    classes: 'bg-background-alt',
    previewClass: 'bg-background-alt',
    kind: 'fill',
    variable: '--nx-background-alt',
  },
  {
    role: 'Card surface',
    classes: 'bg-surface',
    previewClass: 'bg-surface',
    kind: 'fill',
    variable: '--nx-surface',
  },
  {
    role: 'Text primary',
    classes: 'text-primary',
    previewClass: 'text-primary',
    kind: 'text',
    variable: '--nx-text-primary',
  },
  {
    role: 'Text secondary',
    classes: 'text-secondary',
    previewClass: 'text-secondary',
    kind: 'text',
    variable: '--nx-text-secondary',
  },
  {
    role: 'Border',
    classes: 'border-default',
    previewClass: 'border-default',
    kind: 'border',
    variable: '--nx-border',
    note: 'Below 3:1 against backgrounds: do not rely on it alone for form-field boundaries.',
  },
  {
    role: 'Primary blue',
    classes: 'bg-primary-blue · text-primary-blue',
    previewClass: 'bg-primary-blue',
    kind: 'fill',
    variable: '--nx-primary-blue',
  },
  {
    role: 'Cyan accent',
    classes: 'text-cyan · bg-cyan',
    previewClass: 'bg-cyan',
    kind: 'fill',
    variable: '--nx-cyan',
    note: 'Light theme: decorative only, never text (2.23:1).',
  },
  {
    role: 'Violet accent',
    classes: 'text-violet · bg-violet',
    previewClass: 'bg-violet',
    kind: 'fill',
    variable: '--nx-violet',
  },
  {
    role: 'Success',
    classes: 'bg-success · text-success',
    previewClass: 'bg-success',
    kind: 'fill',
    variable: '--nx-success',
  },
  {
    role: 'Error',
    classes: 'bg-error · text-error',
    previewClass: 'bg-error',
    kind: 'fill',
    variable: '--nx-error',
  },
  {
    role: 'On primary',
    classes: 'text-on-primary',
    previewClass: 'bg-primary-blue text-on-primary',
    kind: 'on-primary',
    variable: '--nx-on-primary',
  },
];

const TYPE_SCALE = [
  { classes: 'text-hero', spec: '40 → 64px fluid', sampleClass: 'text-hero font-semibold' },
  { classes: 'text-page', spec: '36 → 48px fluid', sampleClass: 'text-page font-semibold' },
  { classes: 'text-section', spec: '28 → 40px fluid', sampleClass: 'text-section font-semibold' },
  { classes: 'text-card', spec: '20 → 22px fluid', sampleClass: 'text-card font-semibold' },
  { classes: 'text-body-lg', spec: '18px · 1.7', sampleClass: 'text-body-lg' },
  { classes: 'text-body', spec: '16px · 1.7', sampleClass: 'text-body' },
  { classes: 'text-label', spec: '14px · 1.5', sampleClass: 'text-label' },
  { classes: 'font-mono text-label', spec: 'Geist Mono', sampleClass: 'font-mono text-label' },
] as const;

const RADII = [
  { classes: 'rounded-field', spec: '8px', sampleClass: 'rounded-field' },
  { classes: 'rounded-btn', spec: '10px', sampleClass: 'rounded-btn' },
  { classes: 'rounded-card', spec: '14px', sampleClass: 'rounded-card' },
  { classes: 'rounded-media', spec: '18px', sampleClass: 'rounded-media' },
] as const;

const SPACING = [
  { classes: 'section-sm', spec: '48px · mobile section spacing', sampleClass: 'w-section-sm' },
  { classes: 'section-md', spec: '72px · tablet section spacing', sampleClass: 'w-section-md' },
  { classes: 'section-lg', spec: '96px · desktop section spacing', sampleClass: 'w-section-lg' },
  { classes: 'gutter-sm', spec: '20px · mobile side padding', sampleClass: 'w-gutter-sm' },
  { classes: 'gutter-md', spec: '32px · tablet side padding', sampleClass: 'w-gutter-md' },
  { classes: 'gutter-lg', spec: '40px · desktop side padding', sampleClass: 'w-gutter-lg' },
] as const;

interface ThemePanelProps {
  mode: 'light' | 'dark';
  children: ReactNode;
}

/** Forces a token scope. Components rely on tokens, not `dark:` variants, so this is exact. */
function ThemePanel({ mode, children }: ThemePanelProps) {
  return (
    <div
      className={cn(
        mode,
        'rounded-card border border-default bg-background p-5 text-primary md:p-6',
      )}
    >
      <p className="mb-4 font-mono text-label text-secondary">
        {mode === 'light' ? 'Light theme' : 'Dark theme'}
      </p>
      {children}
    </div>
  );
}

function BothThemes({ children }: { children: ReactNode }) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <ThemePanel mode="light">{children}</ThemePanel>
      <ThemePanel mode="dark">{children}</ThemePanel>
    </div>
  );
}

interface ProofSectionProps {
  id: string;
  title: string;
  description: string;
  children: ReactNode;
}

function ProofSection({ id, title, description, children }: ProofSectionProps) {
  return (
    <section aria-labelledby={id} className="border-t border-default pt-10">
      <h2 id={id} className="text-section font-semibold tracking-tight">
        {title}
      </h2>
      <p className="mt-2 mb-6 max-w-prose text-body text-secondary">{description}</p>
      {children}
    </section>
  );
}

function SwatchPreview({ swatch }: { swatch: Swatch }) {
  const base = 'rounded-field flex h-14 items-center px-3';
  switch (swatch.kind) {
    case 'text':
      return (
        <div className={cn(base, 'border border-default bg-surface', swatch.previewClass)}>
          <span className="text-card font-semibold">Aa</span>
          <span className="ml-3 text-body">Sample text</span>
        </div>
      );
    case 'border':
      return <div className={cn(base, 'border-4 bg-surface', swatch.previewClass)} />;
    case 'on-primary':
      return (
        <div className={cn(base, swatch.previewClass)}>
          <span className="text-body font-semibold">Button label</span>
        </div>
      );
    case 'fill':
      return <div className={cn(base, 'border border-default', swatch.previewClass)} />;
  }
}

function ColourGrid() {
  return (
    <ul className="grid gap-4 sm:grid-cols-2">
      {SWATCHES.map((swatch) => (
        <li key={swatch.role} className="rounded-card border border-default bg-surface p-3">
          <SwatchPreview swatch={swatch} />
          <div className="mt-3 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <span className="text-body font-semibold">{swatch.role}</span>
            <ResolvedValue variable={swatch.variable} />
          </div>
          <code className="mt-1 block font-mono text-label text-secondary">{swatch.classes}</code>
          {swatch.note ? <p className="mt-2 text-label text-secondary">{swatch.note}</p> : null}
        </li>
      ))}
    </ul>
  );
}

function TypeScale() {
  return (
    <ul className="space-y-6">
      {TYPE_SCALE.map((level) => (
        <li key={level.classes} className="border-b border-default pb-5 last:border-b-0">
          <div className="mb-2 flex flex-wrap gap-x-4 font-mono text-label text-secondary">
            <code>{level.classes}</code>
            <span>{level.spec}</span>
          </div>
          <p className={cn('tracking-tight break-words', level.sampleClass)}>{company.tagline}</p>
        </li>
      ))}
    </ul>
  );
}

function RadiusScale() {
  return (
    <ul className="grid grid-cols-2 gap-4">
      {RADII.map((radius) => (
        <li key={radius.classes}>
          <div
            className={cn('h-20 border-2 border-default bg-background-alt', radius.sampleClass)}
          />
          <code className="mt-2 block font-mono text-label">{radius.classes}</code>
          <span className="text-label text-secondary">{radius.spec}</span>
        </li>
      ))}
    </ul>
  );
}

function ButtonSet() {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="primary">Start a project</Button>
        <Button variant="secondary">View our work</Button>
        <Button variant="text">Read more</Button>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="primary" disabled>
          Disabled
        </Button>
        <Button variant="secondary" disabled>
          Disabled
        </Button>
        <Button variant="text" disabled>
          Disabled
        </Button>
      </div>
      <p className="text-label text-secondary">Press Tab to check the focus ring on each button.</p>
    </div>
  );
}

export function TokenProofSheet() {
  return (
    <div className="page-container space-y-12 section-y">
      <header className="space-y-6">
        <div
          role="note"
          className="flex flex-wrap items-center gap-3 rounded-card border border-error bg-surface p-4"
        >
          <span className="rounded-field border border-error px-2 py-0.5 font-mono text-label font-semibold text-error">
            TEMPORARY
          </span>
          <p className="text-body">
            Development aid only. Replace this page with the real homepage and delete{' '}
            <code className="font-mono">app/(marketing)/_proof-sheet</code>.
          </p>
        </div>

        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-prose">
            <h1 className="text-page font-semibold tracking-tight">Design token proof sheet</h1>
            <p className="mt-3 text-body-lg text-secondary">
              Every semantic token from CLAUDE.md section 7, rendered in both themes. The panels
              below are forced to light and dark; the page itself follows the toggle.
            </p>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <ProofSection
        id="proof-colour"
        title="Colour"
        description="Swatches with their Tailwind classes. The value shown is read from the rendered CSS, so it should match the table in CLAUDE.md 7.1."
      >
        <BothThemes>
          <ColourGrid />
        </BothThemes>
      </ProofSection>

      <ProofSection
        id="proof-type"
        title="Typography"
        description="Geist Sans for all copy, Geist Mono for technical labels. Heading sizes scale fluidly between 375px and 1280px viewports."
      >
        <BothThemes>
          <TypeScale />
        </BothThemes>
      </ProofSection>

      <ProofSection
        id="proof-radius"
        title="Radius, spacing and layout"
        description="Radii from CLAUDE.md 7.5 and spacing from 7.4. Use the section-y and page-container utilities for sections; max-w-content is 1280px."
      >
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-card border border-default bg-surface p-5 md:p-6">
            <RadiusScale />
          </div>
          <ul className="space-y-3 rounded-card border border-default bg-surface p-5 md:p-6">
            {SPACING.map((space) => (
              <li key={space.classes} className="flex items-center gap-4">
                <div
                  className={cn('h-4 shrink-0 rounded-full bg-primary-blue', space.sampleClass)}
                />
                <div className="min-w-0">
                  <code className="block font-mono text-label">{space.classes}</code>
                  <span className="text-label text-secondary">{space.spec}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </ProofSection>

      <ProofSection
        id="proof-buttons"
        title="Buttons"
        description="The three permitted variants: primary, secondary and text with arrow. Minimum height 48px."
      >
        <BothThemes>
          <ButtonSet />
        </BothThemes>
      </ProofSection>

      <ProofSection
        id="proof-shared"
        title="Shared package"
        description="Imported from @nexastack/shared, proving the workspace package resolves in the web app."
      >
        <dl className="grid gap-x-6 gap-y-2 rounded-card border border-default bg-surface p-5 text-body sm:grid-cols-2 md:p-6">
          <dt className="font-semibold">ROLES</dt>
          <dd className="font-mono text-secondary">{ROLES.join(' · ')}</dd>
          <dt className="font-semibold">CONTENT_STATUSES</dt>
          <dd className="font-mono text-secondary">{CONTENT_STATUSES.join(' · ')}</dd>
        </dl>
      </ProofSection>
    </div>
  );
}
