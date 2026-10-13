import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { productService } from '../../services/productService.js';

// Inline stock editor. Click the number, type a new absolute value, press Enter to save or Escape to cancel.
export default function StockEditor({ product, onSaved }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(product.stock));
  const [saving, setSaving] = useState(false);
  const inputRef = useRef(null);
  // Enter and Escape both remove the input, which can fire a blur. These refs stop a second save or a save after Escape.
  const savingRef = useRef(false);
  const skipBlurRef = useRef(false);

  useEffect(() => {
    if (editing) {
      skipBlurRef.current = false;
      inputRef.current?.select();
    }
  }, [editing]);

  // Closes the editor without saving. The blur from unmounting must not save.
  const close = () => {
    skipBlurRef.current = true;
    setEditing(false);
  };

  const cancel = () => {
    setValue(String(product.stock));
    close();
  };

  const save = async () => {
    if (savingRef.current) return;

    const next = Number(value);
    if (!Number.isInteger(next) || next < 0) {
      toast.error('Stok harus bilangan bulat, minimal 0.');
      return;
    }
    if (next === product.stock) {
      close();
      return;
    }

    savingRef.current = true;
    setSaving(true);
    try {
      const updated = await productService.setStock(product._id, { stock: next });
      toast.success(`Stok ${updated.name} sekarang ${updated.stock}.`);
      onSaved(updated);
      close();
    } catch (err) {
      toast.error(err.message);
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  const handleBlur = () => {
    if (skipBlurRef.current) {
      skipBlurRef.current = false;
      return;
    }
    save();
  };

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        aria-label={`Ubah stok ${product.name}, sekarang ${product.stock}`}
        className="min-w-12 rounded-lg px-2 py-1 text-left font-medium tabular-nums text-espresso transition hover:bg-sand/40"
      >
        {product.stock}
      </button>
    );
  }

  return (
    <input
      ref={inputRef}
      type="number"
      inputMode="numeric"
      min={0}
      step={1}
      value={value}
      disabled={saving}
      aria-label={`Stok baru untuk ${product.name}`}
      onChange={(event) => setValue(event.target.value)}
      onBlur={handleBlur}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          event.preventDefault();
          // Blurring the input runs handleBlur, which saves once.
          inputRef.current?.blur();
        }
        if (event.key === 'Escape') cancel();
      }}
      className="h-9 w-24 rounded-lg border border-golden bg-surface px-2 text-espresso"
    />
  );
}
