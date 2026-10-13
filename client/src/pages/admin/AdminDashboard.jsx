import { useEffect } from 'react';
import Card from '../../components/ui/Card.jsx';
import { useAuthStore } from '../../store/useAuthStore.js';

// Placeholder for the admin shell. KPI cards and order breakdowns are built in phase 5.
export default function AdminDashboard() {
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    document.title = 'Dashboard Admin · BakeHouse';
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="eyebrow">Admin</p>
        <h1 className="text-4xl">Dashboard</h1>
      </div>
      <Card className="p-8">
        <p className="text-cocoa">
          Selamat datang, {user?.name}. Ringkasan penjualan akan tampil di sini pada phase 5.
        </p>
      </Card>
    </div>
  );
}
