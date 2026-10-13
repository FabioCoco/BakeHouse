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
    document.title = 'Alamat · BakeHouse';
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
        toast.success('Alamat ditambahkan.');
      } else {
        await addressService.update(editing._id, payload);
        toast.success('Alamat diperbarui.');
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
      toast.success('Alamat utama diperbarui.');
      reload();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDelete = async () => {
    setDeleting(confirmDelete._id);
    try {
      await addressService.remove(confirmDelete._id);
      toast.success('Alamat dihapus.');
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
            ← Akun
          </Link>
          <h1 className="text-5xl">Alamat Pengiriman</h1>
        </div>
        <Button onClick={() => openEditor(null)}>Tambah Alamat</Button>
      </header>

      {addresses.loading && (
        <div className="grid gap-4 md:grid-cols-2" aria-busy="true">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      )}

      {addresses.error && <p className="text-cocoa">Alamat belum bisa dimuat.</p>}

      {!addresses.loading && !addresses.error && list.length === 0 && (
        <EmptyState
          icon={MapPin}
          title="Belum ada alamat"
          description="Tambahkan alamat agar checkout lebih cepat."
          action={<Button variant="outline" onClick={() => openEditor(null)}>Tambah Alamat</Button>}
        />
      )}

      {list.length > 0 && (
        <ul className="grid gap-4 md:grid-cols-2">
          {list.map((address) => (
            <li key={address._id}>
              <Card className="flex h-full flex-col gap-3 p-6">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-espresso">{address.label}</span>
                  {address.isDefault && <Badge tone="honey">Utama</Badge>}
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
                    <Pencil size={14} aria-hidden="true" /> Ubah
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
                    <Trash2 size={14} aria-hidden="true" /> Hapus
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
        title={editing === 'new' ? 'Tambah alamat' : 'Ubah alamat'}
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={closeEditor} disabled={saving}>
              Batal
            </Button>
            <Button type="submit" form="address-form" disabled={saving}>
              {saving ? 'Menyimpan…' : 'Simpan'}
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
            Jadikan alamat utama
          </label>
        </form>
      </Modal>

      <ConfirmDialog
        open={confirmDelete !== null}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        title="Hapus alamat ini?"
        description="Alamat ini akan dihapus dari daftar. Pesanan yang sudah dibuat tidak terpengaruh."
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
