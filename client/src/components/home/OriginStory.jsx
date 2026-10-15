import { Link } from 'react-router-dom';
import Container from '../layout/Container.jsx';
import Card from '../ui/Card.jsx';
import SectionHeading from './SectionHeading.jsx';
import RevealOnScroll from './RevealOnScroll.jsx';

const ORIGINS = [
  {
    key: 'france',
    title: 'France',
    copy: 'Butter-laminated croissants and viennoiserie, hand-folded and baked every morning.',
    to: '/products?origin=France',
    tone: 'bg-honey',
  },
  {
    key: 'japan',
    title: 'Japan',
    copy: 'Soft milk bread and filled buns inspired by small bakeries in Tokyo.',
    to: '/products?origin=Japan',
    tone: 'bg-sand',
  },
  {
    key: 'europe',
    title: 'Europe',
    copy: 'Sourdough and cookies from Germany and Italy, made with patient, honest recipes.',
    to: '/products',
    tone: 'bg-sand-dark/50',
  },
];

export default function OriginStory() {
  return (
    <section aria-labelledby="asal-title" className="py-20">
      <Container className="flex flex-col gap-10">
        <RevealOnScroll>
          <SectionHeading eyebrow="Our inspiration" title="Where our bread comes from" titleId="asal-title" />
        </RevealOnScroll>

        <div className="grid gap-6 md:grid-cols-3">
          {ORIGINS.map((origin, index) => (
            <RevealOnScroll key={origin.key} className="h-full" style={{ transitionDelay: `${index * 80}ms` }}>
              <Card className="flex h-full flex-col gap-4 p-8">
                <span className={`flex h-12 w-12 items-center justify-center rounded-full font-serif text-xl text-crust ${origin.tone}`}>
                  {index + 1}
                </span>
                <h3 className="text-3xl">{origin.title}</h3>
                <p className="text-cocoa">{origin.copy}</p>
                <Link
                  to={origin.to}
                  className="mt-auto pt-2 text-sm font-medium text-crust underline-offset-4 transition hover:text-crust-hover hover:underline"
                >
                  See {origin.title} bread →
                </Link>
              </Card>
            </RevealOnScroll>
          ))}
        </div>
      </Container>
    </section>
  );
}
