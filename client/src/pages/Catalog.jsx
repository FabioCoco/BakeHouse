import { useEffect, useState } from 'react';
import { PackageSearch } from 'lucide-react';
import Container from '../components/layout/Container.jsx';
import FilterBar from '../components/catalog/FilterBar.jsx';
import ProductCard from '../components/product/ProductCard.jsx';
import ProductCardSkeleton from '../components/product/ProductCardSkeleton.jsx';
import Button from '../components/ui/Button.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import Pagination from '../components/ui/Pagination.jsx';
import useFetch from '../hooks/useFetch.js';
import useQueryParams from '../hooks/useQueryParams.js';
import { categoryService } from '../services/categoryService.js';
import { productService } from '../services/productService.js';
import { PRODUCTS_PER_PAGE } from '../config/catalog.js';

const RESET = { search: undefined, category: undefined, origin: undefined, sort: undefined, onSale: undefined, page: undefined };

// All filters live in the URL, so a filtered view can be shared or reloaded.
export default function Catalog() {
  const [searchParams, setParams] = useQueryParams();

  const params = {
    search: searchParams.get('search') || undefined,
    category: searchParams.get('category') || undefined,
    origin: searchParams.get('origin') || undefined,
    sort: searchParams.get('sort') || undefined,
    onSale: searchParams.get('onSale') === 'true' ? true : undefined,
    page: Number(searchParams.get('page')) || 1,
  };
  const queryKey = searchParams.toString();
  const [retryCount, setRetryCount] = useState(0);

  const categories = useFetch(() => categoryService.list(), []);
  const products = useFetch(
    () => productService.list({ ...params, limit: PRODUCTS_PER_PAGE }),
    [queryKey, retryCount],
  );

  useEffect(() => {
    document.title = 'Menu · BakeHouse';
  }, []);

  const items = products.body?.data ?? [];
  const meta = products.body?.meta;
  const hasFilters = Boolean(params.search || params.category || params.origin || params.sort || params.onSale);

  const handleChange = (updates) => setParams(updates);

  const handlePageChange = (page) => {
    setParams({ page: page > 1 ? page : undefined });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <Container className="flex flex-col gap-10 py-12 md:py-16">
      <header className="flex flex-col gap-3">
        <p className="eyebrow">Katalog</p>
        <h1 className="text-5xl md:text-6xl">Our Bread Menu</h1>
      </header>

      <FilterBar
        params={params}
        categories={categories.body?.data ?? []}
        onChange={handleChange}
        onReset={() => setParams(RESET)}
      />

      {!products.loading && !products.error && meta && (
        <p className="text-sm text-cocoa" aria-live="polite">
          {meta.total} breads found
        </p>
      )}

      {products.loading && (
        <div className="grid grid-cols-2 gap-4 md:gap-6 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: PRODUCTS_PER_PAGE }, (_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      )}

      {products.error && (
        <EmptyState
          icon={PackageSearch}
          title="Menu could not be loaded"
          description={products.error.message}
          action={
            <Button variant="outline" onClick={() => setRetryCount((count) => count + 1)}>
              Try again
            </Button>
          }
        />
      )}

      {!products.loading && !products.error && items.length === 0 && (
        <EmptyState
          icon={PackageSearch}
          title="No breads match"
          description="Try a different keyword or reset the filters."
          action={
            hasFilters ? (
              <Button variant="outline" onClick={() => setParams(RESET)}>
                Reset filter
              </Button>
            ) : null
          }
        />
      )}

      {!products.loading && !products.error && items.length > 0 && (
        <div className="grid grid-cols-2 gap-4 md:gap-6 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      )}

      {meta && (
        <Pagination page={meta.page} totalPages={meta.totalPages} onPageChange={handlePageChange} />
      )}
    </Container>
  );
}
