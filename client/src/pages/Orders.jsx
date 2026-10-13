import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ReceiptText } from 'lucide-react';
import Container from '../components/layout/Container.jsx';
import OrderCard from '../components/order/OrderCard.jsx';
import Button from '../components/ui/Button.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import Pagination from '../components/ui/Pagination.jsx';
import Skeleton from '../components/ui/Skeleton.jsx';
import useFetch from '../hooks/useFetch.js';
import useQueryParams from '../hooks/useQueryParams.js';
import { orderService } from '../services/orderService.js';

export default function Orders() {
  const [searchParams, setParams] = useQueryParams();
  const page = Number(searchParams.get('page')) || 1;

  const orders = useFetch(() => orderService.listMine({ page, limit: 10 }), [page]);
  const items = orders.body?.data ?? [];
  const meta = orders.body?.meta;

  useEffect(() => {
    document.title = 'Pesanan Saya · BakeHouse';
  }, []);

  const handlePageChange = (next) => {
    setParams({ page: next > 1 ? next : undefined });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <Container className="flex flex-col gap-10 py-12 md:py-16">
      <header className="flex flex-col gap-2">
        <p className="eyebrow">Akun</p>
        <h1 className="text-5xl">Pesanan Saya</h1>
      </header>

      {orders.loading && (
        <div className="flex flex-col gap-4" aria-busy="true">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      )}

      {orders.error && (
        <EmptyState
          title="Pesanan belum bisa dimuat"
          description={orders.error.message}
          action={
            <Button variant="outline" onClick={() => window.location.reload()}>
              Muat ulang
            </Button>
          }
        />
      )}

      {!orders.loading && !orders.error && items.length === 0 && (
        <EmptyState
          icon={ReceiptText}
          title="Belum ada pesanan"
          description="Pesanan yang kamu buat akan muncul di sini."
          action={
            <Button as={Link} to="/products" variant="outline">
              Lihat Menu
            </Button>
          }
        />
      )}

      {!orders.loading && items.length > 0 && (
        <div className="flex flex-col gap-4">
          {items.map((order) => (
            <OrderCard key={order._id} order={order} />
          ))}
        </div>
      )}

      {meta && <Pagination page={meta.page} totalPages={meta.totalPages} onPageChange={handlePageChange} />}
    </Container>
  );
}
