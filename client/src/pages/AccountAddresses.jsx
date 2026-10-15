import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Pencil, Star, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Container from '../components/layout/Container.jsx';
import AddressFields from '../components/address/AddressFields.jsx';
import Badge from '../components/ui/Badge.jsx';
import Button from '../components/ui/Button.jsx';
import Card from '../components/ui/Card.jsx';
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import Modal from '../components/ui/Modal.jsx';
import Skeleton from '../components/ui/Skeleton.jsx';
import useFetch from '../hooks/useFetch.js';
import { addressService } from '../services/addressService.js';
import { ADDRESS_EMPTY, mapServerErrors, toAddressPayload, validateAddress } from '../utils/validators.js';

export default function AccountAddresses() {
  // Bumping this key reloads the list after any change.
  const [version, setVersion] = useState(0);
  const addresses = useFetch(() => addressService.list(), [version]);
  const list = addresses.body?.data ?? [];

  // editing: null when closed, 'new' for a new address, or the address being edited.
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(ADDRESS_EMPTY);
  const [isDefault, setIsDefault] = useState(false);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => {
    document.title = 'Addresses · BakeHouse';
  }, []);

  const reload = () => setVersion((v) => v + 1);

  const openEditor = (address) => {
    setEditing(address ?? 'new');
    setForm(address ? { ...ADDRESS_EMPTY, ...pick(address) } : ADDRESS_EMPTY);
    setIsDefault(Boolean(address?.isDefault) || list.length === 0);
    setErrors({});
  };

  const closeEditor = () => setEditing(null);

  const handleChange = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleSave = async (event) => {
    event.preventDefault();
    const clientErrors = validateAddress(form);
    setErrors(clientErrors);
    if (Object.keys(clientErrors).length) return;

    const payload = { ...toAddressPayload(form), isDefault };
    setSaving(true);
    try {
      if (editing === 'new') {
        await addressService.add(payload);
        toast.success('Address added.');
      } else {
        await addressService.update(editing._id, payload);
        toast.success('Address updated.');
      }
      closeEditor();
      reload();
    } catch (err) {
      const fieldErrors = mapServerErrors(err.errors);
      if (Object.keys(fieldErrors).length) setErrors(fieldErrors);
      else toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSetDefault = async (address) => {
    try {
      await addressService.update(address._id, { isDefault: true });
      toast.success('Default address updated.');
      reload();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDelete = async () => {
    setDeleting(confirmDelete._id);
    try {
      await addressService.remove(confirmDelete._id);
      toast.success('Address deleted.');
      setConfirmDelete(null);
      reload();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleting(null);
    }
  };

  return (
    <Container className="flex flex-col gap-10 py-12 md:py-16">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-2">
          <Link to="/account" className="text-sm text-cocoa hover:text-espresso">
            ← Account
          </Link>
          <h1 className="text-5xl">Shipping Addresses</h1>
        </div>
        <Button onClick={() => openEditor(null)}>Add Address</Button>
      </header>

      {addresses.loading && (
        <div className="grid gap-4 md:grid-cols-2" aria-busy="true">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      )}

      {addresses.error && <p className="text-cocoa">Addresses could not be loaded.</p>}

      {!addresses.loading && !addresses.error && list.length === 0 && (
        <EmptyState
          icon={MapPin}
          title="No addresses yet"
          description="Add an address to make checkout faster."
          action={<Button variant="outline" onClick={() => openEditor(null)}>Add Address</Button>}
        />
      )}

      {list.length > 0 && (
        <ul className="grid gap-4 md:grid-cols-2">
          {list.map((address) => (
            <li key={address._id}>
              <Card className="flex h-full flex-col gap-3 p-6">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-espresso">{address.label}</span>
                  {address.isDefault && <Badge tone="honey">Default</Badge>}
                </div>
                <div className="text-sm">
                  <p className="font-medium text-espresso">{address.recipientName}</p>
                  <p className="text-cocoa">{address.phone}</p>
                  <p className="text-cocoa">
                    {address.street}, {address.city}, {address.province} {address.postalCode}
                  </p>
                </div>
                <div className="mt-auto flex flex-wrap gap-2 pt-2">
                  <Button variant="outline" size="sm" onClick={() => openEditor(address)}>
                    <Pencil size={14} aria-hidden="true" /> Edit
                  </Button>
                  {!address.isDefault && (
                    <Button variant="ghost" size="sm" onClick={() => handleSetDefault(address)}>
                      <Star size={14} aria-hidden="true" /> Jadikan utama
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-berry hover:bg-berry/10"
                    onClick={() => setConfirmDelete(address)}
                    disabled={deleting === address._id}
                  >
                    <Trash2 size={14} aria-hidden="true" /> Delete
                  </Button>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <Modal
        open={editing !== null}
        onClose={closeEditor}
        title={editing === 'new' ? 'Add address' : 'Edit address'}
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={closeEditor} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" form="address-form" disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </div>
        }
      >
        <form id="address-form" onSubmit={handleSave} noValidate className="flex flex-col gap-6">
          <AddressFields idPrefix="addr" values={form} errors={errors} onChange={handleChange} />
          <label className="flex items-center gap-3 text-sm text-espresso">
            <input
              type="checkbox"
              checked={isDefault}
              onChange={(event) => setIsDefault(event.target.checked)}
              className="h-4 w-4 accent-crust"
            />
            Set as default address
          </label>
        </form>
      </Modal>

      <ConfirmDialog
        open={confirmDelete !== null}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        title="Delete this address?"
        description="This address will be removed from your list. Existing orders are not affected."
        confirmLabel="Ya, hapus"
        danger
        loading={deleting !== null}
      />
    </Container>
  );
}

// Copies only the editable address fields from a saved address.
const pick = (address) => ({
  label: address.label ?? '',
  recipientName: address.recipientName ?? '',
  phone: address.phone ?? '',
  street: address.street ?? '',
  city: address.city ?? '',
  province: address.province ?? '',
  postalCode: address.postalCode ?? '',
});
