import { Link } from 'react-router-dom';
import Skeleton from '../ui/Skeleton.jsx';
import useFetch from '../../hooks/useFetch.js';
import { categoryService } from '../../services/categoryService.js';

// Six categories from the API. Scrolls sideways on mobile, wraps on desktop.
export default function CategoryStrip() {
  const { body, loading, error } = useFetch(() => categoryService.list(), []);
  const categories = body?.data ?? [];

  return (
    <section id="kategori" aria-labelledby="kategori-title" className="scroll-mt-20 py-14">
      <h2 id="kategori-title" className="sr-only">
        Kategori roti
      </h2>

      {loading && (
        <div className="flex gap-3 overflow-hidden">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-11 w-36 shrink-0 rounded-full" />
          ))}
        </div>
      )}

      {error && <p className="text-cocoa">Kategori belum bisa dimuat.</p>}

      {!loading && !error && (
        <ul className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 md:mx-0 md:flex-wrap md:justify-center md:overflow-visible md:px-0">
          {categories.map((category) => (
            <li key={category._id} className="snap-start shrink-0">
              <Link
                to={`/products?category=${category.slug}`}
                className="flex flex-col rounded-2xl border border-line bg-surface px-5 py-3 transition duration-200 hover:-translate-y-0.5 hover:border-sand-dark hover:shadow-soft"
              >
                <span className="text-sm font-semibold text-espresso">{category.name}</span>
                {category.description && (
                  <span className="mt-0.5 max-w-56 text-xs text-cocoa">{category.description}</span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
