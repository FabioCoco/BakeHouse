import { useEffect, useState } from 'react';
import { Package, Search } from 'lucide-react';
import Badge from '../components/ui/Badge.jsx';
import Button from '../components/ui/Button.jsx';
import Card from '../components/ui/Card.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import Input from '../components/ui/Input.jsx';
import Pagination from '../components/ui/Pagination.jsx';
import QuantityStepper from '../components/ui/QuantityStepper.jsx';
import Select from '../components/ui/Select.jsx';
import Skeleton from '../components/ui/Skeleton.jsx';
import StatusPill from '../components/ui/StatusPill.jsx';
import { formatRupiah } from '../utils/formatRupiah.js';
import { ORDER_STATUS_MAP } from '../utils/statusMap.js';
import Container from '../components/layout/Container.jsx';

const COLORS = [
  { name: 'cream', token: 'bg-cream', hex: '#F7EFE4', text: 'text-espresso' },
  { name: 'surface', token: 'bg-surface', hex: '#FFFAF3', text: 'text-espresso' },
  { name: 'sand', token: 'bg-sand', hex: '#D9C1A7', text: 'text-espresso' },
  { name: 'sand-dark', token: 'bg-sand-dark', hex: '#C8A98A', text: 'text-espresso' },
  { name: 'espresso', token: 'bg-espresso', hex: '#2B1A10', text: 'text-surface' },
  { name: 'cocoa', token: 'bg-cocoa', hex: '#6B5444', text: 'text-surface' },
  { name: 'line', token: 'bg-line', hex: '#E8DCCB', text: 'text-espresso' },
  { name: 'crust', token: 'bg-crust', hex: '#8A4B1C', text: 'text-surface' },
  { name: 'crust-hover', token: 'bg-crust-hover', hex: '#723D16', text: 'text-surface' },
  { name: 'golden', token: 'bg-golden', hex: '#E3A35C', text: 'text-espresso' },
  { name: 'sage', token: 'bg-sage', hex: '#6E7F5E', text: 'text-surface' },
  { name: 'berry', token: 'bg-berry', hex: '#A3413A', text: 'text-surface' },
  { name: 'honey', token: 'bg-honey', hex: '#F3D9B1', text: 'text-espresso' },
];

const Section = ({ title, children }) => (
  <section className="flex flex-col gap-5">
    <h2 className="border-b border-line pb-3 text-3xl">{title}</h2>
    {children}
  </section>
);

export default function Styleguide() {
  const [quantity, setQuantity] = useState(2);
  const [page, setPage] = useState(2);

  useEffect(() => {
    document.title = 'Styleguide · BakeHouse';
  }, []);

  return (
    <Container className="flex flex-col gap-16 py-16">
      <header className="flex flex-col gap-3">
        <p className="eyebrow">Internal</p>
        <h1 className="text-5xl md:text-6xl">Styleguide</h1>
        <p className="max-w-2xl text-cocoa">
          Colors, typography, and base components for BakeHouse. This page is for visual checks during development only.
        </p>
      </header>

      <Section title="Colors">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {COLORS.map((color) => (
            <div key={color.name} className="overflow-hidden rounded-2xl border border-line bg-surface">
              <div className={`flex h-24 items-end p-3 ${color.token}`}>
                <span className={`text-sm font-semibold ${color.text}`}>{color.name}</span>
              </div>
              <p className="px-3 py-2 font-mono text-xs text-cocoa">{color.hex}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Typography">
        <Card className="flex flex-col gap-4 p-8">
          <p className="eyebrow">Eyebrow label</p>
          <h1 className="text-5xl md:text-6xl">Baked this morning, from Paris to Tokyo.</h1>
          <h2 className="text-4xl">Heading level 2</h2>
          <h3 className="text-2xl">Heading level 3</h3>
          <p className="max-w-2xl text-base text-espresso">
            Body text at 16px with a generous line height. Our croissants are made with premium butter and slowly fermented for 48 hours.
          </p>
          <p className="text-sm text-cocoa">Secondary text at 14px for captions and help.</p>
          <p className="font-serif text-2xl text-espresso">{formatRupiah(45000)}</p>
        </Card>
      </Section>

      <Section title="Buttons">
        <div className="flex flex-wrap items-center gap-4">
          <Button>View menu</Button>
          <Button variant="outline">How to order</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Cancel</Button>
          <Button disabled>Disabled</Button>
          <Button size="sm">Small</Button>
          <Button size="lg">Large</Button>
        </div>
      </Section>

      <Section title="Inputs and choices">
        <div className="grid gap-6 md:grid-cols-2">
          <Input label="Email" placeholder="name@email.com" hint="We will never share your email." />
          <Input label="Promo code" placeholder="BAKE10" error="Promo code is not valid" />
          <Select
            label="Sort"
            options={[
              { value: 'newest', label: 'Newest' },
              { value: 'price_asc', label: 'Lowest price' },
              { value: 'price_desc', label: 'Highest price' },
            ]}
          />
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">Quantity</span>
            <QuantityStepper value={quantity} max={5} onChange={setQuantity} />
          </div>
        </div>
      </Section>

      <Section title="Badges and order status">
        <div className="flex flex-wrap items-center gap-3">
          <Badge>Neutral</Badge>
          <Badge tone="honey">France</Badge>
          <Badge tone="sage">In stock</Badge>
          <Badge tone="golden">3 left</Badge>
          <Badge tone="berry">Sold out</Badge>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {Object.keys(ORDER_STATUS_MAP).map((status) => (
            <StatusPill key={status} status={status} />
          ))}
        </div>
      </Section>

      <Section title="Cards, skeleton, and empty state">
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="overflow-hidden">
            <Skeleton className="aspect-[4/5] w-full rounded-none" />
            <div className="flex flex-col gap-2 p-5">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-6 w-2/3" />
            </div>
          </Card>
          <Card className="flex flex-col gap-3 p-6">
            <Badge tone="honey" className="self-start">
              New
            </Badge>
            <h3 className="text-2xl">Butter Croissant</h3>
            <p className="text-cocoa">Baked every morning with French butter.</p>
            <p className="mt-auto font-serif text-xl">{formatRupiah(32000)}</p>
          </Card>
          <Card>
            <EmptyState
              icon={Search}
              title="No breads match"
              description="Try a different keyword or reset the filters."
              action={<Button variant="outline" size="sm">Reset filters</Button>}
            />
          </Card>
        </div>
      </Section>

      <Section title="Pagination and empty state">
        <Card>
          <EmptyState icon={Package} title="No orders yet" description="Your orders will appear here." />
        </Card>
        <Pagination page={page} totalPages={5} onPageChange={setPage} />
      </Section>
    </Container>
  );
}
