import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/ui/Card.jsx';
import ProductImage from '../../components/product/ProductImage.jsx';
import Skeleton from '../../components/ui/Skeleton.jsx';
import StatusPill from '../../components/ui/StatusPill.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import useFetch from '../../hooks/useFetch.js';
import { adminService } from '../../services/adminService.js';
import { ORDER_STATUS_MAP } from '../../utils/statusMap.js';
import { formatDateTime } from '../../utils/formatDate.js';
import { formatRupiah } from '../../utils/formatRupiah.js';

export default function AdminDashboard() {
  const summary = useFetch(() => adminService.summary(), []);
  const data = summary.body?.data;

  useEffect(() => {
    document.title = 'Dashboard Admin · BakeHouse';
  }, []);

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-1">
        <p className="eyebrow">Ringkasan</p>
        <h1 className="text-4xl">Dashboard</h1>
      </header>

      {summary.loading && (
        <div className="grid gap-4 md:grid-cols-3" aria-busy="true">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      )}

      {summary.error && <p className="text-cocoa">Ringkasan belum bisa dimuat.</p>}

      {data && (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <Kpi label="Total Pesanan" value={data.totalOrders} />
            <Kpi label="Total Pendapatan" value={formatRupiah(data.totalRevenue)} hint="Tidak termasuk pesanan dibatalkan" />
            <Kpi label="Produk Aktif" value={data.activeProducts} />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="flex flex-col gap-5 p-6">
              <h2 className="text-2xl">Pesanan per Status</h2>
              <StatusBreakdown counts={data.ordersByStatus} />
            </Card>

            <Card className="flex flex-col gap-5 p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl">Stok Menipis</h2>
                <Link to="/admin/products" className="text-sm font-medium text-crust hover:underline">
                  Kelola produk →
                </Link>
              </div>
              {data.lowStockProducts.length === 0 ? (
                <p className="text-cocoa">Semua produk aktif masih punya stok cukup.</p>
              ) : (
                <ul className="divide-y divide-line">
                  {data.lowStockProducts.map((product) => (
                    <li key={product._id} className="flex items-center gap-4 py-3">
                      <div className="h-12 w-10 shrink-0 overflow-hidden rounded-lg bg-sand/40">
                        <ProductImage filename={product.images?.[0]} name={product.name} />
                      </div>
                      <span className="flex-1 text-sm font-medium text-espresso">{product.name}</span>
                      <span
                        className={`text-sm font-semibold ${product.stock === 0 ? 'text-berry' : 'text-crust'}`}
                      >
                        {product.stock === 0 ? 'Habis' : `Sisa ${product.stock}`}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>

          <Card className="flex flex-col gap-4 p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl">Pesanan Terbaru</h2>
              <Link to="/admin/orders" className="text-sm font-medium text-crust hover:underline">
                Semua pesanan →
              </Link>
            </div>
            {data.latestOrders.length === 0 ? (
              <EmptyState title="Belum ada pesanan" />
            ) : (
              <ul className="divide-y divide-line">
                {data.latestOrders.map((order) => (
                  <li key={order._id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
                    <div className="flex flex-col">
                      <span className="font-mono text-espresso">{order.orderNumber}</span>
                      <span className="text-cocoa">
                        {order.user?.name ?? 'Akun dihapus'} · {formatDateTime(order.createdAt)}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <StatusPill status={order.status} />
                      <span className="font-medium">{formatRupiah(order.total)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </>
      )}
    </div>
  );
}

function Kpi({ label, value, hint }) {
  return (
    <Card className="flex flex-col gap-2 p-6">
      <p className="text-sm text-cocoa">{label}</p>
      <p className="font-serif text-4xl text-espresso">{value}</p>
      {hint && <p className="text-xs text-cocoa">{hint}</p>}
    </Card>
  );
}

// Horizontal bars, scaled to the largest count so the proportions read at a glance.
function StatusBreakdown({ counts }) {
  const max = Math.max(1, ...Object.values(counts));

  return (
    <ul className="flex flex-col gap-4">
      {Object.entries(counts).map(([status, count]) => (
        <li key={status} className="flex flex-col gap-1.5">
          <div className="flex justify-between text-sm">
            <span className="text-espresso">{ORDER_STATUS_MAP[status]?.label ?? status}</span>
            <span className="font-medium tabular-nums">{count}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-line" role="presentation">
            <div className="h-full rounded-full bg-crust transition-all duration-500" style={{ width: `${(count / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}
