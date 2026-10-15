import Container from '../layout/Container.jsx';
import ProductCard from '../product/ProductCard.jsx';
import ProductCardSkeleton from '../product/ProductCardSkeleton.jsx';
import EmptyState from '../ui/EmptyState.jsx';
import SectionHeading from './SectionHeading.jsx';
import RevealOnScroll from './RevealOnScroll.jsx';
import useFetch from '../../hooks/useFetch.js';
import { productService } from '../../services/productService.js';

// The 8 newest products, as the brief requires.
export default function NewArrivals() {
  const { body, loading, error } = useFetch(() => productService.list({ sort: 'newest', limit: 8 }), []);
  const products = body?.data ?? [];

  return (
    <section aria-labelledby="baru-title" className="py-20">
      <Container className="flex flex-col gap-10">
        <RevealOnScroll>
          <SectionHeading eyebrow="Latest menu" title="Fresh from the oven" titleId="baru-title" linkTo="/products" />
        </RevealOnScroll>

        {loading && (
          <div className="grid grid-cols-2 gap-4 md:gap-6 lg:grid-cols-4">
            {Array.from({ length: 8 }, (_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        )}

        {error && <p className="text-cocoa">The menu could not be loaded. Try reloading the page.</p>}

        {!loading && !error && products.length === 0 && (
          <EmptyState title="Menu coming soon" description="New bread will appear here soon." />
        )}

        {!loading && !error && products.length > 0 && (
          <div className="grid grid-cols-2 gap-4 md:gap-6 lg:grid-cols-4">
            {products.map((product, index) => (
              <RevealOnScroll key={product._id} className="h-full">
                <ProductCard product={product} priority={index < 2} />
              </RevealOnScroll>
            ))}
          </div>
        )}
      </Container>
    </section>
  );
}
