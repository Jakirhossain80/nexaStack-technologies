import type { Metadata } from 'next';

import { company } from '@/config/company';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: `How ${company.legalName} handles information, and the current state of that policy.`,
  alternates: { canonical: '/privacy-policy' },
};

interface Section {
  heading: string;
  body: string;
}

// Honest, generic placeholder text — no invented retention periods, no invented
// third-party processors beyond what is actually in the tech stack, no invented
// jurisdiction clauses, no fake "last updated" date implying a completed legal review.
const sections: Section[] = [
  {
    heading: 'Information We Collect',
    body: `This section will describe what information is collected once the site's contact and quotation forms are live — likely limited to what you submit directly, such as your name, email address and project details. ${company.legalName} is currently finalising exactly what is collected and why.`,
  },
  {
    heading: 'How Information Is Used',
    body: `This section will describe how submitted information is used — expected to be limited to responding to enquiries and providing quotes. ${company.legalName} does not sell information to third parties, and this policy will confirm that plainly once finalised.`,
  },
  {
    heading: 'Third-Party Services',
    body: 'This site is built to use a small number of third-party services for hosting and media: MongoDB Atlas (database hosting) and Cloudinary (image and media hosting). A transactional email provider will be added here once one is selected. This section will list exactly what each service can access once those integrations are live.',
  },
  {
    heading: 'Cookies',
    body: 'This section will describe cookie use once analytics, session handling or preference storage (such as a saved theme choice) are finalised in a way that requires disclosure.',
  },
  {
    heading: 'Data Retention',
    body: 'This section will describe how long information is kept once a retention policy has been decided. No specific retention period has been set yet — do not rely on this policy for a retention commitment until it is updated.',
  },
  {
    heading: 'Your Rights',
    body: `This section will describe your rights over information you have provided, including how to request its removal. Until this policy is finalised, you can exercise any of these requests directly by contacting ${company.legalName} at the email address below.`,
  },
  {
    heading: 'Changes to This Policy',
    body: 'This policy will be updated as the practices it describes are finalised. It does not yet carry a "last updated" date, because no completed review has taken place.',
  },
  {
    heading: 'Contact',
    body: `Questions about this policy, or about any information you have provided, can be sent to ${company.email.general}.`,
  },
];

export default function PrivacyPolicyPage() {
  return (
    <div className="page-container section-y">
      <div className="max-w-prose">
        <h1 className="text-page font-semibold tracking-tight text-primary">Privacy Policy</h1>

        <div className="mt-6 rounded-card border border-default bg-surface p-5">
          <p className="text-body text-secondary">
            This policy is being finalised as {company.legalName} formalises its business
            registration and data-handling practices. Nothing below should be read as a completed
            legal review. If you have questions about how your information is handled, contact us
            directly at{' '}
            <a
              href={company.email.href}
              className="rounded-field text-primary-blue underline underline-offset-4 focus-ring hover:text-primary-blue-hover"
            >
              {company.email.general}
            </a>
            .
          </p>
        </div>

        <div className="mt-10 space-y-8">
          {sections.map((section) => (
            <section key={section.heading}>
              <h2 className="text-card font-semibold tracking-tight text-primary">{section.heading}</h2>
              <p className="mt-3 text-body text-secondary">{section.body}</p>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
