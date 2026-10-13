// Shown when a list has no items. Pass an action (for example a "reset filter" button) when relevant.
export default function EmptyState({ icon: Icon, title, description, action, className = '' }) {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 px-6 py-16 text-center ${className}`}>
      {Icon && (
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-honey text-crust">
          <Icon size={26} aria-hidden="true" />
        </span>
      )}
      <h3 className="text-2xl">{title}</h3>
      {description && <p className="max-w-sm text-cocoa">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
