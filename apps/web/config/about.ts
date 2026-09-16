/**
 * Content for `/about`. Founder name/title/social links are NOT duplicated here — pull them
 * live from `config/company.ts`. Two sections below are marked HONESTY PLACEHOLDER: NexaStack
 * was founded in 2026 and has no prior track record to describe, so these stay as explicit
 * bracketed placeholders rather than invented specifics (root CLAUDE.md section 1 and 22).
 */

export interface StorySection {
  heading: string;
  paragraphs: readonly string[];
}

export interface MissionVision {
  mission: string;
  vision: string;
}

export type CoreValueIcon = 'honesty' | 'craftsmanship' | 'accessibility' | 'directness';

export interface CoreValue {
  id: string;
  icon: CoreValueIcon;
  title: string;
  description: string;
}

export interface FounderMessage {
  heading: string;
  paragraphs: readonly string[];
}

export interface ExperienceSection {
  heading: string;
  paragraphs: readonly string[];
}

export interface PhilosophyItem {
  id: string;
  title: string;
  description: string;
}

export interface CondensedSection {
  heading: string;
  body: string;
}

export const about = {
  intro: {
    body: 'NexaStack Technologies is a founder-led web development studio based in Dhaka, Bangladesh, building fast, accessible websites and web applications for businesses that need real engineering behind their online presence. Every project is handled directly by the person building it, from the first conversation to launch.',
  },

  story: {
    heading: 'Our Story',
    paragraphs: [
      "NexaStack Technologies was founded in 2026 by Md. Jakir Hossain as a founder-led studio — a deliberate choice to keep client work direct and accountable to one person, rather than spread across a team that doesn't exist yet.",
      // HONESTY PLACEHOLDER — no invented history predating 2026, no fabricated narrative.
      '[Add the real story here — what led to starting NexaStack, a first project or turning point, whatever happened next.]',
    ],
  } satisfies StorySection,

  missionVision: {
    mission:
      'To build websites and web applications that are fast, accessible and genuinely useful — engineered with the same care whether the client is a solo founder or a growing team.',
    vision:
      'To be the kind of development partner clients keep coming back to because the work speaks for itself, not because of a contract.',
  } satisfies MissionVision,

  coreValues: [
    {
      id: 'honesty',
      icon: 'honesty',
      title: 'Honesty',
      description:
        "Clear, realistic answers over impressive-sounding promises — including saying plainly what isn't finished yet.",
    },
    {
      id: 'craftsmanship',
      icon: 'craftsmanship',
      title: 'Craftsmanship',
      description: 'Code and design built to be maintained and extended, not just shipped and forgotten.',
    },
    {
      id: 'accessibility',
      icon: 'accessibility',
      title: 'Accessibility',
      description: 'Every project meets real accessibility standards by default, not as an afterthought.',
    },
    {
      id: 'directness',
      icon: 'directness',
      title: 'Directness',
      description: 'You work with the person actually building your project, not a layer of account management.',
    },
  ] as readonly CoreValue[],

  founderMessage: {
    heading: "Founder's Message",
    paragraphs: [
      "I started NexaStack Technologies because I wanted to build the way I'd want to be built for — clearly, honestly, and with someone who actually answers when you have a question.",
      // HONESTY PLACEHOLDER — folded into the letter's own voice, not set apart from it.
      "[I'll add my real background here — what I've built, hands-on, before this.]",
      'Every project gets the same approach: understand what you actually need, build it properly, and stay reachable after it ships.',
      "If that sounds like how you'd want to work with someone, I'd like to hear from you.",
    ],
  } satisfies FounderMessage,

  experience: {
    heading: 'Professional and Technical Experience',
    paragraphs: [
      // HONESTY PLACEHOLDER — no invented years of experience, project count, or client list.
      "[Describe your hands-on background here — projects, timeline, what you've built.]",
      "Until that's written up, the most honest signal available right now is the code itself: this site is built with the exact stack described below, and the source is public on GitHub.",
    ],
  } satisfies ExperienceSection,

  philosophy: [
    {
      id: 'ship-working-software',
      title: 'Ship working software, not just design files',
      description: 'A live, working version matters more than a polished mockup that isn’t built yet.',
    },
    {
      id: 'accessibility-and-performance',
      title: 'Accessibility and performance are part of the build, not a later pass',
      description: 'WCAG AA and fast load times are targets from the first commit, not a cleanup pass before launch.',
    },
    {
      id: 'server-first',
      title: 'Server-first, client JavaScript only where it earns its place',
      description: 'Interactivity is added deliberately — most of a page should just be fast, static HTML.',
    },
    {
      id: 'typed-end-to-end',
      title: 'Typed end to end',
      description: 'TypeScript across frontend and backend, so mistakes show up at build time, not in production.',
    },
  ] as readonly PhilosophyItem[],

  whyChooseSummary: {
    heading: 'Why Choose NexaStack',
    body: 'Every project follows the same practices: solutions built around your actual requirements, responsive development tested across devices, security as a default rather than an add-on, and direct communication with the person doing the work.',
  } satisfies CondensedSection,

  techSummary: {
    heading: 'Technology Capabilities',
    body: 'The stack is modern, typed, and consistent across every project — from the interface layer through to the database.',
  } satisfies CondensedSection,
} as const;

export type About = typeof about;
