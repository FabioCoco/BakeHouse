import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './routes/router.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import { authService } from './services/authService.js';
import { useAuthStore } from './store/useAuthStore.js';

// Shown only until the first session check finishes, so protected pages never flash.
function SessionSplash() {
  return (
    <div role="status" aria-live="polite" className="flex min-h-svh items-center justify-center bg-cream">
      <p className="font-serif text-3xl text-espresso">BakeHouse</p>
      <span className="sr-only">Loading your session…</span>
    </div>
  );
}

export default function App() {
  const status = useAuthStore((state) => state.status);
  const setUser = useAuthStore((state) => state.setUser);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const setStatus = useAuthStore((state) => state.setStatus);

  // Restores the session from the httpOnly cookie. A 401 here is expected for guests, so it does not redirect.
  useEffect(() => {
    let active = true;
    setStatus('loading');

    authService
      .me()
      .then((user) => {
        if (active) setUser(user);
      })
      .catch(() => {
        if (active) clearAuth();
      });

    return () => {
      active = false;
    };
  }, [setUser, clearAuth, setStatus]);

  if (status === 'idle' || status === 'loading') {
    return <SessionSplash />;
  }

  return (
    <ErrorBoundary>
      <RouterProvider router={router} />
    </ErrorBoundary>
  );
}
