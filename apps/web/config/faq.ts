/**
 * Homepage FAQ accordion content. Answers are deliberately generic where root CLAUDE.md
 * section 22 leaves a decision open (pricing model, timelines) — no invented number, price,
 * percentage or duration. Also the single source for the section's `FAQPage` JSON-LD: both the
 * rendered accordion and the structured data read `question`/`answer` from the same entries, so
 * they cannot drift apart.
 */

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  /** Optional inline links inside `answer` — each `text` must appear verbatim in `answer`. */
  inlineLinks?: readonly { text: string; href: `/${string}` }[];
}

export const faqItems: readonly FaqItem[] = [
  {
    id: 'services-offered',
    question: 'What services do you offer?',
    answer:
      'Business websites, full-stack web applications, admin dashboards, backend APIs, ongoing maintenance and bug fixing, and performance and SEO audits — see the full breakdown on the services page.',
    inlineLinks: [{ text: 'services page', href: '/services' }],
  },
  {
    id: 'tech-stack',
    question: 'What technologies do you build with?',
    answer:
      'Every project is built on the MERN stack and Next.js — React, Node.js, Express and MongoDB, with TypeScript throughout. The same modern, typed toolchain is used across every build, not a different stack per client.',
  },
  {
    id: 'project-cost',
    question: 'How much does a project cost?',
    answer:
      "There's no fixed price list — every project is scoped around its own features and complexity. Submit a quote request and you'll get an estimate specific to what you're building, before any work begins.",
    inlineLinks: [{ text: 'quote request', href: '/quotation' }],
  },
  {
    id: 'project-timeline',
    question: 'How long does a project usually take?',
    answer:
      "Timelines depend on scope, so a landing page and a full admin dashboard won't follow the same schedule. You'll receive a project-specific timeline as part of your quote, not a generic estimate.",
  },
  {
    id: 'post-launch-support',
    question: 'Is support available after the website launches?',
    answer:
      'Yes — fixes, updates and dependency maintenance are available after launch, so the project keeps working as browsers and frameworks change.',
    inlineLinks: [
      { text: 'fixes, updates and dependency maintenance', href: '/services/maintenance-and-bug-fixing' },
    ],
  },
  {
    id: 'existing-website',
    question: 'Can you fix or improve an existing website instead of building a new one?',
    answer:
      "Yes. That covers bug fixes and maintenance on a site that's already live, and performance or SEO audits if it's more about diagnosing what's slowing a site down.",
    inlineLinks: [
      { text: 'bug fixes and maintenance', href: '/services/maintenance-and-bug-fixing' },
      { text: 'performance or SEO audits', href: '/services/performance-seo-audits' },
    ],
  },
  {
    id: 'after-quote-request',
    question: 'What happens after I submit a quote request?',
    answer:
      "You'll hear back to confirm scope and next steps, and if it's a good fit, that turns into a written agreement before any work starts — so expectations are clear from the beginning.",
  },
] as const;
