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
      {showLabel && field('label', 'Label alamat (opsional)', { placeholder: 'Rumah, Kantor…', maxLength: 40, className: 'sm:col-span-2' })}
      {field('recipientName', 'Nama penerima', { autoComplete: 'name', maxLength: 100 })}
      {field('phone', 'Nomor telepon', { type: 'tel', autoComplete: 'tel', maxLength: 20 })}
      {field('street', 'Alamat lengkap', { autoComplete: 'street-address', maxLength: 200, className: 'sm:col-span-2' })}
      {field('city', 'Kota', { autoComplete: 'address-level2', maxLength: 100 })}
      {field('province', 'Provinsi', { autoComplete: 'address-level1', maxLength: 100 })}
      {field('postalCode', 'Kode pos', { autoComplete: 'postal-code', maxLength: 10 })}
    </div>
  );
}
