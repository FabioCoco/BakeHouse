import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import Card from '../../components/ui/Card.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import ProductImage from '../../components/product/ProductImage.jsx';
import Select from '../../components/ui/Select.jsx';
import Skeleton from '../../components/ui/Skeleton.jsx';
import StatusPill from '../../components/ui/StatusPill.jsx';
import useFetch from '../../hooks/useFetch.js';
import useQueryParams from '../../hooks/useQueryParams.js';
import { adminService } from '../../services/adminService.js';
import { formatDateTime } from '../../utils/formatDate.js';
import { formatRupiah } from '../../utils/formatRupiah.js';
import { ORDER_STATUS_MAP } from '../../utils/statusMap.js';

// Palette from the design system, so the charts read as part of the same site.
const COLORS = { crust: '#8A4B1C', golden: '#E3A35C', sage: '#6E7F5E', cocoa: '#6B5444', sandDark: '#C8A98A', line: '#E8DCCB' };
const CATEGORY_COLORS = [COLORS.crust, COLORS.golden, COLORS.sage, COLORS.cocoa, COLORS.sandDark];

const RANGE_OPTIONS = [
  { value: '7d', label: '7 hari terakhir' },
  { value: '30d', label: '30 hari terakhir' },
  { value: '90d', label: '90 hari terakhir' },
];

const shortDate = (iso) => new Date(`${iso}T00:00:00Z`).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', timeZone: 'UTC' });

export default function AdminDashboard() {
  const [searchParams, setParams] = useQueryParams();
  const range = searchParams.get('range') || '30d';

  const analytics = useFetch(() => adminService.analytics(range), [range]);
  const summary = useFetch(() => adminService.summary(), []);
  const data = analytics.body;
  const summaryData = summary.body?.data;

  useEffect(() => {
    document.title = 'Dashboard Admin · BakeHouse';
  }, []);

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-1">
          <p className="eyebrow">Ringkasan</p>
          <h1 className="text-4xl">Dashboard</h1>
        </div>
        <div className="w-full sm:w-64">
          <Select
            label="Rentang waktu"
            value={range}
            onChange={(event) => setParams({ range: event.target.value === '30d' ? undefined : event.target.value })}
            options={RANGE_OPTIONS}
          />
        </div>
      </header>

      {analytics.loading && <Skeleton className="h-32 w-full" />}
      {analytics.error && <p className="text-cocoa">Analitik belum bisa dimuat.</p>}

      {data && (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Kpi label="Pendapatan" value={formatRupiah(data.kpis.revenue.value)} change={data.kpis.revenue.changePct} />
            <Kpi label="Pesanan dibayar" value={data.kpis.orders.value} change={data.kpis.orders.changePct} />
            <Kpi label="Rata-rata nilai pesanan" value={formatRupiah(data.kpis.averageOrderValue.value)} change={data.kpis.averageOrderValue.changePct} />
            <Kpi
              label="Konversi pembayaran"
              value={`${data.kpis.conversion.rate}%`}
              hint={`${data.kpis.conversion.paid} dari ${data.kpis.conversion.created} pesanan dibuat dibayar`}
            />
          </div>

          <Card className="flex flex-col gap-4 p-6">
            <h2 className="text-2xl">Pendapatan per hari</h2>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.revenueByDay} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
                  <CartesianGrid stroke={COLORS.line} vertical={false} />
                  <XAxis dataKey="date" tickFormatter={shortDate} stroke={COLORS.cocoa} tick={{ fontSize: 12 }} minTickGap={24} />
                  <YAxis tickFormatter={(v) => `${Math.round(v / 1000)}rb`} stroke={COLORS.cocoa} tick={{ fontSize: 12 }} width={56} />
                  <Tooltip
                    labelFormatter={shortDate}
                    formatter={(value, name) => (name === 'revenue' ? [formatRupiah(value), 'Pendapatan'] : [value, 'Pesanan'])}
                  />
                  <Line type="monotone" dataKey="revenue" stroke={COLORS.crust} strokeWidth={2.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="flex flex-col gap-4 p-6">
              <h2 className="text-2xl">Produk terlaris</h2>
              {data.topProducts.byQuantity.length === 0 ? (
                <p className="text-cocoa">Belum ada penjualan pada rentang ini.</p>
              ) : (
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.topProducts.byQuantity} layout="vertical" margin={{ top: 4, right: 16, bottom: 0, left: 8 }}>
                      <CartesianGrid stroke={COLORS.line} horizontal={false} />
                      <XAxis type="number" stroke={COLORS.cocoa} tick={{ fontSize: 12 }} allowDecimals={false} />
                      <YAxis type="category" dataKey="name" width={150} stroke={COLORS.cocoa} tick={{ fontSize: 12 }} />
                      <Tooltip formatter={(value, name) => (name === 'quantity' ? [value, 'Terjual'] : [formatRupiah(value), 'Pendapatan'])} />
                      <Bar dataKey="quantity" fill={COLORS.crust} radius={[0, 6, 6, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>

            <Card className="flex flex-col gap-4 p-6">
              <h2 className="text-2xl">Pendapatan per kategori</h2>
              {data.revenueByCategory.length === 0 ? (
                <p className="text-cocoa">Belum ada penjualan pada rentang ini.</p>
              ) : (
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.revenueByCategory} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
                      <CartesianGrid stroke={COLORS.line} vertical={false} />
                      <XAxis dataKey="category" stroke={COLORS.cocoa} tick={{ fontSize: 12 }} interval={0} />
                      <YAxis tickFormatter={(v) => `${Math.round(v / 1000)}rb`} stroke={COLORS.cocoa} tick={{ fontSize: 12 }} width={56} />
                      <Tooltip formatter={(value) => [formatRupiah(value), 'Pendapatan']} />
                      <Bar dataKey="revenue" radius={[6, 6, 0, 0]}>
                        {data.revenueByCategory.map((entry, i) => (
                          <Cell key={entry.category} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>
          </div>
        </>
      )}

      {summary.loading && <Skeleton className="h-64 w-full" />}

      {summaryData && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="flex flex-col gap-5 p-6">
            <h2 className="text-2xl">Pesanan per Status</h2>
            <StatusBreakdown counts={summaryData.ordersByStatus} />
          </Card>

          <Card className="flex flex-col gap-5 p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl">Stok Menipis</h2>
              <Link to="/admin/products" className="text-sm font-medium text-crust hover:underline">
                Kelola produk →
              </Link>
            </div>
            {!data || data.lowStock.length === 0 ? (
              <p className="text-cocoa">Semua produk aktif masih punya stok cukup.</p>
            ) : (
              <ul className="divide-y divide-line">
                {data.lowStock.map((product) => (
                  <li key={product._id} className="flex items-center gap-4 py-3">
                    <div className="h-12 w-10 shrink-0 overflow-hidden rounded-lg bg-sand/40">
                      <ProductImage filename={product.images?.[0]} name={product.name} />
                    </div>
                    <span className="flex-1 text-sm font-medium text-espresso">{product.name}</span>
                    <span className={`text-sm font-semibold ${product.stock === 0 ? 'text-berry' : 'text-crust'}`}>
                      {product.stock === 0 ? 'Habis' : `Sisa ${product.stock}`}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      )}

      {summaryData && (
        <Card className="flex flex-col gap-4 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl">Pesanan Terbaru</h2>
            <Link to="/admin/orders" className="text-sm font-medium text-crust hover:underline">
              Semua pesanan →
            </Link>
          </div>
          {summaryData.latestOrders.length === 0 ? (
            <EmptyState title="Belum ada pesanan" />
          ) : (
            <ul className="divide-y divide-line">
              {summaryData.latestOrders.map((order) => (
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
      )}
    </div>
  );
}

// Change against the previous period. A null change means the previous period had nothing to compare with.
function Kpi({ label, value, change, hint }) {
  const hasChange = change !== null && change !== undefined;
  const changeText = hasChange
    ? `${change > 0 ? '+' : ''}${change}% dari periode sebelumnya`
    : 'Belum ada pembanding';
  const changeClass = !hasChange ? 'text-cocoa' : change >= 0 ? 'text-sage' : 'text-berry';

  return (
    <Card className="flex flex-col gap-2 p-6">
      <p className="text-sm text-cocoa">{label}</p>
      <p className="font-serif text-3xl text-espresso">{value}</p>
      {hint ? <p className="text-xs text-cocoa">{hint}</p> : <p className={`text-xs ${changeClass}`}>{changeText}</p>}
    </Card>
  );
}

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
