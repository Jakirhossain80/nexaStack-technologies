/**
 * Full fourteen-step `/process` walkthrough — a distinct, more granular sequence from the
 * homepage's eight-step teaser in `config/process.ts`. Deliberately not imported from or
 * merged with that file: the two serve different purposes (condensed teaser vs. full
 * walkthrough) and were built as separate configs by design.
 *
 * Same honesty discipline as the homepage version: no timeframe, no duration, no percentage,
 * no team-size language, no channel that isn't actually offered.
 */

export interface DevelopmentProcessStep {
  id: string;
  title: string;
  description: string;
  /**
   * Optional inline link inside `description` — `text` must appear verbatim in `description`;
   * the component splits on it and renders that substring as a plain text link.
   */
  inlineLink?: { text: string; href: `/${string}` };
}

export const developmentProcessSteps: readonly DevelopmentProcessStep[] = [
  {
    id: 'initial-consultation',
    title: 'Initial consultation',
    description:
      "A conversation about what you need, the problem you're solving, and what success looks like for the project.",
  },
  {
    id: 'requirement-analysis',
    title: 'Requirement analysis',
    description:
      'Turning that conversation into a written scope: pages, features, data, and any third-party integrations required.',
  },
  {
    id: 'scope-and-quotation',
    title: 'Scope and quotation',
    description:
      "A defined scope and a quote specific to your project, provided through the quotation form — not a generic rate card.",
  },
  {
    id: 'agreement-and-advance-payment',
    title: 'Agreement and advance payment',
    description:
      "Once the scope and quote are agreed, a signed agreement and an advance payment secure your project's place before development begins.",
  },
  {
    id: 'research-and-planning',
    title: 'Research and planning',
    description:
      "Choosing the right architecture and technical approach for what's being built, informed by the confirmed requirements.",
  },
  {
    id: 'wireframe-creation',
    title: 'Wireframe creation',
    description:
      'Low-fidelity layouts establishing structure and flow before visual design starts, so the shape of each page is agreed early.',
  },
  {
    id: 'ui-ux-design',
    title: 'UI/UX design',
    description:
      "Full visual design aligned to your brand and the site's design system, reviewed with you before development starts.",
  },
  {
    id: 'frontend-development',
    title: 'Frontend development',
    description:
      "Building the interface — every page and interaction — following the agreed designs and the project's accessibility and performance standards.",
  },
  {
    id: 'backend-development',
    title: 'Backend development',
    description:
      'Building the API, database structure, and any integrations the project needs, in parallel with or following frontend work.',
  },
  {
    id: 'testing',
    title: 'Testing',
    description:
      'Manual checks across devices, browsers and themes, plus accessibility and automated tests, before anything is presented for review.',
  },
  {
    id: 'client-review',
    title: 'Client review',
    description:
      'A chance to review the working build against the agreed scope before it goes live, with feedback addressed before deployment.',
  },
  {
    id: 'deployment',
    title: 'Deployment',
    description:
      'Released to production with monitoring in place, so problems are caught early rather than reported by users.',
  },
  {
    id: 'handover',
    title: 'Handover',
    description:
      "Access, credentials, and documentation handed over so the project is genuinely yours to run — not dependent on anyone else to operate.",
  },
  {
    id: 'maintenance-and-support',
    title: 'Maintenance and support',
    description:
      'Available afterwards for fixes, updates, and dependency maintenance — see the maintenance and support service.',
    inlineLink: {
      text: 'maintenance and support service',
      href: '/services/maintenance-and-bug-fixing',
    },
  },
] as const;
