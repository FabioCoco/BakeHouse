const VARIANTS = {
  primary: 'bg-crust text-surface hover:bg-crust-hover shadow-soft',
  outline: 'border border-espresso text-espresso hover:bg-espresso hover:text-surface',
  ghost: 'text-espresso hover:bg-sand/40',
  danger: 'bg-berry text-surface hover:bg-berry/90',
};

const SIZES = {
  sm: 'h-9 px-4 text-sm',
  md: 'h-11 px-6 text-sm',
  lg: 'h-12 px-8 text-base',
};

// `as` renders the button as another element, for example a router Link: <Button as={Link} to="/login">.
export default function Button({
  as: Component = 'button',
  variant = 'primary',
  size = 'md',
  type = 'button',
  className = '',
  disabled = false,
  children,
  ...props
}) {
  const isNativeButton = Component === 'button';

  return (
    <Component
      {...(isNativeButton && { type, disabled })}
      className={`inline-flex items-center justify-center gap-2 rounded-full font-medium transition duration-200 ease-out disabled:cursor-not-allowed disabled:opacity-50 ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...props}
    >
      {children}
    </Component>
  );
}
