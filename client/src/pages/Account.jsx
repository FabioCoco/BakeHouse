import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import Badge from '../components/ui/Badge.jsx';
import Button from '../components/ui/Button.jsx';
import Card from '../components/ui/Card.jsx';
import Input from '../components/ui/Input.jsx';
import Container from '../components/layout/Container.jsx';
import { profileService } from '../services/profileService.js';
import { useAuthStore } from '../store/useAuthStore.js';
import { mapServerErrors, validatePassword } from '../utils/validators.js';

const PHONE_PATTERN = /^\+?[0-9\s()-]{6,20}$/;

export default function Account() {
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);

  useEffect(() => {
    document.title = 'Akun · BakeHouse';
  }, []);

  return (
    <Container className="flex flex-col gap-8 py-16">
      <div className="flex flex-col gap-2">
        <p className="eyebrow">Akun</p>
        <h1 className="text-5xl">Halo, {user?.name}</h1>
      </div>

      <Card className="flex flex-col gap-4 p-8">
        <dl className="grid gap-4 sm:grid-cols-3">
          <div>
            <dt className="text-sm text-cocoa">Email</dt>
            <dd className="font-medium">{user?.email}</dd>
          </div>
          <div>
            <dt className="text-sm text-cocoa">Telepon</dt>
            <dd className="font-medium">{user?.phone || 'Belum diisi'}</dd>
          </div>
          <div>
            <dt className="text-sm text-cocoa">Peran</dt>
            <dd>
              <Badge tone={user?.role === 'admin' ? 'honey' : 'neutral'}>{user?.role === 'admin' ? 'Admin' : 'Pelanggan'}</Badge>
            </dd>
          </div>
        </dl>
      </Card>

      <ProfileForm key={`${user?._id}-${user?.name}-${user?.phone}`} user={user} onSaved={setUser} />

      {user?.hasPassword !== false && <PasswordForm />}

      <nav aria-label="Akun" className="grid gap-4 sm:grid-cols-2">
        <Link to="/orders" className="rounded-2xl border border-line bg-surface p-6 transition hover:border-sand-dark hover:shadow-soft">
          <span className="font-serif text-2xl text-espresso">Pesanan Saya</span>
          <span className="mt-1 block text-sm text-cocoa">Lihat status dan riwayat pesanan.</span>
        </Link>
        <Link to="/account/addresses" className="rounded-2xl border border-line bg-surface p-6 transition hover:border-sand-dark hover:shadow-soft">
          <span className="font-serif text-2xl text-espresso">Alamat</span>
          <span className="mt-1 block text-sm text-cocoa">Kelola alamat pengiriman.</span>
        </Link>
      </nav>
    </Container>
  );
}

function ProfileForm({ user, onSaved }) {
  const [name, setName] = useState(user?.name ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const clientErrors = {};
    if (!name.trim()) clientErrors.name = 'Nama wajib diisi';
    if (phone.trim() && !PHONE_PATTERN.test(phone.trim())) clientErrors.phone = 'Nomor telepon tidak valid';
    setErrors(clientErrors);
    if (Object.keys(clientErrors).length) return;

    setSaving(true);
    try {
      const updated = await profileService.updateProfile({ name: name.trim(), phone: phone.trim() });
      onSaved(updated);
      toast.success('Profil diperbarui.');
    } catch (err) {
      const fieldErrors = mapServerErrors(err.errors);
      if (Object.keys(fieldErrors).length) setErrors(fieldErrors);
      else toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card as="section" aria-labelledby="profile-title" className="p-8">
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        <h2 id="profile-title" className="text-2xl">
          Ubah Profil
        </h2>
        <div className="grid gap-5 sm:grid-cols-2">
          <Input label="Nama" value={name} maxLength={100} onChange={(e) => setName(e.target.value)} error={errors.name} />
          <Input
            label="Nomor telepon"
            type="tel"
            value={phone}
            maxLength={20}
            onChange={(e) => setPhone(e.target.value)}
            error={errors.phone}
            hint="Opsional. Dipakai toko jika perlu menghubungi kamu."
          />
        </div>
        <div>
          <Button type="submit" disabled={saving}>
            {saving ? 'Menyimpan…' : 'Simpan Profil'}
          </Button>
        </div>
      </form>
    </Card>
  );
}

function PasswordForm() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const clientErrors = {};
    if (!currentPassword) clientErrors.currentPassword = 'Kata sandi saat ini wajib diisi';
    const passwordError = validatePassword(newPassword);
    if (passwordError) clientErrors.newPassword = passwordError;
    if (currentPassword && currentPassword === newPassword) clientErrors.newPassword = 'Kata sandi baru harus berbeda';
    setErrors(clientErrors);
    if (Object.keys(clientErrors).length) return;

    setSaving(true);
    try {
      await profileService.changePassword({ currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      toast.success('Kata sandi diperbarui.');
    } catch (err) {
      const fieldErrors = mapServerErrors(err.errors);
      if (Object.keys(fieldErrors).length) setErrors(fieldErrors);
      else toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card as="section" aria-labelledby="password-title" className="p-8">
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        <h2 id="password-title" className="text-2xl">
          Ganti Kata Sandi
        </h2>
        <div className="grid gap-5 sm:grid-cols-2">
          <Input
            label="Kata sandi saat ini"
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            error={errors.currentPassword}
          />
          <Input
            label="Kata sandi baru"
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            error={errors.newPassword}
            hint="8 sampai 72 karakter, mengandung huruf dan angka."
          />
        </div>
        <div>
          <Button type="submit" disabled={saving}>
            {saving ? 'Menyimpan…' : 'Ganti Kata Sandi'}
          </Button>
        </div>
      </form>
    </Card>
  );
}
