import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import Container from '../components/layout/Container.jsx';
import BankTransferCard from '../components/order/BankTransferCard.jsx';
import OrderTimeline from '../components/order/OrderTimeline.jsx';
import Button from '../components/ui/Button.jsx';
import Card from '../components/ui/Card.jsx';
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx';
import Skeleton from '../components/ui/Skeleton.jsx';
import StatusPill from '../components/ui/StatusPill.jsx';
import useFetch from '../hooks/useFetch.js';
import { orderService } from '../services/orderService.js';
import { loadPayment } from '../utils/paymentStorage.js';
import { formatDateTime } from '../utils/formatDate.js';
import { formatRupiah } from '../utils/formatRupiah.js';
import NotFound from './NotFound.jsx';

export default function OrderDetail() {
  const { id } = useParams();
  const { body, loading, error, reload } = useOrder(id);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  // Set after a successful cancel, so the page updates without waiting for a reload.
  const [updatedOrder, setUpdatedOrder] = useState(null);
  const order = updatedOrder ?? body?.data ?? null;

  useEffect(() => {
    document.title = 'Detail Pesanan · BakeHouse';
  }, []);

  if (loading) {
    return (
      <Container className="py-12" aria-busy="true">
        <Skeleton className="h-96 w-full" />
      </Container>
    );
  }

  if (error?.status === 404) return <NotFound />;

  if (error || !order) {
    return (
      <Container className="py-16 text-center">
        <p className="text-cocoa">Pesanan belum bisa dimuat.</p>
      </Container>
    );
  }

  const payment = loadPayment(order._id);
  const canCancel = order.status === 'pending_confirmation';

  const handleCancel = async () => {
    setCancelling(true);
    try {
      setUpdatedOrder(await orderService.cancel(order._id));
      toast.success('Pesanan dibatalkan.');
      setConfirmCancel(false);
    } catch (err) {
      toast.error(err.message);
      // The status may have changed while the dialog was open, so reload the order.
      reload();
      setConfirmCancel(false);
    } finally {
      setCancelling(false);
    }
  };

  const address = order.shippingAddress;

  return (
    <Container className="flex flex-col gap-10 py-12 md:py-16">
      <nav aria-label="Breadcrumb">
        <Link to="/orders" className="text-sm text-cocoa hover:text-espresso">
          ← Pesanan Saya
        </Link>
      </nav>

      <header className="flex flex-col gap-3">
        <p className="font-mono text-sm text-cocoa">{order.orderNumber}</p>
        <div className="flex flex-wrap items-center gap-4">
          <h1 className="text-4xl md:text-5xl">Detail Pesanan</h1>
          <StatusPill status={order.status} />
        </div>
        <p className="text-sm text-cocoa">Dibuat {formatDateTime(order.createdAt)}</p>
      </header>

      <div className="grid items-start gap-8 lg:grid-cols-[1fr_380px]">
        <div className="flex flex-col gap-6">
          <Card className="p-6 md:p-8">
            <h2 className="mb-4 text-2xl">Roti yang dipesan</h2>
            <ul className="divide-y divide-line">
              {order.items.map((item) => (
                <li key={`${item.product}`} className="flex justify-between gap-4 py-4 text-sm">
                  <span>
                    <span className="font-medium text-espresso">{item.name}</span>
                    <span className="text-cocoa"> × {item.quantity}</span>
                    <span className="block text-cocoa">{formatRupiah(item.price)} / roti</span>
                  </span>
                  <span className="font-medium">{formatRupiah(item.price * item.quantity)}</span>
                </li>
              ))}
            </ul>
            <dl className="mt-4 flex flex-col gap-2 border-t border-line pt-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-cocoa">Subtotal</dt>
                <dd>{formatRupiah(order.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-cocoa">Ongkos kirim</dt>
                <dd>{order.shippingFee === 0 ? 'Gratis' : formatRupiah(order.shippingFee)}</dd>
              </div>
              <div className="flex justify-between text-base">
                <dt className="font-medium">Total</dt>
                <dd className="font-serif text-2xl">{formatRupiah(order.total)}</dd>
              </div>
            </dl>
          </Card>

          {payment && order.status === 'pending_confirmation' && (
            <BankTransferCard payment={payment} amount={order.total} orderNumber={order.orderNumber} />
          )}

          <Card className="p-6 md:p-8">
            <h2 className="mb-6 text-2xl">Riwayat Status</h2>
            <OrderTimeline history={order.statusHistory} />
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card className="flex flex-col gap-2 p-6">
            <h2 className="mb-2 text-2xl">Alamat Pengiriman</h2>
            <p className="font-medium text-espresso">{address.recipientName}</p>
            <p className="text-cocoa">{address.phone}</p>
            <p className="text-cocoa">
              {address.street}, {address.city}, {address.province} {address.postalCode}
            </p>
          </Card>

          {order.paymentNote && (
            <Card className="flex flex-col gap-2 p-6">
              <h2 className="text-lg">Catatan transfer</h2>
              <p className="text-cocoa">{order.paymentNote}</p>
            </Card>
          )}

          {canCancel && (
            <Button variant="danger" onClick={() => setConfirmCancel(true)} className="w-full">
              Batalkan Pesanan
            </Button>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={confirmCancel}
        onClose={() => setConfirmCancel(false)}
        onConfirm={handleCancel}
        title="Batalkan pesanan ini?"
        description="Stok roti akan dikembalikan. Kamu bisa memesan lagi nanti."
        confirmLabel="Ya, batalkan"
        cancelLabel="Tidak"
        danger
        loading={cancelling}
      />
    </Container>
  );
}

// Loads one order and exposes a way to reload it.
function useOrder(id) {
  const [version, setVersion] = useState(0);
  const result = useFetch(() => orderService.getMine(id), [id, version]);
  return { ...result, reload: () => setVersion((v) => v + 1) };
}
