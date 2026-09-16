import type { Metadata } from 'next';

import { company } from '@/config/company';

export const metadata: Metadata = {
  title: 'Terms and Conditions',
  description: `The terms for using ${company.legalName}'s website and services, and the current state of that policy.`,
  alternates: { canonical: '/terms-and-conditions' },
};

interface Section {
  heading: string;
  body: string;
}

// Honest, generic placeholder text — see privacy-policy/page.tsx for the same approach and
// the same restrictions on what not to invent.
const sections: Section[] = [
  {
    heading: 'Acceptable Use',
    body: `This section will describe acceptable use of this website and of any service ${company.legalName} provides. In general, the site is intended to be used to learn about the firm's work and to get in touch — this section will formalise what is and is not permitted once finalised.`,
  },
  {
    heading: 'Intellectual Property',
    body: `Site content, design and the ${company.legalName} name and logo belong to ${company.legalName} unless stated otherwise. This section will describe the specifics of what visitors and clients may and may not do with that content once finalised.`,
  },
  {
    heading: 'Limitation of Liability',
    body: `This section will describe the limits of ${company.legalName}’ liability once finalised, typically alongside legal review appropriate to the firm's registered business structure — which is not yet decided (see the "Business type" note in the project's own build documentation).`,
  },
  {
    heading: 'Governing Law',
    body: 'This section will state which jurisdiction’s law governs these terms once the business is formally registered. No jurisdiction clause has been set yet — do not rely on this section for that.',
  },
  {
    heading: 'Changes',
    body: 'These terms will be updated as they are finalised. They do not yet carry a "last updated" date, because no completed legal review has taken place.',
  },
  {
    heading: 'Contact',
    body: `Questions about these terms can be sent to ${company.email.general}.`,
  },
];

export default function TermsAndConditionsPage() {
  return (
    <div className="page-container section-y">
      <div className="max-w-prose">
        <h1 className="text-page font-semibold tracking-tight text-primary">Terms and Conditions</h1>

        <div className="mt-6 rounded-card border border-default bg-surface p-5">
          <p className="text-body text-secondary">
            These terms are being finalised as {company.legalName} formalises its business
            registration. Nothing below should be read as a completed legal review. If you have
            questions, contact us directly at{' '}
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
