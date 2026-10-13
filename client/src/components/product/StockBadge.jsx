import Badge from '../ui/Badge.jsx';
import { getStockState } from '../../utils/stock.js';

export default function StockBadge({ stock }) {
  const { label, tone } = getStockState(stock);
  return <Badge tone={tone}>{label}</Badge>;
}
