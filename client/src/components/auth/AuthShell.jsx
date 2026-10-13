import { Link } from 'react-router-dom';
import Container from '../layout/Container.jsx';
import Card from '../ui/Card.jsx';

// Centered card used by the login and register pages.
export default function AuthShell({ eyebrow, title, description, footer, children }) {
  return (
    <Container className="flex justify-center py-16 md:py-24">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-8 block text-center font-serif text-2xl font-semibold text-espresso">
          BakeHouse
        </Link>
        <Card className="flex flex-col gap-6 p-8">
          <header className="flex flex-col gap-2">
            <p className="eyebrow">{eyebrow}</p>
            <h1 className="text-4xl">{title}</h1>
            {description && <p className="text-cocoa">{description}</p>}
          </header>
          {children}
        </Card>
        {footer && <div className="mt-6 text-center text-sm text-cocoa">{footer}</div>}
      </div>
    </Container>
  );
}
