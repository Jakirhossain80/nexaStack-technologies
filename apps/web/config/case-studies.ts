/**
 * Long-form detail content for `/portfolio/[slug]` — a companion to `config/projects.ts`, not
 * an extension of it, same relationship `config/service-details.ts` has to `config/services.ts`.
 *
 * Deliberately NOT duplicated here (read straight from `Project` on the page instead):
 * - `status` — gates the honest "still in progress" framing for screenshots/results/live-link.
 * - `tags` — rendered directly as the Technology stack chip row; a project's real stack lives
 *   in one place, not copied into a second field that could drift from it.
 * - `liveUrl` / `repoUrl` — already optional-and-real on `Project`; showing them here too would
 *   just be a second place for the "only render if populated" rule to go stale.
 *
 * A project does not need a case study to exist (`generateStaticParams` on the page only
 * builds slugs listed below) — the reverse would be dishonest (a case study describing a
 * project that isn't real), the forward direction is just "not written yet."
 *
 * Honesty rules (root CLAUDE.md section 22, carried over from `service-details.ts`):
 * - No invented metric, user count or percentage anywhere below — a real result gets a
 *   bracketed placeholder instead: `[add real result — metric, outcome, or feedback]`.
 * - No implied client relationship for a project that was actually self-directed.
 * - No architecture or security detail borrowed from NexaStack's own current stack (root
 *   CLAUDE.md section 5) unless it's confirmed as what that specific project actually used —
 *   an unconfirmed detail is bracketed, never upgraded to sound more finished.
 * - `technicalChallenges` / `challengeSolutions` only name what's genuinely known; an
 *   unresolved bug stays described as unresolved, not written up as already fixed.
 */

import { getProjectBySlug } from './projects';

export interface CaseStudy {
  slug: string;
  overview: string;
  businessProblem: string;
  objectives: readonly string[];
  targetUsers: string;
  proposedSolution: string;
  majorFeatures: readonly string[];
  /** Omit entirely (leave undefined) for a genuinely single-role project — don't invent roles. */
  userRoles?: readonly { role: string; description: string }[];
  systemArchitecture: string;
  developmentProcess: string;
  /** Index-matched with `challengeSolutions` — challenge N pairs with solution N. */
  technicalChallenges: readonly string[];
  challengeSolutions: readonly string[];
  securityApproach: string;
  /** Real image paths only. Empty is a valid, honest answer — the page renders a "coming soon" note. */
  screenshots: readonly { src: string; alt: string }[];
  projectResults: string;
  /** Slugs from `config/services.ts` genuinely used to build this project. */
  relatedServiceSlugs: readonly string[];
}

export const caseStudies: readonly CaseStudy[] = [
  {
    slug: 'careerbridge',
    overview:
      'CareerBridge is a full-stack job portal built to work through the real complexity of a multi-role application: four distinct role-based experiences — job seeker, employer, administrator and super-administrator — behind job listings, applications and role-gated dashboards, all under one authentication system. It is a self-directed project, still in active development, not a commissioned client build.',
    businessProblem:
      "There is no client behind this project — it was built independently, not commissioned. The problem it addresses is one common to any real job-portal product: coordinating job postings, applications and account management across four different kinds of users (job seekers, employers, administrators and super-administrators) without conflating their access, rather than solving a single shared-login CRUD app.",
    objectives: [
      'Build a working end-to-end job-portal flow: listings, applications, and a dashboard for each role',
      'Implement role-based access control across job seeker, employer, administrator and super-administrator accounts',
      'Practice a full stack end to end — a Next.js/React frontend backed by an Express/MongoDB API',
      '[add the original motivation in more detail — e.g. a specific gap in existing job-board tools, if there was one]',
    ],
    targetUsers:
      'Job seekers browsing and applying to listings, employers posting and managing listings and reviewing applications, administrators overseeing day-to-day platform operation, and a super-administrator managing administrator accounts and platform-level configuration — the four roles the dashboards and access control are built around.',
    proposedSolution:
      'A single Next.js/React application with four distinct experiences gated by role: a job-seeker-facing flow for browsing and applying to jobs, an employer-facing flow for posting, managing and reviewing applications against listings, an administrative view for platform oversight, and a super-administrator tier for managing administrator accounts and system configuration — backed by an Express REST API and a MongoDB database, with Firebase Authentication handling identity and a JWT-based session layer enforcing what each account type can see and do.',
    majorFeatures: [
      'End-to-end job-posting and application workflow — employers post and manage listings; job seekers search, browse and apply',
      'Employer-side application review, candidate shortlisting, and interview scheduling and management',
      'Four distinct role-gated dashboards — job seeker, employer, administrator, super-administrator',
      'Firebase Authentication for identity, paired with a JWT-based session layer for role-based authorization',
    ],
    userRoles: [
      {
        role: 'Job seeker',
        description:
          'Searches and browses job listings, applies to postings, tracks the status of submitted applications, and manages a personal profile from a job-seeker dashboard.',
      },
      {
        role: 'Employer',
        description:
          'Posts and manages job listings, reviews incoming applications, shortlists candidates, and schedules and manages interviews from an employer-facing dashboard.',
      },
      {
        role: 'Administrator',
        description:
          "Oversees the platform's day-to-day operation — managing user accounts and moderating job-listing content — from an administrative dashboard.",
      },
      {
        role: 'Super-administrator',
        description:
          'Sits above the Administrator tier: manages Administrator accounts and controls platform-level system configuration.',
      },
    ],
    systemArchitecture:
      "A Next.js/React frontend (deployed separately from the API — the live site is CareerBridge's 'client' deployment) talking to an Express.js REST API, with MongoDB as the database. Firebase Authentication handles user identity and sign-in; on successful sign-in, the Express API issues its own JWT, stored in a cookie, which governs session authorization. Role-based middleware on the API reads that JWT to enforce what each of the four account types — job seeker, employer, administrator, super-administrator — can access.",
    developmentProcess:
      "Built and iterated on independently rather than through the client-facing consultation-to-deployment process described on the homepage — a self-directed practice build, working through the frontend, backend and data model together. [add more detail on the actual build timeline or process if useful]",
    technicalChallenges: [
      'Authentication and redirect-flow issues — edge cases in the login/session flow not behaving as expected',
      'Incomplete role-based access control (RBAC) enforcement — role checks not yet fully applied across every route',
      'Integrating two separate authentication mechanisms — Firebase Authentication for identity and a custom JWT layer for session and role authorization — into one coherent sign-in and session flow',
    ],
    challengeSolutions: [
      "Still being worked on — not yet resolved. [add the fix once implemented, e.g. what specifically changed in the auth/redirect flow]",
      "Still being worked on — RBAC enforcement needs to be completed and re-verified across every protected route before this project moves from 'in development' to 'live'. [add the fix once implemented]",
      "Resolved by keeping the two systems cleanly separated: Firebase Authentication owns identity and sign-in, while the Express API issues and validates its own JWT for session and role authorization — each system does one job, rather than one trying to do both.",
    ],
    securityApproach:
      "Role-based authorization is enforced through server-side middleware rather than hidden UI alone — the same server-side-enforcement discipline NexaStack's own API follows (see root CLAUDE.md section 11.3) — governing what each of the four roles (job seeker, employer, administrator, super-administrator) can access. Firebase Authentication handles identity and credentials; the Express API's own JWT, stored in a cookie rather than localStorage, governs session authorization. Enforcement is not yet complete across every route, however — a known, open issue (see Technical challenges above), not a finished security posture. [add real detail on password handling and input validation actually implemented, once confirmed]",
    screenshots: [],
    projectResults:
      "CareerBridge is a working end-to-end job portal today — job listings, applications and role-gated dashboards function for all four roles — but it is not yet feature-complete or bug-free: the authentication/redirect and RBAC issues above are still open, which is why it is listed as in-development rather than live. [add real result — metric, outcome, or feedback if available once complete]",
    relatedServiceSlugs: ['mern-nextjs-applications', 'backend-and-apis', 'admin-dashboards'],
  },
] as const;

// Defensive check, same spirit as `service-details.ts`: catches a case study referencing a
// project slug that doesn't exist (typo, or the project was removed) at build time. The reverse
// isn't checked — not every project needs a case study yet.
for (const detail of caseStudies) {
  if (!getProjectBySlug(detail.slug)) {
    throw new Error(`config/case-studies.ts references unknown project slug: ${detail.slug}`);
  }
}

export function getCaseStudyBySlug(slug: string): CaseStudy | undefined {
  return caseStudies.find((detail) => detail.slug === slug);
}
