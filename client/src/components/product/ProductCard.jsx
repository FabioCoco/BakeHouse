import { Link } from 'react-router-dom';
import Badge from '../ui/Badge.jsx';
import Card from '../ui/Card.jsx';
import ProductImage from './ProductImage.jsx';
import StockBadge from './StockBadge.jsx';
import { formatRupiah } from '../../utils/formatRupiah.js';
import { ORIGIN_LABELS } from '../../config/catalog.js';

export default function ProductCard({ product, priority = false }) {
  const { name, slug, price, stock, origin, images } = product;

  return (
    <Card as="article" className="group flex h-full flex-col overflow-hidden transition duration-200 motion-safe:hover:-translate-y-0.5 hover:shadow-lg">
      <Link to={`/products/${slug}`} className="flex h-full flex-col rounded-2xl">
        <div className="aspect-[4/5] overflow-hidden bg-sand/40">
          <div className="h-full w-full transition duration-300 motion-safe:group-hover:scale-[1.03]">
            <ProductImage
              filename={images?.[0]}
              name={name}
              priority={priority}
              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
            />
          </div>
        </div>
        <div className="flex flex-1 flex-col gap-2 p-5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="honey">{ORIGIN_LABELS[origin] ?? origin}</Badge>
            <StockBadge stock={stock} />
          </div>
          <h3 className="text-xl">{name}</h3>
          <p className="mt-auto pt-2 font-serif text-lg text-espresso">{formatRupiah(price)}</p>
        </div>
      </Link>
    </Card>
  );
}
