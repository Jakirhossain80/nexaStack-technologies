import { Hero } from '@/components/sections/Hero';
import { homeContent } from '@/config/content/home';

export default function HomePage() {
  return <Hero content={homeContent.hero} />;
}
