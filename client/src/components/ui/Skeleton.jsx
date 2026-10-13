// Loading placeholder. Pulse is removed under prefers-reduced-motion by the global rule in index.css.
export default function Skeleton({ className = '' }) {
  return <div aria-hidden="true" className={`animate-pulse rounded-xl bg-sand/50 ${className}`} />;
}
