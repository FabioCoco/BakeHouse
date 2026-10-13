import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/ui/Button.jsx';
import Container from '../components/layout/Container.jsx';

export default function NotFound() {
  useEffect(() => {
    document.title = 'Halaman tidak ditemukan · BakeHouse';
  }, []);

  return (
    <Container className="flex flex-col items-center gap-4 py-32 text-center">
      <p className="eyebrow">404</p>
      <h1 className="text-5xl">Halaman tidak ditemukan</h1>
      <p className="text-cocoa">Roti yang kamu cari mungkin sudah habis terjual.</p>
      <Button as={Link} to="/" className="mt-4">
        Kembali ke beranda
      </Button>
    </Container>
  );
}
