import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Container from '../components/layout/Container.jsx';
import ProductCard from '../components/product/ProductCard.jsx';
import ProductCardSkeleton from '../components/product/ProductCardSkeleton.jsx';
import ProductImage from '../components/product/ProductImage.jsx';
import StockBadge from '../components/product/StockBadge.jsx';
import Badge from '../components/ui/Badge.jsx';
import Button from '../components/ui/Button.jsx';
import QuantityStepper from '../components/ui/QuantityStepper.jsx';
import Skeleton from '../components/ui/Skeleton.jsx';
import useFetch from '../hooks/useFetch.js';
import { productService } from '../services/productService.js';
import { ORIGIN_LABELS } from '../config/catalog.js';
import { formatRupiah } from '../utils/formatRupiah.js';
import NotFound from './NotFound.jsx';

export default function ProductDetail() {
  const { slug } = useParams();
  const [quantity, setQuantity] = useState(1);

  const detail = useFetch(() => productService.getBySlug(slug), [slug]);
  const product = detail.body?.data;
  const categorySlug = product?.category?.slug;

  // Related items come from the same category, minus the current product.
  const related = useFetch(
    () =>
      product
        ? productService.list({ category: categorySlug, limit: 5 }).then((body) => ({
            ...body,
            data: body.data.filter((item) => item._id !== product._id).slice(0, 4),
          }))
        : Promise.resolve({ data: [] }),
    [product?._id],
  );

  useEffect(() => {
    document.title = product ? `${product.name} · BakeHouse` : 'Memuat roti · BakeHouse';
    setQuantity(1);
    window.scrollTo({ top: 0 });
  }, [slug, product?.name]);

  if (detail.loading) {
    return <ProductSkeleton />;
  }

  if (detail.error?.status === 404) {
    return <NotFound />;
  }

  if (detail.error) {
    return (
      <Container className="py-24 text-center">
        <p className="text-cocoa">Roti ini belum bisa dimuat. Coba muat ulang halaman.</p>
      </Container>
    );
  }

  const { name, description, price, stock, origin, images, category } = product;
  const soldOut = stock <= 0;
  const quantityValue = soldOut ? 0 : Math.min(Math.max(quantity, 1), stock);
  const relatedItems = related.body?.data ?? [];

  return (
    <Container className="flex flex-col gap-16 py-10 md:py-16">
      <nav aria-label="Breadcrumb">
        <ol className="flex flex-wrap items-center gap-2 text-sm text-cocoa">
          <li>
            <Link to="/" className="hover:text-espresso">
              Beranda
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link to="/products" className="hover:text-espresso">
              Menu
            </Link>
          </li>
          {category && (
            <>
              <li aria-hidden="true">/</li>
              <li>
                <Link to={`/products?category=${category.slug}`} className="hover:text-espresso">
                  {category.name}
                </Link>
              </li>
            </>
          )}
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="font-medium text-espresso">
            {name}
          </li>
        </ol>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
        <div className="aspect-[4/5] overflow-hidden rounded-2xl border border-line bg-sand/40 shadow-soft">
          <ProductImage filename={images?.[0]} name={name} priority sizes="(min-width: 1024px) 50vw, 100vw" />
        </div>

        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap items-center gap-2">
            {category && <Badge>{category.name}</Badge>}
            <Badge tone="honey">{ORIGIN_LABELS[origin] ?? origin}</Badge>
          </div>

          <h1 className="text-5xl md:text-6xl">{name}</h1>
          <p className="font-serif text-3xl text-espresso">{formatRupiah(price)}</p>
          <div>
            <StockBadge stock={stock} />
          </div>

          <p className="text-base leading-relaxed text-cocoa">{description}</p>

          <div className="flex flex-col gap-4 border-t border-line pt-6 sm:flex-row sm:items-center">
            <QuantityStepper
              label={`Jumlah ${name}`}
              value={quantityValue}
              min={1}
              max={stock}
              disabled={soldOut}
              onChange={setQuantity}
            />
            <Button
              size="lg"
              disabled
              className="flex-1"
              aria-describedby="keranjang-note"
            >
              {soldOut ? 'Stok habis' : 'Tambah ke Keranjang'}
            </Button>
          </div>
          <p id="keranjang-note" className="text-sm text-cocoa">
            Keranjang belanja dihubungkan pada phase 3.
          </p>
        </div>
      </div>

      {(related.loading || relatedItems.length > 0) && (
        <section aria-labelledby="related-title" className="flex flex-col gap-8">
          <div className="flex flex-col gap-2">
            <p className="eyebrow">Masih dari {category?.name}</p>
            <h2 id="related-title" className="text-4xl">
              Roti Lainnya
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-4 md:gap-6 lg:grid-cols-4">
            {related.loading
              ? Array.from({ length: 4 }, (_, i) => <ProductCardSkeleton key={i} />)
              : relatedItems.map((item) => <ProductCard key={item._id} product={item} />)}
          </div>
        </section>
      )}
    </Container>
  );
}

function ProductSkeleton() {
  return (
    <Container className="grid gap-10 py-16 lg:grid-cols-2 lg:gap-16" aria-busy="true">
      <Skeleton className="aspect-[4/5] w-full" />
      <div className="flex flex-col gap-5">
        <Skeleton className="h-5 w-1/3" />
        <Skeleton className="h-14 w-4/5" />
        <Skeleton className="h-8 w-1/4" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-12 w-2/3" />
      </div>
    </Container>
  );
}
