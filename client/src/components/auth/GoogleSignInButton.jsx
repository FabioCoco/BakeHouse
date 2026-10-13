import { GoogleLogin } from '@react-oauth/google';
import toast from 'react-hot-toast';

// Renders nothing when VITE_GOOGLE_CLIENT_ID is empty. Must be used inside GoogleOAuthProvider.
export default function GoogleSignInButton({ onCredential, disabled = false }) {
  if (!import.meta.env.VITE_GOOGLE_CLIENT_ID) return null;

  return (
    <div className={`flex justify-center ${disabled ? 'pointer-events-none opacity-50' : ''}`}>
      <GoogleLogin
        onSuccess={(response) => {
          if (response.credential) {
            onCredential(response.credential);
          } else {
            toast.error('Google tidak mengembalikan kredensial. Coba lagi.');
          }
        }}
        onError={() => toast.error('Masuk dengan Google gagal. Coba lagi.')}
        theme="outline"
        shape="pill"
        size="large"
        text="continue_with"
        width="320"
      />
    </div>
  );
}
