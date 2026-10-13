import { useEffect, useState } from 'react';

// Counts down to the payment deadline. Ticks once a second and stops at zero.
export default function PaymentCountdown({ expiresAt }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const remaining = new Date(expiresAt).getTime() - now;
  if (remaining <= 0) {
    return <p className="text-sm font-medium text-berry">Waktu pembayaran sudah habis.</p>;
  }

  const totalSeconds = Math.floor(remaining / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (value) => String(value).padStart(2, '0');

  return (
    <p className="text-sm text-cocoa" aria-live="off">
      Selesaikan pembayaran dalam{' '}
      <time className="font-mono font-semibold text-espresso tabular-nums">
        {pad(hours)}:{pad(minutes)}:{pad(seconds)}
      </time>
    </p>
  );
}
