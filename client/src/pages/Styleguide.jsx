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
          Palet, tipografi, dan komponen dasar BakeHouse. Halaman ini hanya untuk pengecekan visual selama
          pengembangan.
        </p>
      </header>

      <Section title="Warna">
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

      <Section title="Tipografi">
        <Card className="flex flex-col gap-4 p-8">
          <p className="eyebrow">Eyebrow label</p>
          <h1 className="text-5xl md:text-6xl">Dipanggang Pagi Ini, dari Paris hingga Tokyo.</h1>
          <h2 className="text-4xl">Heading level 2</h2>
          <h3 className="text-2xl">Heading level 3</h3>
          <p className="max-w-2xl text-base text-espresso">
            Body text 16px dengan line-height yang lega. Roti croissant kami dibuat dengan mentega pilihan dan
            difermentasi perlahan selama 48 jam.
          </p>
          <p className="text-sm text-cocoa">Teks sekunder 14px untuk keterangan dan bantuan.</p>
          <p className="font-serif text-2xl text-espresso">{formatRupiah(45000)}</p>
        </Card>
      </Section>

      <Section title="Tombol">
        <div className="flex flex-wrap items-center gap-4">
          <Button>Lihat Menu</Button>
          <Button variant="outline">Cara Pesan</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Batalkan</Button>
          <Button disabled>Disabled</Button>
          <Button size="sm">Kecil</Button>
          <Button size="lg">Besar</Button>
        </div>
      </Section>

      <Section title="Input dan pilihan">
        <div className="grid gap-6 md:grid-cols-2">
          <Input label="Email" placeholder="nama@email.com" hint="Kami tidak akan membagikan email kamu." />
          <Input label="Kode promo" placeholder="BAKE10" error="Kode promo tidak valid" />
          <Select
            label="Urutkan"
            options={[
              { value: 'newest', label: 'Terbaru' },
              { value: 'price_asc', label: 'Harga terendah' },
              { value: 'price_desc', label: 'Harga tertinggi' },
            ]}
          />
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">Jumlah</span>
            <QuantityStepper value={quantity} max={5} onChange={setQuantity} />
          </div>
        </div>
      </Section>

      <Section title="Badge dan status pesanan">
        <div className="flex flex-wrap items-center gap-3">
          <Badge>Neutral</Badge>
          <Badge tone="honey">France</Badge>
          <Badge tone="sage">Tersedia</Badge>
          <Badge tone="golden">Sisa 3</Badge>
          <Badge tone="berry">Habis</Badge>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {Object.keys(ORDER_STATUS_MAP).map((status) => (
            <StatusPill key={status} status={status} />
          ))}
        </div>
      </Section>

      <Section title="Kartu, skeleton, dan kosong">
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
              Baru
            </Badge>
            <h3 className="text-2xl">Croissant Mentega</h3>
            <p className="text-cocoa">Dipanggang setiap pagi dengan mentega Prancis.</p>
            <p className="mt-auto font-serif text-xl">{formatRupiah(32000)}</p>
          </Card>
          <Card>
            <EmptyState
              icon={Search}
              title="Tidak ada roti yang cocok"
              description="Coba ubah kata kunci atau reset filter."
              action={<Button variant="outline" size="sm">Reset filter</Button>}
            />
          </Card>
        </div>
      </Section>

      <Section title="Pagination dan empty state">
        <Card>
          <EmptyState icon={Package} title="Belum ada pesanan" description="Pesanan kamu akan muncul di sini." />
        </Card>
        <Pagination page={page} totalPages={5} onPageChange={setPage} />
      </Section>
    </Container>
  );
}
