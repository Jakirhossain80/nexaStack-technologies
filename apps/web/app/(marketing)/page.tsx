import type { Metadata } from 'next';

import { FAQ } from '@/components/sections/FAQ';
import { FeaturedPortfolio } from '@/components/sections/FeaturedPortfolio';
import { FeaturedServices } from '@/components/sections/FeaturedServices';
import { FinalCTA } from '@/components/sections/FinalCTA';
import { Hero } from '@/components/sections/Hero';
import { ProcessTimeline } from '@/components/sections/ProcessTimeline';
import { SolutionsIndustries } from '@/components/sections/SolutionsIndustries';
import { TechnologyStack } from '@/components/sections/TechnologyStack';
import { Testimonials } from '@/components/sections/Testimonials';
import { WhyChooseNexaStack } from '@/components/sections/WhyChooseNexaStack';
import { homeContent } from '@/config/content/home';

// Title/description are intentionally left unset here — the root layout's real,
// already-correct defaults already describe the homepage. This export exists only to give the
// homepage the `alternates.canonical` tag every other static page already has.
export const metadata: Metadata = {
  alternates: { canonical: '/' },
};

export default function HomePage() {
  return (
    <>
      <Hero content={homeContent.hero} />
      <FeaturedServices content={homeContent.featuredServices} />
      <SolutionsIndustries content={homeContent.solutions} />
      <FeaturedPortfolio content={homeContent.portfolio} />
      <TechnologyStack content={homeContent.technology} />
      <WhyChooseNexaStack content={homeContent.whyChoose} />
      <ProcessTimeline content={homeContent.process} />
      <Testimonials />
      <FAQ content={homeContent.faq} />
      <FinalCTA />
    </>
  );
}
