import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import Button from '../ui/Button.jsx';
import Input from '../ui/Input.jsx';
import Modal from '../ui/Modal.jsx';
import Textarea from '../ui/Textarea.jsx';
import { categoryService } from '../../services/categoryService.js';
import { CATEGORY_EMPTY, mapServerErrors, validateCategory } from '../../utils/validators.js';

export default function CategoryFormModal({ open, onClose, category, onSaved }) {
  const isCreate = !category;
  const [values, setValues] = useState(CATEGORY_EMPTY);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setValues(category ? { name: category.name, description: category.description ?? '' } : CATEGORY_EMPTY);
  }, [open, category]);

  const set = (name, value) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const clientErrors = validateCategory(values);
    setErrors(clientErrors);
    if (Object.keys(clientErrors).length) return;

    const payload = { name: values.name.trim(), description: values.description.trim() };
    setSaving(true);
    try {
      const saved = isCreate
        ? await categoryService.create(payload)
        : await categoryService.update(category._id, payload);
      toast.success(isCreate ? 'Category added.' : 'Category saved.');
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
      title={isCreate ? 'Add category' : 'Edit category'}
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="category-form" disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </div>
      }
    >
      <form id="category-form" onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        {errors.form && <p role="alert" className="rounded-xl bg-berry/10 p-3 text-sm text-berry">{errors.form}</p>}
        <Input label="Category name" value={values.name} onChange={(e) => set('name', e.target.value)} error={errors.name} maxLength={60} />
        <Textarea
          label="Description (optional)"
          rows={3}
          value={values.description}
          onChange={(e) => set('description', e.target.value)}
          error={errors.description}
          maxLength={300}
        />
      </form>
    </Modal>
  );
}
