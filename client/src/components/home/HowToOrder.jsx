import Container from '../layout/Container.jsx';
import Card from '../ui/Card.jsx';
import SectionHeading from './SectionHeading.jsx';
import RevealOnScroll from './RevealOnScroll.jsx';

const STEPS = [
  {
    title: 'Choose your bread',
    copy: 'Add your favorite bread to the cart. Stock updates instantly.',
  },
  {
    title: 'Pay securely',
    copy: 'Review your order and pay securely through Midtrans at checkout.',
  },
  {
    title: 'We deliver',
    copy: 'Once payment is confirmed, we bake and deliver to your address.',
  },
];

export default function HowToOrder() {
  return (
    <section id="cara-pesan" aria-labelledby="cara-pesan-title" className="scroll-mt-24 bg-surface py-20">
      <Container className="flex flex-col gap-10">
        <RevealOnScroll>
          <SectionHeading eyebrow="Simple" title="How to order" titleId="cara-pesan-title" />
        </RevealOnScroll>

        <ol className="grid gap-6 md:grid-cols-3">
          {STEPS.map((step, index) => (
            <RevealOnScroll as="li" key={step.title} className="h-full" style={{ transitionDelay: `${index * 80}ms` }}>
              <Card className="flex h-full flex-col gap-3 p-8">
                <span className="font-serif text-5xl text-golden" aria-hidden="true">
                  {index + 1}
                </span>
                <h3 className="text-2xl">{step.title}</h3>
                <p className="text-cocoa">{step.copy}</p>
              </Card>
            </RevealOnScroll>
          ))}
        </ol>
      </Container>
    </section>
  );
}
