/**
 * "Why Choose NexaStack" — six trust statements for the homepage section of the same name. No
 * individual item links anywhere; the one exception is `inlineLink`, a single phrase inside a
 * description that points at a page which already exists (never invented).
 */

export type WhyChooseIcon = 'sliders' | 'devices' | 'shield' | 'code' | 'chat' | 'wrench';

export interface WhyChooseItem {
  id: string;
  icon: WhyChooseIcon;
  title: string;
  description: string;
  /**
   * Optional inline link inside `description` — `text` must appear verbatim in `description`;
   * the component splits on it and renders that substring as a plain text link.
   */
  inlineLink?: { text: string; href: `/${string}` };
}

export const whyChooseItems: readonly WhyChooseItem[] = [
  {
    id: 'custom-solutions',
    icon: 'sliders',
    title: 'Custom solutions',
    description:
      "Every project starts from your actual requirements, not a repurposed template — the architecture and features are chosen for what you're building, not force-fit into an off-the-shelf structure.",
  },
  {
    id: 'responsive-development',
    icon: 'devices',
    title: 'Responsive development',
    description:
      'Every interface is built mobile-first and tested across phone, tablet and desktop breakpoints — not adjusted for mobile as an afterthought.',
  },
  {
    id: 'secure-applications',
    icon: 'shield',
    title: 'Secure applications',
    description:
      'Validated inputs, secure authentication, rate limiting and standard security headers are the default on every build, not an optional add-on.',
  },
  {
    id: 'maintainable-code',
    icon: 'code',
    title: 'Maintainable code',
    description:
      'TypeScript, linting and consistent conventions from the first commit, so the codebase can be handed off, extended or maintained by another developer without reverse-engineering it first.',
  },
  {
    id: 'clear-communication',
    icon: 'chat',
    title: 'Clear communication',
    description:
      'You work directly with the developer building your project — not through an account manager or a support queue — with replies within one business day.',
  },
  {
    id: 'post-launch-support',
    icon: 'wrench',
    title: 'Post-launch support',
    description:
      'Available for fixes, updates and dependency maintenance after launch, so the project stays working as browsers, frameworks and dependencies change.',
    inlineLink: {
      text: 'fixes, updates and dependency maintenance',
      href: '/services/maintenance-and-bug-fixing',
    },
  },
] as const;
