import { formatRupiah } from '../../utils/formatRupiah.js';

// Shows the price a customer pays. On sale, the original price is struck through beside it.
// The server decides isOnSale and effectivePrice, so this component does no discount maths.
export default function PriceTag({ price, effectivePrice, isOnSale, className = '', size = 'base' }) {
  const finalPrice = isOnSale ? effectivePrice : price;
  const sizeClass = size === 'lg' ? 'text-3xl' : 'text-lg';

  return (
    <p className={`flex flex-wrap items-baseline gap-2 font-serif text-espresso ${sizeClass} ${className}`}>
      <span className={isOnSale ? 'font-semibold text-crust' : undefined}>{formatRupiah(finalPrice)}</span>
      {isOnSale && (
        <>
          <span className="sr-only">Harga normal</span>
          <s className="font-sans text-sm text-cocoa">{formatRupiah(price)}</s>
        </>
      )}
    </p>
  );
}
