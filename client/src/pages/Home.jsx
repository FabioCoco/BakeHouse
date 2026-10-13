import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Container from '../components/layout/Container.jsx';

// Placeholder for phase 0. The hero and home sections are built in phase 2.
export default function Home() {
  useEffect(() => {
    document.title = 'BakeHouse · Roti Artisan';
  }, []);

  return (
    <Container className="flex flex-col items-center gap-4 py-32 text-center">
      <p className="eyebrow">Phase 0</p>
      <h1 className="text-5xl md:text-6xl">Beranda akan dibangun di phase 2.</h1>
      <Link to="/styleguide" className="mt-4 font-medium text-crust underline underline-offset-4">
        Buka styleguide
      </Link>
    </Container>
  );
}
