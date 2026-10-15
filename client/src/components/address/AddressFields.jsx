import Input from '../ui/Input.jsx';

// Controlled address fields. The parent owns the values and the validation errors.
export default function AddressFields({ values, errors = {}, onChange, idPrefix = 'address', showLabel = true }) {
  const field = (name, label, props = {}) => (
    <Input
      id={`${idPrefix}-${name}`}
      name={name}
      label={label}
      value={values[name] ?? ''}
      onChange={(event) => onChange(name, event.target.value)}
      error={errors[name]}
      {...props}
    />
  );

  return (
    <div className="grid gap-5 sm:grid-cols-2">
      {showLabel && field('label', 'Address label (optional)', { placeholder: 'Home, Office…', maxLength: 40, className: 'sm:col-span-2' })}
      {field('recipientName', 'Recipient name', { autoComplete: 'name', maxLength: 100 })}
      {field('phone', 'Phone number', { type: 'tel', autoComplete: 'tel', maxLength: 20 })}
      {field('street', 'Street address', { autoComplete: 'street-address', maxLength: 200, className: 'sm:col-span-2' })}
      {field('city', 'City', { autoComplete: 'address-level2', maxLength: 100 })}
      {field('province', 'Province', { autoComplete: 'address-level1', maxLength: 100 })}
      {field('postalCode', 'Postal code', { autoComplete: 'postal-code', maxLength: 10 })}
    </div>
  );
}
