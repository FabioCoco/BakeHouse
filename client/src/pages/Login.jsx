import { useEffect, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import AuthShell from '../components/auth/AuthShell.jsx';
import GoogleSignInButton from '../components/auth/GoogleSignInButton.jsx';
import Button from '../components/ui/Button.jsx';
import Input from '../components/ui/Input.jsx';
import { authService } from '../services/authService.js';
import { useAuthStore } from '../store/useAuthStore.js';
import { mapServerErrors, validateLogin } from '../utils/validators.js';
import { safeRedirect } from '../utils/safeRedirect.js';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);

  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const target = safeRedirect(location.state?.from);

  useEffect(() => {
    document.title = 'Masuk · BakeHouse';
  }, []);

  if (user) {
    return <Navigate to={target} replace />;
  }

  const signedIn = (signedInUser) => {
    setUser(signedInUser);
    toast.success(`Selamat datang kembali, ${signedInUser.name}!`);
    navigate(target, { replace: true });
  };

  const handleError = (err) => {
    const fieldErrors = mapServerErrors(err.errors);
    if (Object.keys(fieldErrors).length) {
      setErrors(fieldErrors);
    } else {
      toast.error(err.message);
    }
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const clientErrors = validateLogin(form);
    setErrors(clientErrors);
    if (Object.keys(clientErrors).length) return;

    setSubmitting(true);
    try {
      signedIn(await authService.login({ email: form.email.trim(), password: form.password }));
    } catch (err) {
      handleError(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogle = async (credential) => {
    setSubmitting(true);
    try {
      signedIn(await authService.googleLogin(credential));
    } catch (err) {
      handleError(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Selamat datang"
      title="Masuk ke akunmu"
      description="Lanjutkan belanja roti favoritmu."
      footer={
        <>
          Belum punya akun?{' '}
          <Link to="/register" state={location.state} className="font-medium text-crust underline underline-offset-4">
            Daftar sekarang
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        <Input
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          value={form.email}
          onChange={handleChange}
          error={errors.email}
        />
        <Input
          label="Kata sandi"
          name="password"
          type="password"
          autoComplete="current-password"
          value={form.password}
          onChange={handleChange}
          error={errors.password}
        />
        <Button type="submit" size="lg" disabled={submitting} className="w-full">
          {submitting ? 'Memproses…' : 'Masuk'}
        </Button>
      </form>

      <GoogleSignInButton onCredential={handleGoogle} disabled={submitting} />
    </AuthShell>
  );
}
