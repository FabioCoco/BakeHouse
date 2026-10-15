import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import HeroVideo from '../components/home/HeroVideo.jsx';
import BannerCarousel from '../components/home/BannerCarousel.jsx';
import CategoryStrip from '../components/home/CategoryStrip.jsx';
import NewArrivals from '../components/home/NewArrivals.jsx';
import OnSaleSection from '../components/home/OnSaleSection.jsx';
import OriginStory from '../components/home/OriginStory.jsx';
import HowToOrder from '../components/home/HowToOrder.jsx';

export default function Home() {
  const { hash } = useLocation();

  useEffect(() => {
    document.title = 'BakeHouse · Artisan Bread';
  }, []);

  // Client-side navigation to /#cara-pesan does not scroll on its own, so scroll to the anchor here.
  useEffect(() => {
    if (!hash) return;
    document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [hash]);

  return (
    <>
      <HeroVideo />
      <BannerCarousel />
      <CategoryStrip />
      <OnSaleSection />
      <NewArrivals />
      <OriginStory />
      <HowToOrder />
    </>
  );
}
