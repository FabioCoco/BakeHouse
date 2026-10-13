import { useEffect } from 'react';
import Badge from '../components/ui/Badge.jsx';
import Card from '../components/ui/Card.jsx';
import Container from '../components/layout/Container.jsx';
import { useAuthStore } from '../store/useAuthStore.js';

// Minimal account page for phase 1. Profile editing and addresses come in phase 4.
export default function Account() {
  const user = useAuthStore((state) => state.user);

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
        <dl className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm text-cocoa">Nama</dt>
            <dd className="font-medium">{user?.name}</dd>
          </div>
          <div>
            <dt className="text-sm text-cocoa">Email</dt>
            <dd className="font-medium">{user?.email}</dd>
          </div>
          <div>
            <dt className="text-sm text-cocoa">Peran</dt>
            <dd>
              <Badge tone={user?.role === 'admin' ? 'honey' : 'neutral'}>
                {user?.role === 'admin' ? 'Admin' : 'Pelanggan'}
              </Badge>
            </dd>
          </div>
        </dl>
      </Card>
    </Container>
  );
}
