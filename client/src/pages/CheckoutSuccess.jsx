import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import Container from '../components/layout/Container.jsx';
import BankTransferCard from '../components/order/BankTransferCard.jsx';
import Button from '../components/ui/Button.jsx';
import Card from '../components/ui/Card.jsx';
import Skeleton from '../components/ui/Skeleton.jsx';
import StatusPill from '../components/ui/StatusPill.jsx';
import useFetch from '../hooks/useFetch.js';
import { orderService } from '../services/orderService.js';
import { loadPayment } from '../utils/paymentStorage.js';
import { formatRupiah } from '../utils/formatRupiah.js';
import NotFound from './NotFound.jsx';

export default function CheckoutSuccess() {
  const { id } = useParams();
  const order = useFetch(() => orderService.getMine(id), [id]);
  const payment = loadPayment(id);

  useEffect(() => {
    document.title = 'Pesanan diterima · BakeHouse';
  }, []);

  if (order.loading) {
    return (
      <Container className="py-16" aria-busy="true">
        <Skeleton className="h-96 w-full" />
      </Container>
    );
  }

  if (order.error?.status === 404) return <NotFound />;

  if (order.error) {
    return (
      <Container className="py-16 text-center">
        <p className="text-cocoa">Pesanan belum bisa dimuat. Coba muat ulang halaman.</p>
      </Container>
    );
  }

  const data = order.body.data;

  return (
    <Container className="flex flex-col gap-10 py-12 md:py-16">
      <Card className="flex flex-col items-center gap-4 p-8 text-center md:p-12">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-sage/15 text-sage">
          <CheckCircle2 size={34} aria-hidden="true" />
        </span>
        <p className="eyebrow">Terima kasih</p>
        <h1 className="text-4xl md:text-5xl">Pesananmu sudah kami terima</h1>
        <p className="font-mono text-cocoa">{data.orderNumber}</p>
        <StatusPill status={data.status} />
        <p className="font-serif text-3xl text-espresso">{formatRupiah(data.total)}</p>
      </Card>

      <div className="grid items-start gap-8 lg:grid-cols-2">
        {payment ? (
          <BankTransferCard payment={payment} amount={data.total} orderNumber={data.orderNumber} />
        ) : (
          <Card className="p-6">
            <h2 className="mb-2 text-2xl">Rincian rekening tidak tersedia</h2>
            <p className="text-cocoa">
              Rincian transfer tidak tersimpan di perangkat ini. Hubungi toko untuk mendapatkan nomor rekening dan nomor
              pesanan {data.orderNumber}.
            </p>
          </Card>
        )}

        <Card className="flex flex-col gap-4 p-6">
          <h2 className="text-2xl">Langkah selanjutnya</h2>
          <ol className="flex list-decimal flex-col gap-3 pl-5 text-cocoa">
            <li>Lakukan transfer sesuai jumlah di atas.</li>
            <li>Pantau status pesanan di halaman Pesanan Saya.</li>
            <li>Setelah pembayaran dikonfirmasi, pesanan kami proses dan kirim ke alamatmu.</li>
          </ol>
          <div className="mt-2 flex flex-col gap-3 sm:flex-row">
            <Button as={Link} to={`/orders/${data._id}`} className="flex-1">
              Lihat Detail Pesanan
            </Button>
            <Button as={Link} to="/products" variant="outline" className="flex-1">
              Lanjut Belanja
            </Button>
          </div>
        </Card>
      </div>
    </Container>
  );
}
