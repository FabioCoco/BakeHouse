import { GoogleLogin, GoogleOAuthProvider } from '@react-oauth/google';
import toast from 'react-hot-toast';

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

// Renders nothing when VITE_GOOGLE_CLIENT_ID is empty. The Google SDK loads only on the pages that use this button.
export default function GoogleSignInButton({ onCredential, disabled = false }) {
  if (!CLIENT_ID) return null;

  return (
    <GoogleOAuthProvider clientId={CLIENT_ID}>
      <div className={`flex justify-center ${disabled ? 'pointer-events-none opacity-50' : ''}`}>
        <GoogleLogin
          onSuccess={(response) => {
            if (response.credential) {
              onCredential(response.credential);
            } else {
              toast.error('Google did not return a credential. Please try again.');
            }
          }}
          onError={() => toast.error('Sign in with Google failed. Please try again.')}
          theme="outline"
          shape="pill"
          size="large"
          text="continue_with"
          width="320"
        />
      </div>
    </GoogleOAuthProvider>
  );
}
