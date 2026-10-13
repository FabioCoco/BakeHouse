import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import toast from 'react-hot-toast';
import Card from '../ui/Card.jsx';
import Button from '../ui/Button.jsx';
import { formatRupiah } from '../../utils/formatRupiah.js';

// Shows where to transfer. The details come from checkout, so they are passed in by the page.
export default function BankTransferCard({ payment, amount, orderNumber }) {
  const [copied, setCopied] = useState(false);

  const copyAccount = async () => {
    try {
      await navigator.clipboard.writeText(payment.accountNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Nomor rekening tidak bisa disalin. Salin secara manual.');
    }
  };

  return (
    <Card className="flex flex-col gap-5 p-6">
      <div className="flex flex-col gap-1">
        <p className="eyebrow">Pembayaran</p>
        <h2 className="text-2xl">Transfer Bank</h2>
      </div>

      <dl className="grid gap-4 sm:grid-cols-2">
        <div>
          <dt className="text-sm text-cocoa">Bank</dt>
          <dd className="font-medium text-espresso">{payment.bankName}</dd>
        </div>
        <div>
          <dt className="text-sm text-cocoa">Atas nama</dt>
          <dd className="font-medium text-espresso">{payment.accountHolder}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-sm text-cocoa">Nomor rekening</dt>
          <dd className="mt-1 flex flex-wrap items-center gap-3">
            <span className="font-mono text-xl tracking-wide text-espresso">{payment.accountNumber}</span>
            <Button variant="outline" size="sm" onClick={copyAccount} aria-label="Salin nomor rekening">
              {copied ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
              {copied ? 'Tersalin' : 'Salin'}
            </Button>
          </dd>
        </div>
        {amount !== undefined && (
          <div className="sm:col-span-2">
            <dt className="text-sm text-cocoa">Jumlah transfer</dt>
            <dd className="font-serif text-2xl text-espresso">{formatRupiah(amount)}</dd>
          </div>
        )}
      </dl>

      {orderNumber && (
        <p className="rounded-xl bg-honey/60 p-3 text-sm text-espresso">
          Cantumkan nomor pesanan <span className="font-semibold">{orderNumber}</span> di catatan transfer.
        </p>
      )}
    </Card>
  );
}
