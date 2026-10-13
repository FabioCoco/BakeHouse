import useInView from '../../hooks/useInView.js';

// Fades and slides the content up once it enters the viewport. Reduced-motion users see it immediately.
export default function RevealOnScroll({ as: Tag = 'div', className = '', children, ...props }) {
  const [ref, inView] = useInView({ threshold: 0.15 });

  return (
    <Tag
      ref={ref}
      className={`transition duration-700 ease-out motion-reduce:translate-y-0 motion-reduce:opacity-100 motion-reduce:transition-none ${
        inView ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
      } ${className}`}
      {...props}
    >
      {children}
    </Tag>
  );
}
