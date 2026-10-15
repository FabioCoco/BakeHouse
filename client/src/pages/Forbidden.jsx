import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/ui/Button.jsx';
import Container from '../components/layout/Container.jsx';

export default function Forbidden() {
  useEffect(() => {
    document.title = 'Akses ditolak · BakeHouse';
  }, []);

  return (
    <Container className="flex flex-col items-center gap-4 py-32 text-center">
      <p className="eyebrow">403</p>
      <h1 className="text-5xl">Akses ditolak</h1>
      <p className="text-cocoa">Only admins can open this page.</p>
      <Button as={Link} to="/" variant="outline" className="mt-4">
        Back to home
      </Button>
    </Container>
  );
}
