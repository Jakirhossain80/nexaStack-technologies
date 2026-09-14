import { FeaturedPortfolio } from '@/components/sections/FeaturedPortfolio';
import { FeaturedServices } from '@/components/sections/FeaturedServices';
import { Hero } from '@/components/sections/Hero';
import { SolutionsIndustries } from '@/components/sections/SolutionsIndustries';
import { TechnologyStack } from '@/components/sections/TechnologyStack';
import { WhyChooseNexaStack } from '@/components/sections/WhyChooseNexaStack';
import { homeContent } from '@/config/content/home';

export default function HomePage() {
  return (
    <>
      <Hero content={homeContent.hero} />
      <FeaturedServices content={homeContent.featuredServices} />
      <SolutionsIndustries content={homeContent.solutions} />
      <FeaturedPortfolio content={homeContent.portfolio} />
      <TechnologyStack content={homeContent.technology} />
      <WhyChooseNexaStack content={homeContent.whyChoose} />
    </>
  );
}
