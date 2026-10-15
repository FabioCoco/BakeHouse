import { useEffect, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import AuthShell from '../components/auth/AuthShell.jsx';
import GoogleSignInButton from '../components/auth/GoogleSignInButton.jsx';
import Button from '../components/ui/Button.jsx';
import Input from '../components/ui/Input.jsx';
import { authService } from '../services/authService.js';
import { useAuthStore } from '../store/useAuthStore.js';
import { mapServerErrors, validateRegister } from '../utils/validators.js';
import { safeRedirect } from '../utils/safeRedirect.js';

export default function Register() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);

  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const target = safeRedirect(location.state?.from);

  useEffect(() => {
    document.title = 'Sign up · BakeHouse';
  }, []);

  if (user) {
    return <Navigate to={target} replace />;
  }

  const signedIn = (newUser) => {
    setUser(newUser);
    toast.success('Account created. Welcome!');
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
    const clientErrors = validateRegister(form);
    setErrors(clientErrors);
    if (Object.keys(clientErrors).length) return;

    setSubmitting(true);
    try {
      signedIn(
        await authService.register({
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
        }),
      );
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
      eyebrow="Bergabung"
      title="Create a new account"
      description="Save your addresses and track your orders in one place."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" state={location.state} className="font-medium text-crust underline underline-offset-4">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        <Input
          label="Full name"
          name="name"
          autoComplete="name"
          value={form.name}
          onChange={handleChange}
          error={errors.name}
        />
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
          label="Password"
          name="password"
          type="password"
          autoComplete="new-password"
          value={form.password}
          onChange={handleChange}
          error={errors.password}
          hint="8 to 72 characters, including letters and numbers."
        />
        <Button type="submit" size="lg" disabled={submitting} className="w-full">
          {submitting ? 'Processing…' : 'Sign up'}
        </Button>
      </form>

      <GoogleSignInButton onCredential={handleGoogle} disabled={submitting} />
    </AuthShell>
  );
}
