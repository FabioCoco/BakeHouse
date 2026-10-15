import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import OrderTimeline from '../order/OrderTimeline.jsx';
import PaymentStatusPill from '../order/PaymentStatusPill.jsx';
import Button from '../ui/Button.jsx';
import ConfirmDialog from '../ui/ConfirmDialog.jsx';
import Drawer from '../ui/Drawer.jsx';
import Select from '../ui/Select.jsx';
import Skeleton from '../ui/Skeleton.jsx';
import StatusPill from '../ui/StatusPill.jsx';
import useFetch from '../../hooks/useFetch.js';
import { adminService } from '../../services/adminService.js';
import { formatDateTime } from '../../utils/formatDate.js';
import { formatRupiah } from '../../utils/formatRupiah.js';
import { ORDER_STATUS_MAP } from '../../utils/statusMap.js';
import { getValidNextStatuses } from '../../utils/validStatusTransitions.js';

// Order detail for admins. The status select lists only the next statuses the server accepts.
export default function OrderDetailDrawer({ orderId, open, onClose, onChanged }) {
  const [version, setVersion] = useState(0);
  const detail = useFetch(
    () => (orderId ? adminService.getOrder(orderId) : Promise.resolve(null)),
    [orderId, version, open],
  );
  // adminService.getOrder returns the order itself, so the body is the order.
  const order = detail.body ?? null;
  const [nextStatus, setNextStatus] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setNextStatus('');
  }, [orderId]);

  const allowed = order ? getValidNextStatuses(order.status) : [];

  const applyChange = async () => {
    setSaving(true);
    try {
      await adminService.updateOrderStatus(order._id, nextStatus);
      toast.success(`Status diubah menjadi ${ORDER_STATUS_MAP[nextStatus].label}.`);
      setConfirming(false);
      setNextStatus('');
      setVersion((v) => v + 1);
      onChanged?.();
    } catch (err) {
      // Someone else may have changed the order. Reload so the options match the current status.
      toast.error(err.message);
      setConfirming(false);
      setVersion((v) => v + 1);
    } finally {
      setSaving(false);
    }
  };

  const requestChange = () => {
    if (nextStatus === 'cancelled') {
      setConfirming(true);
    } else {
      applyChange();
    }
  };

  const footer = order && allowed.length > 0 && (
    <div className="flex flex-col gap-3">
      <Select
        label="Update status"
        value={nextStatus}
        onChange={(event) => setNextStatus(event.target.value)}
        options={[
          { value: '', label: 'Choose a new status', disabled: true },
          ...allowed.map((status) => ({ value: status, label: ORDER_STATUS_MAP[status].label })),
        ]}
      />
      <Button disabled={!nextStatus || saving} onClick={requestChange} className="w-full">
        {saving ? 'Saving…' : 'Save status'}
      </Button>
    </div>
  );

  return (
    <>
      <Drawer open={open} onClose={onClose} title="Order details" footer={footer} width="max-w-lg">
        {detail.loading && <Skeleton className="h-80 w-full" />}
        {detail.error && <p className="text-cocoa">This order could not be loaded.</p>}

        {order && (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <p className="font-mono text-sm text-cocoa">{order.orderNumber}</p>
              <div className="flex flex-wrap gap-2">
                <StatusPill status={order.status} />
                <PaymentStatusPill paymentStatus={order.paymentStatus} />
              </div>
              {order.paymentStatus === 'paid' && order.payment?.paidAt && (
                <p className="text-sm text-cocoa">Paid {formatDateTime(order.payment.paidAt)} via {order.payment.paymentType ?? 'Midtrans'}</p>
              )}
              <p className="text-sm text-cocoa">Created {formatDateTime(order.createdAt)}</p>
            </div>

            <section className="flex flex-col gap-1 text-sm">
              <h3 className="eyebrow mb-1">Customer</h3>
              <p className="font-medium text-espresso">{order.user?.name ?? 'Account deleted'}</p>
              <p className="text-cocoa">{order.user?.email}</p>
            </section>

            <section className="flex flex-col gap-1 text-sm">
              <h3 className="eyebrow mb-1">Shipping</h3>
              <p className="font-medium text-espresso">{order.shippingAddress.recipientName}</p>
              <p className="text-cocoa">{order.shippingAddress.phone}</p>
              <p className="text-cocoa">
                {order.shippingAddress.street}, {order.shippingAddress.city}, {order.shippingAddress.province}{' '}
                {order.shippingAddress.postalCode}
              </p>
            </section>

            {order.paymentNote && (
              <section className="text-sm">
                <h3 className="eyebrow mb-1">Payment note</h3>
                <p className="text-cocoa">{order.paymentNote}</p>
              </section>
            )}

            <section>
              <h3 className="eyebrow mb-2">Items</h3>
              <ul className="divide-y divide-line text-sm">
                {order.items.map((item) => (
                  <li key={`${item.product}`} className="flex justify-between gap-4 py-2">
                    <span>
                      {item.name} <span className="text-cocoa">× {item.quantity}</span>
                    </span>
                    <span className="font-medium">{formatRupiah(item.price * item.quantity)}</span>
                  </li>
                ))}
              </ul>
              <dl className="mt-3 flex flex-col gap-1 border-t border-line pt-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-cocoa">Subtotal</dt>
                  <dd>{formatRupiah(order.subtotal)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-cocoa">Shipping fee</dt>
                  <dd>{order.shippingFee === 0 ? 'Gratis' : formatRupiah(order.shippingFee)}</dd>
                </div>
                <div className="flex justify-between font-medium">
                  <dt>Total</dt>
                  <dd className="font-serif text-lg">{formatRupiah(order.total)}</dd>
                </div>
              </dl>
            </section>

            <section>
              <h3 className="eyebrow mb-4">History</h3>
              <OrderTimeline history={order.statusHistory} />
            </section>

            {allowed.length === 0 && (
              <p className="text-sm text-cocoa">This status is final. No further changes are possible.</p>
            )}
          </div>
        )}
      </Drawer>

      <ConfirmDialog
        open={confirming}
        onClose={() => setConfirming(false)}
        onConfirm={applyChange}
        title="Cancel this order?"
        description={
          order?.paymentStatus === 'paid'
            ? 'Stock will be returned and the payment marked "Refunded". This is a sandbox simulation, so no money is sent.'
            : 'Stock for this order will be returned to the catalog.'
        }
        confirmLabel="Yes, cancel"
        cancelLabel="No"
        danger
        loading={saving}
      />
    </>
  );
}
