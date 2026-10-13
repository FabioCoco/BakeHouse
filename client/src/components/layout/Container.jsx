// Shared page width. Navbar, footer, and every page use it so all edges line up.
export default function Container({ as: Tag = 'div', className = '', children, ...props }) {
  return (
    <Tag className={`mx-auto w-full max-w-7xl px-4 md:px-6 lg:px-8 ${className}`} {...props}>
      {children}
    </Tag>
  );
}
