import { Link } from 'react-router-dom';
import Card from '../ui/Card.jsx';
import StatusPill from '../ui/StatusPill.jsx';
import { formatDateTime } from '../../utils/formatDate.js';
import { formatRupiah } from '../../utils/formatRupiah.js';

export default function OrderCard({ order }) {
  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <Card as="article" className="transition duration-200 hover:border-sand-dark hover:shadow-lg">
      <Link to={`/orders/${order._id}`} className="flex flex-col gap-4 rounded-2xl p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <p className="font-mono text-sm text-cocoa">{order.orderNumber}</p>
          <p className="text-sm text-cocoa">{formatDateTime(order.createdAt)}</p>
          <p className="text-sm text-espresso">{itemCount} loaves</p>
        </div>
        <div className="flex items-center gap-4 sm:flex-col sm:items-end">
          <StatusPill status={order.status} />
          <p className="font-serif text-xl text-espresso">{formatRupiah(order.total)}</p>
        </div>
      </Link>
    </Card>
  );
}
