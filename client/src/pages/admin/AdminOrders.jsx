import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import OrderDetailDrawer from '../../components/admin/OrderDetailDrawer.jsx';
import PaymentStatusPill from '../../components/order/PaymentStatusPill.jsx';
import Card from '../../components/ui/Card.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import Input from '../../components/ui/Input.jsx';
import Pagination from '../../components/ui/Pagination.jsx';
import Select from '../../components/ui/Select.jsx';
import Skeleton from '../../components/ui/Skeleton.jsx';
import StatusPill from '../../components/ui/StatusPill.jsx';
import useDebounce from '../../hooks/useDebounce.js';
import useFetch from '../../hooks/useFetch.js';
import useQueryParams from '../../hooks/useQueryParams.js';
import { adminService } from '../../services/adminService.js';
import { ORDER_STATUS_MAP } from '../../utils/statusMap.js';
import { formatDateTime } from '../../utils/formatDate.js';
import { formatRupiah } from '../../utils/formatRupiah.js';

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  ...Object.entries(ORDER_STATUS_MAP).map(([value, { label }]) => ({ value, label })),
];

export default function AdminOrders() {
  const [searchParams, setParams] = useQueryParams();
  const status = searchParams.get('status') || '';
  const page = Number(searchParams.get('page')) || 1;
  const urlSearch = searchParams.get('search') || '';

  const [searchInput, setSearchInput] = useState(urlSearch);
  const debouncedSearch = useDebounce(searchInput, 400);
  const [selectedId, setSelectedId] = useState(null);

  // Mirror the debounced search into the URL, so the filter survives a reload.
  useEffect(() => {
    if (debouncedSearch.trim() !== urlSearch) {
      setParams({ search: debouncedSearch.trim() || undefined, page: undefined });
    }
    // Only the debounced value triggers the URL update.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const queryKey = searchParams.toString();
  // Bumped after a status change so the list shows the new status.
  const [version, setVersion] = useState(0);
  const orders = useFetch(
    () =>
      adminService.listOrders({
        status: status || undefined,
        search: urlSearch || undefined,
        page,
        limit: 15,
      }),
    [queryKey, version],
  );
  const items = orders.body?.data ?? [];
  const meta = orders.body?.meta;

  useEffect(() => {
    document.title = 'Orders · Admin BakeHouse';
  }, []);

  const handlePageChange = (next) => {
    setParams({ page: next > 1 ? next : undefined });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <p className="eyebrow">Operasional</p>
        <h1 className="text-4xl">Orders</h1>
      </header>

      <Card className="grid gap-4 p-5 md:grid-cols-[1fr_220px] md:items-end">
        <Input
          label="Search order number"
          type="search"
          icon={Search}
          placeholder="BH-20260101-0001"
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          maxLength={40}
        />
        <Select
          label="Status"
          value={status}
          onChange={(event) => setParams({ status: event.target.value || undefined, page: undefined })}
          options={STATUS_OPTIONS}
        />
      </Card>

      {orders.loading && <Skeleton className="h-96 w-full" />}
      {orders.error && <p className="text-cocoa">{orders.error.message}</p>}

      {!orders.loading && !orders.error && items.length === 0 && (
        <EmptyState title="No orders found" description="Try changing the filter or search term." />
      )}

      {!orders.loading && items.length > 0 && (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-line bg-sand/20 text-cocoa">
                <tr>
                  <th scope="col" className="px-5 py-3 font-medium">Number</th>
                  <th scope="col" className="px-5 py-3 font-medium">Customer</th>
                  <th scope="col" className="px-5 py-3 font-medium">Tanggal</th>
                  <th scope="col" className="px-5 py-3 font-medium">Total</th>
                  <th scope="col" className="px-5 py-3 font-medium">Status</th>
                  <th scope="col" className="px-5 py-3 font-medium">Payment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {items.map((order) => (
                  <tr
                    key={order._id}
                    onClick={() => setSelectedId(order._id)}
                    className="cursor-pointer transition hover:bg-sand/20"
                  >
                    <td className="px-5 py-4">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          setSelectedId(order._id);
                        }}
                        className="font-mono text-crust underline-offset-4 hover:underline"
                      >
                        {order.orderNumber}
                      </button>
                    </td>
                    <td className="px-5 py-4">
                      <span className="block text-espresso">{order.user?.name ?? 'Account deleted'}</span>
                      <span className="text-xs text-cocoa">{order.user?.email}</span>
                    </td>
                    <td className="px-5 py-4 text-cocoa">{formatDateTime(order.createdAt)}</td>
                    <td className="px-5 py-4 font-medium">{formatRupiah(order.total)}</td>
                    <td className="px-5 py-4">
                      <StatusPill status={order.status} />
                    </td>
                    <td className="px-5 py-4">
                      <PaymentStatusPill paymentStatus={order.paymentStatus} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {meta && <Pagination page={meta.page} totalPages={meta.totalPages} onPageChange={handlePageChange} />}

      <OrderDetailDrawer
        orderId={selectedId}
        open={Boolean(selectedId)}
        onClose={() => setSelectedId(null)}
        onChanged={() => setVersion((v) => v + 1)}
      />
    </div>
  );
}
