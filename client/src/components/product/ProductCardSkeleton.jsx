import Card from '../ui/Card.jsx';
import Skeleton from '../ui/Skeleton.jsx';

export default function ProductCardSkeleton() {
  return (
    <Card className="flex h-full flex-col overflow-hidden">
      <Skeleton className="aspect-[4/5] w-full rounded-none" />
      <div className="flex flex-col gap-3 p-5">
        <Skeleton className="h-5 w-1/3" />
        <Skeleton className="h-6 w-2/3" />
        <Skeleton className="h-5 w-1/4" />
      </div>
    </Card>
  );
}
