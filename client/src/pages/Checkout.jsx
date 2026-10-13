import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertTriangle, ShoppingBag } from 'lucide-react';
import toast from 'react-hot-toast';
import Container from '../components/layout/Container.jsx';
import AddressFields from '../components/address/AddressFields.jsx';
import Button from '../components/ui/Button.jsx';
import Card from '../components/ui/Card.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import Input from '../components/ui/Input.jsx';
import Skeleton from '../components/ui/Skeleton.jsx';
import useCart from '../hooks/useCart.js';
import useFetch from '../hooks/useFetch.js';
import useMidtransSnap from '../hooks/useMidtransSnap.js';
import { addressService } from '../services/addressService.js';
import { orderService } from '../services/orderService.js';
import { useCartStore } from '../store/useCartStore.js';
import { formatRupiah } from '../utils/formatRupiah.js';
import { ADDRESS_EMPTY, mapServerErrors, toAddressPayload, validateAddress } from '../utils/validators.js';

export default function Checkout() {
  const navigate = useNavigate();
  const cart = useCartStore((state) => state.cart);
  const cartStatus = useCartStore((state) => state.status);
  const { refresh } = useCart();
  const { pay } = useMidtransSnap();

  const addresses = useFetch(() => addressService.list(), []);
  const savedAddresses = addresses.body?.data ?? [];
  const defaultAddressId = (savedAddresses.find((a) => a.isDefault) ?? savedAddresses[0])?._id;

  // Mode is 'saved' or 'new'. With no saved addresses the form is shown straight away.
  const [mode, setMode] = useState('saved');
  const [selectedId, setSelectedId] = useState(null);
  const [newAddress, setNewAddress] = useState(ADDRESS_EMPTY);
  const [addressErrors, setAddressErrors] = useState({});
  const [paymentNote, setPaymentNote] = useState('');
  const [stockIssues, setStockIssues] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const activeMode = savedAddresses.length === 0 ? 'new' : mode;
  const activeId = selectedId ?? defaultAddressId;

  useEffect(() => {
    document.title = 'Checkout · BakeHouse';
  }, []);

  const handleNewAddressChange = (name, value) => {
    setNewAddress((prev) => ({ ...prev, [name]: value }));
    setAddressErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleCheckoutError = (err) => {
    // 409 means stock or availability changed after the cart was loaded. Show what changed and reload the cart.
    if (err.status === 409 && err.errors?.length) {
      const messages = err.errors.map((issue) => {
        const name = issue.name ?? cart?.items.find((line) => line.product?._id === issue.product)?.product?.name;
        if (issue.requested !== undefined) {
          return `${name}: diminta ${issue.requested}, tersisa ${issue.available}.`;
        }
        return `${name ?? 'Sebuah roti'} sudah tidak tersedia.`;
      });
      setStockIssues(messages);
      refresh();
      toast.error('Keranjang sudah berubah. Periksa kembali pesananmu.');
      return;
    }

    // Field errors from the server look like "address.phone". Strip the prefix to match the form fields.
    const fieldErrors = Object.fromEntries(
      Object.entries(mapServerErrors(err.errors)).map(([key, message]) => [key.replace(/^address\./, ''), message]),
    );
    if (Object.keys(fieldErrors).length) {
      setAddressErrors(fieldErrors);
    } else {
      toast.error(err.message);
    }
  };

  const handleConfirm = async () => {
    setStockIssues([]);
    let payload;

    if (activeMode === 'saved') {
      if (!activeId) {
        toast.error('Pilih alamat pengiriman dulu.');
        return;
      }
      payload = { addressId: activeId };
    } else {
      const errors = validateAddress(newAddress);
      setAddressErrors(errors);
      if (Object.keys(errors).length) return;
      payload = { address: toAddressPayload(newAddress) };
    }

    const note = paymentNote.trim();
    if (note) payload.paymentNote = note;

    setSubmitting(true);
    let created;
    try {
      created = await orderService.checkout(payload);
      refresh();
    } catch (err) {
      handleCheckoutError(err);
      setSubmitting(false);
      return;
    }

    // The order exists now. Open the Midtrans popup. Its callbacks take the customer to the order page.
    try {
      await pay(created.snapToken, created.order._id);
    } catch (err) {
      toast.error(err.message);
      navigate(`/orders/${created.order._id}`, { replace: true });
    } finally {
      setSubmitting(false);
    }
  };

  if (cartStatus === 'loading' && !cart) {
    return (
      <Container className="py-12" aria-busy="true">
        <Skeleton className="h-96 w-full" />
      </Container>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <Container className="py-16">
        <EmptyState
          icon={ShoppingBag}
          title="Tidak ada yang perlu di-checkout"
          description="Keranjangmu masih kosong."
          action={
            <Button as={Link} to="/products" variant="outline">
              Lihat Menu
            </Button>
          }
        />
      </Container>
    );
  }

  const canConfirm = !submitting && !cart.hasIssues && !addresses.loading;

  return (
    <Container className="flex flex-col gap-10 py-12 md:py-16">
      <header className="flex flex-col gap-2">
        <p className="eyebrow">Checkout</p>
        <h1 className="text-5xl">Konfirmasi Pesanan</h1>
      </header>

      <div className="grid items-start gap-8 lg:grid-cols-[1fr_380px]">
        <div className="flex flex-col gap-6">
          <Card className="flex flex-col gap-6 p-6 md:p-8">
            <h2 className="text-2xl">Alamat Pengiriman</h2>

            {addresses.loading && <Skeleton className="h-24 w-full" />}
            {addresses.error && <p className="text-cocoa">Alamat belum bisa dimuat. Muat ulang halaman.</p>}

            {!addresses.loading && savedAddresses.length > 0 && (
              <fieldset className="flex flex-col gap-3">
                <legend className="sr-only">Pilih alamat</legend>
                {savedAddresses.map((address) => {
                  const checked = activeMode === 'saved' && activeId === address._id;
                  return (
                    <label
                      key={address._id}
                      className={`flex cursor-pointer gap-4 rounded-xl border p-4 transition ${
                        checked ? 'border-crust bg-honey/30' : 'border-line hover:border-sand-dark'
                      }`}
                    >
                      <input
                        type="radio"
                        name="shipping-address"
                        value={address._id}
                        checked={checked}
                        onChange={() => {
                          setMode('saved');
                          setSelectedId(address._id);
                        }}
                        className="mt-1 accent-crust"
                      />
                      <span className="flex flex-col gap-0.5 text-sm">
                        <span className="font-medium text-espresso">
                          {address.label} · {address.recipientName}
                          {address.isDefault && <span className="ml-2 text-xs text-crust">Utama</span>}
                        </span>
                        <span className="text-cocoa">{address.phone}</span>
                        <span className="text-cocoa">
                          {address.street}, {address.city}, {address.province} {address.postalCode}
                        </span>
                      </span>
                    </label>
                  );
                })}
                <button
                  type="button"
                  onClick={() => setMode('new')}
                  className="w-fit text-sm font-medium text-crust underline-offset-4 hover:underline"
                >
                  + Gunakan alamat baru
                </button>
              </fieldset>
            )}

            {!addresses.loading && activeMode === 'new' && (
              <div className="flex flex-col gap-4">
                {savedAddresses.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setMode('saved')}
                    className="w-fit text-sm font-medium text-crust underline-offset-4 hover:underline"
                  >
                    ← Kembali ke alamat tersimpan
                  </button>
                )}
                <AddressFields
                  idPrefix="checkout"
                  showLabel={false}
                  values={newAddress}
                  errors={addressErrors}
                  onChange={handleNewAddressChange}
                />
              </div>
            )}
          </Card>

          <Card className="flex flex-col gap-4 p-6 md:p-8">
            <h2 className="text-2xl">Pembayaran</h2>
            <p className="text-cocoa">
              Pembayaran diproses dengan aman oleh Midtrans. Kamu bisa membayar lewat transfer bank, kartu, atau
              e-wallet. Pesanan menunggu pembayaran selama 24 jam.
            </p>
            <Input
              label="Catatan untuk toko (opsional)"
              hint="Misalnya permintaan khusus untuk pengiriman."
              value={paymentNote}
              maxLength={200}
              onChange={(event) => setPaymentNote(event.target.value)}
            />
          </Card>
        </div>

        <Card className="flex flex-col gap-5 p-6 lg:sticky lg:top-24">
          <h2 className="text-2xl">Ringkasan Pesanan</h2>

          {cart.hasIssues && (
            <p role="alert" className="flex items-start gap-2 rounded-xl bg-berry/10 p-3 text-sm text-berry">
              <AlertTriangle size={16} aria-hidden="true" className="mt-0.5 shrink-0" />
              Ada roti di keranjang yang perlu diperbarui.{' '}
              <Link to="/cart" className="font-medium underline underline-offset-4">
                Buka keranjang
              </Link>
            </p>
          )}

          {stockIssues.length > 0 && (
            <div role="alert" className="flex flex-col gap-1 rounded-xl bg-berry/10 p-3 text-sm text-berry">
              <p className="font-medium">Pesanan belum dibuat. Ada perubahan:</p>
              {stockIssues.map((message) => (
                <p key={message}>{message}</p>
              ))}
            </div>
          )}

          <ul className="flex flex-col gap-3 text-sm">
            {cart.items.map((line, index) =>
              line.product ? (
                <li key={line.product._id} className="flex justify-between gap-4">
                  <span className="text-espresso">
                    {line.product.name} <span className="text-cocoa">× {line.quantity}</span>
                  </span>
                  <span className="shrink-0 font-medium">{formatRupiah(line.lineTotal)}</span>
                </li>
              ) : (
                <li key={`missing-${index}`} className="text-berry">
                  Produk tidak tersedia
                </li>
              ),
            )}
          </ul>

          <div className="flex flex-col gap-2 border-t border-line pt-4 text-sm">
            <div className="flex justify-between">
              <span className="text-cocoa">Subtotal</span>
              <span className="font-medium">{formatRupiah(cart.subtotal)}</span>
            </div>
            <p className="text-xs text-cocoa">Ongkos kirim dihitung saat pesanan dibuat dan ditampilkan di halaman konfirmasi.</p>
          </div>

          <Button size="lg" className="w-full" disabled={!canConfirm} onClick={handleConfirm}>
            {submitting ? 'Memproses…' : 'Bayar Sekarang'}
          </Button>
        </Card>
      </div>
    </Container>
  );
}
