import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Pencil, Plus, Search, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import ProductFormModal from '../../components/admin/ProductFormModal.jsx';
import StockEditor from '../../components/admin/StockEditor.jsx';
import ProductImage from '../../components/product/ProductImage.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import Card from '../../components/ui/Card.jsx';
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import Input from '../../components/ui/Input.jsx';
import Pagination from '../../components/ui/Pagination.jsx';
import Select from '../../components/ui/Select.jsx';
import Skeleton from '../../components/ui/Skeleton.jsx';
import useDebounce from '../../hooks/useDebounce.js';
import useFetch from '../../hooks/useFetch.js';
import useQueryParams from '../../hooks/useQueryParams.js';
import { categoryService } from '../../services/categoryService.js';
import { productService } from '../../services/productService.js';
import { ORIGIN_LABELS } from '../../config/catalog.js';
import { formatRupiah } from '../../utils/formatRupiah.js';

const PAGE_SIZE = 10;

export default function AdminProducts() {
  const [searchParams, setParams] = useQueryParams();
  const category = searchParams.get('category') || '';
  const page = Number(searchParams.get('page')) || 1;
  const urlSearch = searchParams.get('search') || '';

  const [searchInput, setSearchInput] = useState(urlSearch);
  const debouncedSearch = useDebounce(searchInput, 400);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (debouncedSearch.trim() !== urlSearch) {
      setParams({ search: debouncedSearch.trim() || undefined, page: undefined });
    }
    // Only the debounced value triggers the URL update.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const categories = useFetch(() => categoryService.list(), []);
  const categoryList = categories.body?.data ?? [];

  const products = useFetch(
    () =>
      productService.list({
        search: urlSearch || undefined,
        category: category || undefined,
        sort: 'name',
        page,
        limit: PAGE_SIZE,
      }),
    [searchParams.toString(), version],
  );
  const items = products.body?.data ?? [];
  const meta = products.body?.meta;

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    document.title = 'Products · Admin BakeHouse';
  }, []);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (product) => {
    setEditing(product);
    setFormOpen(true);
  };

  const refresh = () => setVersion((v) => v + 1);

  // The public product list only returns active products. Hiding a product removes it from this table.
  const hideFromStore = async (product) => {
    setBusyId(product._id);
    try {
      await productService.update(product._id, { isActive: false });
      toast.success(`${product.name} hidden from the shop.`, { duration: 5000 });
      refresh();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async () => {
    setBusyId(confirmDelete._id);
    try {
      await productService.deactivate(confirmDelete._id);
      toast.success(`${confirmDelete.name} dinonaktifkan.`);
      setConfirmDelete(null);
      refresh();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const handleStockSaved = (updated) => {
    setVersion((v) => v + 1);
    return updated;
  };

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-1">
          <p className="eyebrow">Catalog</p>
          <h1 className="text-4xl">Products</h1>
        </div>
        <Button onClick={openCreate}>
          <Plus size={16} aria-hidden="true" /> Add Product
        </Button>
      </header>

      <Card className="grid gap-4 p-5 md:grid-cols-[1fr_220px] md:items-end">
        <Input
          label="Search products"
          type="search"
          icon={Search}
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          maxLength={100}
        />
        <Select
          label="Category"
          value={category}
          onChange={(event) => setParams({ category: event.target.value || undefined, page: undefined })}
          options={[{ value: '', label: 'All categories' }, ...categoryList.map((c) => ({ value: c.slug, label: c.name }))]}
        />
      </Card>

      <p role="note" className="rounded-xl border border-honey bg-honey/40 p-4 text-sm text-espresso">
        Hidden or deactivated products do not appear in this list. An admin list of all products is not yet available on the server.
      </p>

      {products.loading && <Skeleton className="h-96 w-full" />}
      {products.error && <p className="text-cocoa">{products.error.message}</p>}

      {!products.loading && !products.error && items.length === 0 && (
        <EmptyState title="No products yet" description="Add your first product or change the filter." />
      )}

      {!products.loading && items.length > 0 && (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b border-line bg-sand/20 text-cocoa">
                <tr>
                  <th scope="col" className="px-5 py-3 font-medium">Product</th>
                  <th scope="col" className="px-5 py-3 font-medium">Category</th>
                  <th scope="col" className="px-5 py-3 font-medium">Price</th>
                  <th scope="col" className="px-5 py-3 font-medium">Stock</th>
                  <th scope="col" className="px-5 py-3 font-medium">Visible</th>
                  <th scope="col" className="px-5 py-3 text-right font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {items.map((product) => (
                  <tr key={product._id} className="align-middle">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-10 shrink-0 overflow-hidden rounded-lg bg-sand/40">
                          <ProductImage filename={product.images?.[0]} name={product.name} />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-medium text-espresso">{product.name}</span>
                          <span className="text-xs text-cocoa">{ORIGIN_LABELS[product.origin] ?? product.origin}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <Badge>{product.category?.name ?? '—'}</Badge>
                    </td>
                    <td className="px-5 py-3 font-medium">
                      {formatRupiah(product.isOnSale ? product.effectivePrice : product.price)}
                      {product.isOnSale && (
                        <span className="ml-2 inline-flex items-center gap-2">
                          <s className="text-xs text-cocoa">{formatRupiah(product.price)}</s>
                          <span className="text-xs font-semibold text-crust">-{product.discountPercent}%</span>
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <StockEditor product={product} onSaved={handleStockSaved} />
                    </td>
                    <td className="px-5 py-3">
                      <button
                        type="button"
                        role="switch"
                        aria-checked={product.isActive}
                        aria-label={`Show ${product.name} in shop`}
                        disabled={busyId === product._id}
                        onClick={() => hideFromStore(product)}
                        className={`relative h-6 w-11 rounded-full transition duration-200 disabled:opacity-50 ${
                          product.isActive ? 'bg-sage' : 'bg-line'
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 h-5 w-5 rounded-full bg-surface shadow transition duration-200 ${
                            product.isActive ? 'left-[22px]' : 'left-0.5'
                          }`}
                        />
                      </button>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => openEdit(product)}
                          aria-label={`Edit ${product.name}`}
                          className="rounded-full p-2 text-cocoa transition hover:bg-sand/40 hover:text-espresso"
                        >
                          <Pencil size={16} aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDelete(product)}
                          aria-label={`Nonaktifkan ${product.name}`}
                          className="rounded-full p-2 text-cocoa transition hover:bg-berry/10 hover:text-berry"
                        >
                          <Trash2 size={16} aria-hidden="true" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {meta && (
        <Pagination
          page={meta.page}
          totalPages={meta.totalPages}
          onPageChange={(next) => setParams({ page: next > 1 ? next : undefined })}
        />
      )}

      <ProductFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        product={editing}
        categories={categoryList}
        onSaved={() => {
          setFormOpen(false);
          refresh();
        }}
      />

      <ConfirmDialog
        open={confirmDelete !== null}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        title="Deactivate this product?"
        description="The product will no longer appear in the shop. Existing order history is kept."
        confirmLabel="Ya, nonaktifkan"
        danger
        loading={busyId !== null && confirmDelete !== null}
      />

      <p className="text-sm text-cocoa">
        New category? <Link to="/admin/categories" className="font-medium text-crust hover:underline">Manage categories</Link>.
      </p>
    </div>
  );
}
