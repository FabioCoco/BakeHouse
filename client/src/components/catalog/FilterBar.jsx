import { useEffect, useState } from 'react';
import { Search, X } from 'lucide-react';
import Input from '../ui/Input.jsx';
import Select from '../ui/Select.jsx';
import useDebounce from '../../hooks/useDebounce.js';
import { ORIGINS, ORIGIN_LABELS, SORT_OPTIONS } from '../../config/catalog.js';

// Search, category chips, origin, and sort. Every value is passed in from the URL, so filters survive reloads.
export default function FilterBar({ params, categories, onChange, onReset }) {
  const [searchInput, setSearchInput] = useState(params.search ?? '');
  const debouncedSearch = useDebounce(searchInput, 400);

  // Push the debounced search to the URL. Skip when it already matches, so the page does not reset on mount.
  useEffect(() => {
    if (debouncedSearch !== (params.search ?? '')) {
      onChange({ search: debouncedSearch.trim() || undefined, page: undefined });
    }
    // Only react to the debounced value. `params` and `onChange` are read at that moment.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  // Keep the input in sync when filters are reset from elsewhere on the page.
  useEffect(() => {
    setSearchInput(params.search ?? '');
  }, [params.search]);

  const hasFilters = Boolean(params.search || params.category || params.origin || params.sort);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 md:grid-cols-[1fr_auto_auto] md:items-end">
        <Input
          label="Cari roti"
          type="search"
          name="search"
          icon={Search}
          placeholder="Croissant, sourdough, matcha…"
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          maxLength={100}
        />

        <Select
          label="Asal"
          value={params.origin ?? ''}
          onChange={(event) => onChange({ origin: event.target.value || undefined, page: undefined })}
          options={[{ value: '', label: 'Semua asal' }, ...ORIGINS.map((o) => ({ value: o, label: ORIGIN_LABELS[o] }))]}
        />

        <Select
          label="Urutkan"
          value={params.sort ?? 'newest'}
          onChange={(event) => onChange({ sort: event.target.value === 'newest' ? undefined : event.target.value, page: undefined })}
          options={SORT_OPTIONS}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Kategori">
        <CategoryChip
          active={!params.category}
          onClick={() => onChange({ category: undefined, page: undefined })}
          label="Semua"
        />
        <CategoryChip
          active={Boolean(params.onSale)}
          onClick={() => onChange({ onSale: params.onSale ? undefined : 'true', page: undefined })}
          label="Promo"
        />
        {categories.map((category) => (
          <CategoryChip
            key={category._id}
            active={params.category === category.slug}
            onClick={() => onChange({ category: category.slug, page: undefined })}
            label={category.name}
          />
        ))}
        {hasFilters && (
          <button
            type="button"
            onClick={() => {
              setSearchInput('');
              onReset();
            }}
            className="ml-auto inline-flex items-center gap-1 rounded-full px-3 py-2 text-sm font-medium text-crust transition hover:bg-crust/10"
          >
            <X size={14} aria-hidden="true" />
            Reset filter
          </button>
        )}
      </div>
    </div>
  );
}

function CategoryChip({ active, onClick, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full border px-4 py-2 text-sm font-medium transition duration-200 ${
        active
          ? 'border-crust bg-crust text-surface'
          : 'border-line bg-surface text-cocoa hover:border-sand-dark hover:text-espresso'
      }`}
    >
      {label}
    </button>
  );
}
