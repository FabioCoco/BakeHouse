import { ORDER_STATUS_MAP } from '../../utils/statusMap.js';
import { formatDateTime } from '../../utils/formatDate.js';

// Vertical timeline built from statusHistory. The newest step is last and marked as current.
export default function OrderTimeline({ history }) {
  return (
    <ol className="flex flex-col">
      {history.map((step, index) => {
        const isLast = index === history.length - 1;
        return (
          <li key={`${step.status}-${index}`} className="relative flex gap-4 pb-8 last:pb-0">
            {!isLast && <span aria-hidden="true" className="absolute left-[7px] top-5 h-full w-px bg-sand-dark" />}
            <span
              aria-hidden="true"
              className={`relative mt-1 h-4 w-4 shrink-0 rounded-full border-2 ${
                isLast ? 'border-crust bg-crust' : 'border-sand-dark bg-surface'
              }`}
            />
            <div className="flex flex-col gap-1">
              <p className={`font-medium ${isLast ? 'text-espresso' : 'text-cocoa'}`}>
                {ORDER_STATUS_MAP[step.status]?.label ?? step.status}
              </p>
              <p className="text-sm text-cocoa">{formatDateTime(step.changedAt)}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
