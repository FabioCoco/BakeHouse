import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import Button from '../ui/Button.jsx';
import Input from '../ui/Input.jsx';
import Modal from '../ui/Modal.jsx';
import Select from '../ui/Select.jsx';
import Textarea from '../ui/Textarea.jsx';
import { productService } from '../../services/productService.js';
import { ORIGINS, ORIGIN_LABELS } from '../../config/catalog.js';
import { mapServerErrors, PRODUCT_EMPTY, toProductPayload, validateProduct } from '../../utils/validators.js';

// Create (product = null) or edit a product. Stock is not edited here: it has its own inline editor.
export default function ProductFormModal({ open, onClose, product, categories, onSaved }) {
  const isCreate = !product;
  const [values, setValues] = useState(PRODUCT_EMPTY);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setValues(
      product
        ? {
            name: product.name,
            description: product.description,
            price: String(product.price),
            category: product.category?._id ?? '',
            origin: product.origin,
            images: (product.images ?? []).join(', '),
            stock: String(product.stock),
            isActive: product.isActive,
          }
        : { ...PRODUCT_EMPTY, category: categories[0]?._id ?? '' },
    );
  }, [open, product, categories]);

  const set = (name, value) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const clientErrors = validateProduct(values, { isCreate });
    setErrors(clientErrors);
    if (Object.keys(clientErrors).length) return;

    setSaving(true);
    try {
      const payload = toProductPayload(values, { isCreate });
      const saved = isCreate
        ? await productService.create(payload)
        : await productService.update(product._id, payload);
      toast.success(isCreate ? `${saved.name} ditambahkan.` : `${saved.name} disimpan.`);
      onSaved(saved);
    } catch (err) {
      const fieldErrors = mapServerErrors(err.errors);
      if (Object.keys(fieldErrors).length) setErrors(fieldErrors);
      else setErrors({ form: err.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isCreate ? 'Tambah produk' : 'Ubah produk'}
      footer={
        <div className="flex flex-wrap justify-end gap-3">
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Batal
          </Button>
          <Button type="submit" form="product-form" disabled={saving}>
            {saving ? 'Menyimpan…' : 'Simpan'}
          </Button>
        </div>
      }
    >
      <form id="product-form" onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        {errors.form && <p role="alert" className="rounded-xl bg-berry/10 p-3 text-sm text-berry">{errors.form}</p>}

        <Input label="Nama roti" value={values.name} onChange={(e) => set('name', e.target.value)} error={errors.name} maxLength={120} />

        <Textarea
          label="Deskripsi"
          value={values.description}
          onChange={(e) => set('description', e.target.value)}
          error={errors.description}
          maxLength={2000}
        />

        <div className="grid gap-5 sm:grid-cols-2">
          <Input
            label="Harga (Rp)"
            inputMode="numeric"
            value={values.price}
            onChange={(e) => set('price', e.target.value)}
            error={errors.price}
            hint="Bilangan bulat, tanpa titik."
          />
          <Select
            label="Kategori"
            value={values.category}
            onChange={(e) => set('category', e.target.value)}
            error={errors.category}
            options={[
              { value: '', label: 'Pilih kategori', disabled: true },
              ...categories.map((c) => ({ value: c._id, label: c.name })),
            ]}
          />
          <Select
            label="Asal"
            value={values.origin}
            onChange={(e) => set('origin', e.target.value)}
            options={ORIGINS.map((o) => ({ value: o, label: ORIGIN_LABELS[o] }))}
          />
          {isCreate && (
            <Input
              label="Stok awal"
              inputMode="numeric"
              value={values.stock}
              onChange={(e) => set('stock', e.target.value)}
              error={errors.stock}
            />
          )}
        </div>

        <Textarea
          label="Nama file gambar"
          rows={2}
          value={values.images}
          onChange={(e) => set('images', e.target.value)}
          error={errors.images}
          hint="Pisahkan dengan koma. Contoh: croissant-butter.jpg. Unggah gambar belum tersedia."
        />

        <label className="flex items-center gap-3 text-sm text-espresso">
          <input
            type="checkbox"
            checked={values.isActive}
            onChange={(e) => set('isActive', e.target.checked)}
            className="h-4 w-4 accent-crust"
          />
          Tampilkan di toko
        </label>
      </form>
    </Modal>
  );
}
