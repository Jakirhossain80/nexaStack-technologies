/**
 * FAQ content — the single source of truth for both the homepage FAQ section (a curated
 * subset, via `showOnHomepage`) and the full `/faq` page (every item, grouped by category with
 * search and filtering). Answers are deliberately generic where root CLAUDE.md section 22
 * leaves a decision open (pricing model, timelines, target market) — no invented number, price,
 * percentage, duration or geographic claim. Both the homepage section and `/faq` build their
 * `FAQPage` JSON-LD straight from these entries, so structured data cannot drift from what's
 * actually rendered.
 */

export type FaqCategoryId = 'general' | 'services' | 'pricing' | 'project-process' | 'maintenance';

export interface FaqCategory {
  id: FaqCategoryId;
  label: string;
}

/** Display order for /faq's category groups and filter links. */
export const faqCategories: readonly FaqCategory[] = [
  { id: 'general', label: 'General' },
  { id: 'services', label: 'Services' },
  { id: 'pricing', label: 'Pricing' },
  { id: 'project-process', label: 'Project process' },
  { id: 'maintenance', label: 'Maintenance' },
];

export interface FaqItem {
  id: string;
  category: FaqCategoryId;
  /**
   * Required, not optional — every item makes an explicit, deliberate visibility choice for
   * the homepage's curated subset rather than relying on a default. The original 7 items are
   * `true` (this is exactly what the homepage already showed before /faq existed); everything
   * added for /faq is `false` (full page only).
   */
  showOnHomepage: boolean;
  question: string;
  answer: string;
  /** Optional inline links inside `answer` — each `text` must appear verbatim in `answer`. */
  inlineLinks?: readonly { text: string; href: `/${string}` }[];
}

export const faqItems: readonly FaqItem[] = [
  // --- General (new, /faq only) ---
  {
    id: 'what-nexastack-does',
    category: 'general',
    showOnHomepage: false,
    question: 'What does NexaStack do?',
    answer:
      'NexaStack Technologies is a founder-led studio that builds business websites, full-stack web applications and admin dashboards, plus backend APIs, ongoing maintenance and performance and SEO audits — see the services page for the full breakdown.',
    inlineLinks: [{ text: 'services page', href: '/services' }],
  },
  {
    id: 'where-nexastack-is-based',
    category: 'general',
    showOnHomepage: false,
    question: 'Where is NexaStack based, and does it work with clients elsewhere?',
    answer:
      "NexaStack Technologies is based in Uttara, Dhaka, Bangladesh, and works with clients both locally and internationally. Every project discussion runs through the same real channels regardless of where you're located — an initial consultation, the quotation form, or WhatsApp.",
  },
  {
    id: 'how-to-get-started',
    category: 'general',
    showOnHomepage: false,
    question: 'How do I get started working with NexaStack?',
    answer:
      'Start with an initial consultation or submit a quote request — from there, requirements get scoped into a written agreement and a project-specific quote before any work begins.',
    inlineLinks: [{ text: 'quote request', href: '/quotation' }],
  },

  // --- Services (existing, unchanged text) ---
  {
    id: 'services-offered',
    category: 'services',
    showOnHomepage: true,
    question: 'What services do you offer?',
    answer:
      'Business websites, full-stack web applications, admin dashboards, backend APIs, ongoing maintenance and bug fixing, and performance and SEO audits — see the full breakdown on the services page.',
    inlineLinks: [{ text: 'services page', href: '/services' }],
  },
  {
    id: 'tech-stack',
    category: 'services',
    showOnHomepage: true,
    question: 'What technologies do you build with?',
    answer:
      'Every project is built on the MERN stack and Next.js — React, Node.js, Express and MongoDB, with TypeScript throughout. The same modern, typed toolchain is used across every build, not a different stack per client.',
  },
  {
    id: 'existing-website',
    category: 'services',
    showOnHomepage: true,
    question: 'Can you fix or improve an existing website instead of building a new one?',
    answer:
      "Yes. That covers bug fixes and maintenance on a site that's already live, and performance or SEO audits if it's more about diagnosing what's slowing a site down.",
    inlineLinks: [
      { text: 'bug fixes and maintenance', href: '/services/maintenance-and-bug-fixing' },
      { text: 'performance or SEO audits', href: '/services/performance-seo-audits' },
    ],
  },

  // --- Pricing (existing, unchanged text) ---
  {
    id: 'project-cost',
    category: 'pricing',
    showOnHomepage: true,
    question: 'How much does a project cost?',
    answer:
      "There's no fixed price list — every project is scoped around its own features and complexity. Submit a quote request and you'll get an estimate specific to what you're building, before any work begins.",
    inlineLinks: [{ text: 'quote request', href: '/quotation' }],
  },

  // --- Project process (2 existing, unchanged text, recategorized + 3 new) ---
  {
    id: 'project-timeline',
    category: 'project-process',
    showOnHomepage: true,
    question: 'How long does a project usually take?',
    answer:
      "Timelines depend on scope, so a landing page and a full admin dashboard won't follow the same schedule. You'll receive a project-specific timeline as part of your quote, not a generic estimate.",
  },
  {
    id: 'after-quote-request',
    category: 'project-process',
    showOnHomepage: true,
    question: 'What happens after I submit a quote request?',
    answer:
      "You'll hear back to confirm scope and next steps, and if it's a good fit, that turns into a written agreement before any work starts — so expectations are clear from the beginning.",
  },
  {
    id: 'development-process-overview',
    category: 'project-process',
    showOnHomepage: false,
    question: 'What does the development process look like?',
    answer:
      'From an initial consultation through requirement analysis, design, development and testing, to deployment, handover and ongoing support — see the full development process for the detailed, step-by-step breakdown.',
    inlineLinks: [{ text: 'full development process', href: '/process' }],
  },
  {
    id: 'client-involvement-during-development',
    category: 'project-process',
    showOnHomepage: false,
    question: 'How involved will I be during development?',
    answer:
      "You'll get regular progress updates while the project is built, and a dedicated client review step lets you check the working build against the agreed scope before it goes live — any feedback is addressed before deployment.",
  },
  {
    id: 'what-you-need-to-start',
    category: 'project-process',
    showOnHomepage: false,
    question: 'What do you need from me to get started?',
    answer:
      "The initial consultation covers what you need and what success looks like; requirement analysis then turns that into a written scope. Any existing content, brand assets or specific requirements you already have help move things along, though they're not required just to get a quote started.",
  },

  // --- Maintenance (existing, unchanged text) ---
  {
    id: 'post-launch-support',
    category: 'maintenance',
    showOnHomepage: true,
    question: 'Is support available after the website launches?',
    answer:
      'Yes — fixes, updates and dependency maintenance are available after launch, so the project keeps working as browsers and frameworks change.',
    inlineLinks: [
      { text: 'fixes, updates and dependency maintenance', href: '/services/maintenance-and-bug-fixing' },
    ],
  },
] as const;
