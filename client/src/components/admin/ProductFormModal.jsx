import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import Button from '../ui/Button.jsx';
import ImageUploader from './ImageUploader.jsx';
import Input from '../ui/Input.jsx';
import Modal from '../ui/Modal.jsx';
import Select from '../ui/Select.jsx';
import Textarea from '../ui/Textarea.jsx';
import { productService } from '../../services/productService.js';
import { ORIGINS, ORIGIN_LABELS } from '../../config/catalog.js';
import { mapServerErrors, PRODUCT_EMPTY, toProductPayload, validateProduct } from '../../utils/validators.js';

// Formats an ISO date as the local "YYYY-MM-DDTHH:mm" value that <input type="datetime-local"> expects.
const toLocalInput = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

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
            images: [...(product.images ?? [])],
            stock: String(product.stock),
            isActive: product.isActive,
            discountPercent: String(product.discountPercent ?? 0),
            discountStartsAt: toLocalInput(product.discountStartsAt),
            discountEndsAt: toLocalInput(product.discountEndsAt),
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
      toast.success(isCreate ? `${saved.name} added.` : `${saved.name} saved.`);
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
      title={isCreate ? 'Add product' : 'Edit product'}
      footer={
        <div className="flex flex-wrap justify-end gap-3">
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="product-form" disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </div>
      }
    >
      <form id="product-form" onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        {errors.form && <p role="alert" className="rounded-xl bg-berry/10 p-3 text-sm text-berry">{errors.form}</p>}

        <Input label="Product name" value={values.name} onChange={(e) => set('name', e.target.value)} error={errors.name} maxLength={120} />

        <Textarea
          label="Deskripsi"
          value={values.description}
          onChange={(e) => set('description', e.target.value)}
          error={errors.description}
          maxLength={2000}
        />

        <div className="grid gap-5 sm:grid-cols-2">
          <Input
            label="Price (IDR)"
            inputMode="numeric"
            value={values.price}
            onChange={(e) => set('price', e.target.value)}
            error={errors.price}
            hint="Bilangan bulat, tanpa titik."
          />
          <Select
            label="Category"
            value={values.category}
            onChange={(e) => set('category', e.target.value)}
            error={errors.category}
            options={[
              { value: '', label: 'Choose a category', disabled: true },
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
              label="Initial stock"
              inputMode="numeric"
              value={values.stock}
              onChange={(e) => set('stock', e.target.value)}
              error={errors.stock}
            />
          )}
        </div>

        <div className="grid gap-5 sm:grid-cols-3">
          <Input
            label="Discount (%)"
            inputMode="numeric"
            value={values.discountPercent}
            onChange={(e) => set('discountPercent', e.target.value)}
            error={errors.discountPercent}
            hint="0 berarti tanpa diskon."
          />
          <Input
            label="Sale starts"
            type="datetime-local"
            value={values.discountStartsAt}
            onChange={(e) => set('discountStartsAt', e.target.value)}
            hint="Leave empty to start right away."
          />
          <Input
            label="Sale ends"
            type="datetime-local"
            value={values.discountEndsAt}
            onChange={(e) => set('discountEndsAt', e.target.value)}
            error={errors.discountEndsAt}
            hint="Leave empty for no end date."
          />
        </div>

        <div className="flex flex-col gap-4">
          <span className="text-sm font-medium text-espresso">Product photos (up to 10)</span>
          {values.images.map((filename, index) => (
            <ImageUploader
              key={`${index}-${filename}`}
              kind="product"
              label={`Photo ${index + 1}`}
              value={filename}
              onChange={(next) => set('images', values.images.map((f, i) => (i === index ? next : f)))}
              onRemove={() => set('images', values.images.filter((_, i) => i !== index))}
              hint={index === 0 ? 'The first photo is the main image in the catalog.' : undefined}
            />
          ))}
          {values.images.length < 10 && (
            <div>
              <Button variant="outline" size="sm" onClick={() => set('images', [...values.images, ''])}>
                Add photo
              </Button>
            </div>
          )}
          {errors.images && <p className="text-sm text-berry">{errors.images}</p>}
        </div>

        <label className="flex items-center gap-3 text-sm text-espresso">
          <input
            type="checkbox"
            checked={values.isActive}
            onChange={(e) => set('isActive', e.target.checked)}
            className="h-4 w-4 accent-crust"
          />
          Show in shop
        </label>
      </form>
    </Modal>
  );
}
