import { FeaturedServices } from '@/components/sections/FeaturedServices';
import { Hero } from '@/components/sections/Hero';
import { SolutionsIndustries } from '@/components/sections/SolutionsIndustries';
import { homeContent } from '@/config/content/home';

export default function HomePage() {
  return (
    <>
      <Hero content={homeContent.hero} />
      <FeaturedServices content={homeContent.featuredServices} />
      <SolutionsIndustries content={homeContent.solutions} />
    </>
  );
}
