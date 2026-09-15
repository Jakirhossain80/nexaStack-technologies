/**
 * "How we get from idea to launch" — the eight-step homepage process timeline. No per-step
 * destination (no icon, no href, no slug): unlike Services, Solutions, Portfolio and
 * Technologies, a process reads as one sequence on the homepage, not something a visitor
 * clicks into individually. The one exception is `inlineLink` on the final step, same pattern
 * as `WhyChooseItem`'s `inlineLink` — a single phrase pointing at a page that already exists.
 */

export interface ProcessStep {
  id: string;
  title: string;
  description: string;
  /**
   * Optional inline link inside `description` — `text` must appear verbatim in `description`;
   * the component splits on it and renders that substring as a plain text link.
   */
  inlineLink?: { text: string; href: `/${string}` };
}

export const processSteps: readonly ProcessStep[] = [
  {
    id: 'consultation',
    title: 'Consultation',
    description:
      "A conversation about what you need, the problem you're solving, and what success looks like — usually a quick message or call to start.",
  },
  {
    id: 'requirement-analysis',
    title: 'Requirement analysis',
    description:
      'Turning that conversation into a written scope: pages, features, data, and any third-party integrations required.',
  },
  {
    id: 'planning',
    title: 'Planning',
    description:
      'Choosing the right stack and structure for what you\'re building, and agreeing a plan before any code is written.',
  },
  {
    id: 'design',
    title: 'Design',
    description:
      'Wireframes and a visual design aligned to your brand, reviewed with you before development starts.',
  },
  {
    id: 'development',
    title: 'Development',
    description:
      'The build itself, following the agreed plan, with regular progress updates rather than silence until launch.',
  },
  {
    id: 'testing',
    title: 'Testing',
    description:
      'Manual checks across devices, browsers and themes, plus accessibility and automated tests before anything ships.',
  },
  {
    id: 'deployment',
    title: 'Deployment',
    description:
      'Released to production with monitoring in place, so problems are caught early rather than reported by users.',
  },
  {
    id: 'maintenance',
    title: 'Maintenance',
    description:
      'Available afterwards for fixes and updates — see our maintenance and support service.',
    inlineLink: {
      text: 'maintenance and support service',
      href: '/services/maintenance-and-bug-fixing',
    },
  },
] as const;
