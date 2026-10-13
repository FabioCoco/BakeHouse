import Container from './Container.jsx';

// Placeholder footer for phase 0. Address, hours and payment note are filled in phase 2.
export default function Footer() {
  return (
    <footer className="mt-24 border-t border-line bg-cream">
      <Container className="py-10 text-sm text-cocoa">
        <p className="font-serif text-lg text-espresso">BakeHouse</p>
        <p>© {new Date().getFullYear()} BakeHouse. Semua hak dilindungi.</p>
      </Container>
    </footer>
  );
}
