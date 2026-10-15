import Container from '../layout/Container.jsx';
import ProductCard from '../product/ProductCard.jsx';
import ProductCardSkeleton from '../product/ProductCardSkeleton.jsx';
import SectionHeading from './SectionHeading.jsx';
import RevealOnScroll from './RevealOnScroll.jsx';
import useFetch from '../../hooks/useFetch.js';
import { productService } from '../../services/productService.js';

// Up to four products with a discount that is active right now, biggest discount first.
// Hidden when nothing is on sale, so the home page never shows an empty promo block.
export default function OnSaleSection() {
  const { body, loading, error } = useFetch(
    () => productService.list({ onSale: true, sort: 'discount', limit: 4 }),
    [],
  );
  const products = body?.data ?? [];

  if (!loading && (error || products.length === 0)) return null;

  return (
    <section aria-labelledby="promo-title" className="py-20">
      <Container className="flex flex-col gap-10">
        <RevealOnScroll>
          <SectionHeading eyebrow="This week only" title="On sale now" titleId="promo-title" linkTo="/products?onSale=true" />
        </RevealOnScroll>

        {loading ? (
          <div className="grid grid-cols-2 gap-4 md:gap-6 lg:grid-cols-4">
            {Array.from({ length: 4 }, (_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:gap-6 lg:grid-cols-4">
            {products.map((product) => (
              <RevealOnScroll key={product._id} className="h-full">
                <ProductCard product={product} />
              </RevealOnScroll>
            ))}
          </div>
        )}
      </Container>
    </section>
  );
}
