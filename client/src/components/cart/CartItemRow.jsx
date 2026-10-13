import { Link } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import ProductImage from '../product/ProductImage.jsx';
import QuantityStepper from '../ui/QuantityStepper.jsx';
import { formatRupiah } from '../../utils/formatRupiah.js';

const MAX_QUANTITY = 99;

const ISSUE_MESSAGES = {
  unavailable: 'Roti ini sudah tidak tersedia. Hapus dari keranjang.',
  insufficient_stock: 'Stok tidak cukup. Kurangi jumlahnya.',
};

// One line in the cart. Used by the drawer and the cart page.
export default function CartItemRow({ line, onQuantityChange, onRemove }) {
  const { product, quantity, lineTotal, issues } = line;

  if (!product) {
    return (
      <li className="py-4 text-sm text-berry">Produk ini sudah tidak tersedia. Kosongkan keranjang untuk melanjutkan.</li>
    );
  }

  const { name, slug, price, stock, images } = product;
  const unavailable = issues.includes('unavailable');
  const maxQuantity = Math.min(MAX_QUANTITY, Math.max(stock, 1));

  return (
    <li className="flex gap-4 py-5">
      <Link to={`/products/${slug}`} className="h-24 w-20 shrink-0 overflow-hidden rounded-xl bg-sand/40" tabIndex={-1} aria-hidden="true">
        <ProductImage filename={images?.[0]} name={name} />
      </Link>

      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link to={`/products/${slug}`} className="font-serif text-lg text-espresso hover:underline underline-offset-4">
              {name}
            </Link>
            <p className="text-sm text-cocoa">{formatRupiah(price)}</p>
          </div>
          <button
            type="button"
            onClick={() => onRemove(product._id)}
            aria-label={`Hapus ${name} dari keranjang`}
            className="rounded-full p-2 text-cocoa transition hover:bg-berry/10 hover:text-berry"
          >
            <Trash2 size={18} aria-hidden="true" />
          </button>
        </div>

        {issues.map((issue) => (
          <p key={issue} role="status" className="text-sm font-medium text-berry">
            {ISSUE_MESSAGES[issue]}
          </p>
        ))}

        <div className="mt-auto flex flex-wrap items-center justify-between gap-3">
          <QuantityStepper
            label={`Jumlah ${name}`}
            value={quantity}
            min={1}
            max={maxQuantity}
            disabled={unavailable}
            onChange={(next) => onQuantityChange(product._id, next)}
          />
          <p className="font-medium text-espresso">{formatRupiah(lineTotal)}</p>
        </div>
        {stock > 0 && stock <= 5 && !issues.length && (
          <p className="text-xs text-cocoa">Sisa {stock} di toko.</p>
        )}
      </div>
    </li>
  );
}
