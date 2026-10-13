export default function Card({ as: Tag = 'div', className = '', children, ...props }) {
  return (
    <Tag className={`rounded-2xl border border-line bg-surface shadow-soft ${className}`} {...props}>
      {children}
    </Tag>
  );
}
