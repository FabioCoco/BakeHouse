import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/ui/Button.jsx';
import Container from '../components/layout/Container.jsx';

export default function NotFound() {
  useEffect(() => {
    document.title = 'Page not found · BakeHouse';
  }, []);

  return (
    <Container className="flex flex-col items-center gap-4 py-32 text-center">
      <p className="eyebrow">404</p>
      <h1 className="text-5xl">Page not found</h1>
      <p className="text-cocoa">The bread you are looking for may have sold out.</p>
      <Button as={Link} to="/" className="mt-4">
        Back to home
      </Button>
    </Container>
  );
}
