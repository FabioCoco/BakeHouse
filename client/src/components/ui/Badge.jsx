const TONES = {
  neutral: 'bg-sand/40 text-espresso',
  honey: 'bg-honey text-crust',
  sage: 'bg-sage/15 text-sage',
  berry: 'bg-berry/10 text-berry',
  golden: 'bg-golden/20 text-espresso',
};

// Small chip for labels such as origin ("France") or category.
export default function Badge({ tone = 'neutral', className = '', children }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${TONES[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
