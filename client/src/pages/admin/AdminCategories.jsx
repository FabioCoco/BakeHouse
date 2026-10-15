import { useEffect, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import CategoryFormModal from '../../components/admin/CategoryFormModal.jsx';
import Button from '../../components/ui/Button.jsx';
import Card from '../../components/ui/Card.jsx';
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import Skeleton from '../../components/ui/Skeleton.jsx';
import useFetch from '../../hooks/useFetch.js';
import { categoryService } from '../../services/categoryService.js';

export default function AdminCategories() {
  const [version, setVersion] = useState(0);
  const categories = useFetch(() => categoryService.list(), [version]);
  const items = categories.body?.data ?? [];

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    document.title = 'Categories · Admin BakeHouse';
  }, []);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await categoryService.remove(confirmDelete._id);
      toast.success(`${confirmDelete.name} deleted.`);
      setConfirmDelete(null);
      setVersion((v) => v + 1);
    } catch (err) {
      // 409 means the category still has products. The server message explains what to do.
      toast.error(err.message);
      setConfirmDelete(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-1">
          <p className="eyebrow">Katalog</p>
          <h1 className="text-4xl">Categories</h1>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <Plus size={16} aria-hidden="true" /> Add Category
        </Button>
      </header>

      {categories.loading && <Skeleton className="h-72 w-full" />}
      {categories.error && <p className="text-cocoa">{categories.error.message}</p>}

      {!categories.loading && !categories.error && items.length === 0 && (
        <EmptyState title="No categories yet" description="Add your first category for your products." />
      )}

      {items.length > 0 && (
        <Card className="overflow-hidden">
          <ul className="divide-y divide-line">
            {items.map((category) => (
              <li key={category._id} className="flex items-center justify-between gap-4 px-5 py-4">
                <div className="flex min-w-0 flex-col">
                  <span className="font-medium text-espresso">{category.name}</span>
                  <span className="truncate text-sm text-cocoa">{category.description || 'No description'}</span>
                  <span className="font-mono text-xs text-cocoa">{category.slug}</span>
                </div>
                <div className="flex shrink-0 gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(category);
                      setFormOpen(true);
                    }}
                    aria-label={`Edit category ${category.name}`}
                    className="rounded-full p-2 text-cocoa transition hover:bg-sand/40 hover:text-espresso"
                  >
                    <Pencil size={16} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(category)}
                    aria-label={`Delete category ${category.name}`}
                    className="rounded-full p-2 text-cocoa transition hover:bg-berry/10 hover:text-berry"
                  >
                    <Trash2 size={16} aria-hidden="true" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <CategoryFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        category={editing}
        onSaved={() => {
          setFormOpen(false);
          setVersion((v) => v + 1);
        }}
      />

      <ConfirmDialog
        open={confirmDelete !== null}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        title="Delete this category?"
        description="A category can only be deleted if it has no products."
        confirmLabel="Ya, hapus"
        danger
        loading={deleting}
      />
    </div>
  );
}
