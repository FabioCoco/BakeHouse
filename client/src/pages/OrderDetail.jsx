import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import Container from '../components/layout/Container.jsx';
import OrderTimeline from '../components/order/OrderTimeline.jsx';
import OrderReviewPanel from '../components/review/OrderReviewPanel.jsx';
import PaymentCountdown from '../components/order/PaymentCountdown.jsx';
import PaymentStatusPill from '../components/order/PaymentStatusPill.jsx';
import Button from '../components/ui/Button.jsx';
import Card from '../components/ui/Card.jsx';
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx';
import Skeleton from '../components/ui/Skeleton.jsx';
import StatusPill from '../components/ui/StatusPill.jsx';
import useFetch from '../hooks/useFetch.js';
import useMidtransSnap from '../hooks/useMidtransSnap.js';
import { orderService } from '../services/orderService.js';
import { formatDateTime } from '../utils/formatDate.js';
import { formatRupiah } from '../utils/formatRupiah.js';
import NotFound from './NotFound.jsx';

export default function OrderDetail() {
  const { id } = useParams();
  const location = useLocation();
  const { pay } = useMidtransSnap();

  // Reloads when the URL key changes, which happens when a Snap popup returns the customer here.
  const [version, setVersion] = useState(0);
  const detail = useFetch(() => orderService.getMine(id), [id, version, location.key]);
  const fetched = detail.body?.data ?? null;

  // Set after a cancel or a status sync, so the page updates without waiting for a reload.
  const [updatedOrder, setUpdatedOrder] = useState(null);
  const order = updatedOrder?._id === id ? updatedOrder : fetched;

  const [confirmCancel, setConfirmCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [resuming, setResuming] = useState(false);

  useEffect(() => {
    setUpdatedOrder(null);
  }, [id, version, location.key]);

  // The webhook may not reach a local server, so an unpaid order is checked once when it opens.
  const needsSync = Boolean(fetched && fetched.status === 'pending_payment' && fetched.paymentStatus === 'unpaid');
  useEffect(() => {
    if (!needsSync) return;
    orderService
      .syncPaymentStatus(id)
      .then((synced) => setUpdatedOrder(synced))
      .catch(() => {});
  }, [id, needsSync]);

  useEffect(() => {
    document.title = 'Order details · BakeHouse';
  }, []);

  if (detail.loading) {
    return (
      <Container className="py-12" aria-busy="true">
        <Skeleton className="h-96 w-full" />
      </Container>
    );
  }

  if (detail.error?.status === 404) return <NotFound />;

  if (detail.error || !order) {
    return (
      <Container className="py-16 text-center">
        <p className="text-cocoa">This order could not be loaded.</p>
      </Container>
    );
  }

  const isUnpaid = order.status === 'pending_payment' && order.paymentStatus === 'unpaid';
  const canResume = isUnpaid && new Date(order.paymentExpiresAt) > new Date() && Boolean(order.payment?.snapToken);
  const canCancel = order.status === 'pending_payment';

  const handleResume = async () => {
    setResuming(true);
    try {
      const data = await orderService.pay(order._id);
      await pay(data.snapToken, order._id);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setResuming(false);
    }
  };

  const handleCancel = async () => {
    setCancelling(true);
    try {
      setUpdatedOrder(await orderService.cancel(order._id));
      toast.success('Order cancelled.');
      setConfirmCancel(false);
    } catch (err) {
      toast.error(err.message);
      // The status may have changed while the dialog was open, so reload the order.
      setVersion((v) => v + 1);
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
          ← My orders
        </Link>
      </nav>

      <header className="flex flex-col gap-3">
        <p className="font-mono text-sm text-cocoa">{order.orderNumber}</p>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-4xl md:text-5xl">Order details</h1>
          <StatusPill status={order.status} />
          <PaymentStatusPill paymentStatus={order.paymentStatus} />
        </div>
        <p className="text-sm text-cocoa">Created {formatDateTime(order.createdAt)}</p>
      </header>

      <div className="grid items-start gap-8 lg:grid-cols-[1fr_380px]">
        <div className="flex flex-col gap-6">
          <Card className="p-6 md:p-8">
            <h2 className="mb-4 text-2xl">Items ordered</h2>
            <ul className="divide-y divide-line">
              {order.items.map((item) => (
                <li key={`${item.product}`} className="flex justify-between gap-4 py-4 text-sm">
                  <span>
                    <span className="font-medium text-espresso">{item.name}</span>
                    <span className="text-cocoa"> × {item.quantity}</span>
                    <span className="block text-cocoa">{formatRupiah(item.price)} / loaf</span>
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
                <dt className="text-cocoa">Shipping fee</dt>
                <dd>{order.shippingFee === 0 ? 'Gratis' : formatRupiah(order.shippingFee)}</dd>
              </div>
              <div className="flex justify-between text-base">
                <dt className="font-medium">Total</dt>
                <dd className="font-serif text-2xl">{formatRupiah(order.total)}</dd>
              </div>
            </dl>
          </Card>

          <Card className="flex flex-col gap-4 p-6 md:p-8">
            <h2 className="text-2xl">Payment</h2>
            <div className="flex flex-wrap items-center gap-3">
              <PaymentStatusPill paymentStatus={order.paymentStatus} />
              {order.paymentStatus === 'paid' && order.payment?.paidAt && (
                <span className="text-sm text-cocoa">Paid {formatDateTime(order.payment.paidAt)}</span>
              )}
            </div>

            {isUnpaid && canResume && (
              <>
                <PaymentCountdown expiresAt={order.paymentExpiresAt} />
                <Button onClick={handleResume} disabled={resuming} className="w-full sm:w-auto">
                  {resuming ? 'Loading payment…' : 'Continue Payment'}
                </Button>
              </>
            )}

            {isUnpaid && !canResume && (
              <p className="text-sm text-berry">Payment time has run out. This order will be cancelled.</p>
            )}

            {order.status === 'cancelled' && order.paymentStatus === 'refunded' && (
              <p className="text-sm text-cocoa">Payment refunded. The shop processes the refund.</p>
            )}
          </Card>

          {order.status === 'completed' && (
            <section aria-labelledby="review-title" className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <h2 id="review-title" className="text-2xl">Leave a Review</h2>
                <p className="text-sm text-cocoa">Your review helps other buyers. One review per loaf.</p>
              </div>
              {order.items
                .filter((item) => item.slug)
                .map((item) => (
                  <OrderReviewPanel key={`${item.product}`} productSlug={item.slug} productName={item.name} />
                ))}
            </section>
          )}

          <Card className="p-6 md:p-8">
            <h2 className="mb-6 text-2xl">History Status</h2>
            <OrderTimeline history={order.statusHistory} />
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card className="flex flex-col gap-2 p-6">
            <h2 className="mb-2 text-2xl">Shipping Address</h2>
            <p className="font-medium text-espresso">{address.recipientName}</p>
            <p className="text-cocoa">{address.phone}</p>
            <p className="text-cocoa">
              {address.street}, {address.city}, {address.province} {address.postalCode}
            </p>
          </Card>

          {order.paymentNote && (
            <Card className="flex flex-col gap-2 p-6">
              <h2 className="text-lg">Note for the shop</h2>
              <p className="text-cocoa">{order.paymentNote}</p>
            </Card>
          )}

          {canCancel && (
            <Button variant="danger" onClick={() => setConfirmCancel(true)} className="w-full">
              Cancel Order
            </Button>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={confirmCancel}
        onClose={() => setConfirmCancel(false)}
        onConfirm={handleCancel}
        title="Cancel this order?"
        description="Stock will be returned. You can order again later."
        confirmLabel="Yes, cancel"
        cancelLabel="No"
        danger
        loading={cancelling}
      />
    </Container>
  );
}
