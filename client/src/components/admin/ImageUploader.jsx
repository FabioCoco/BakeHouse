import { useId, useRef, useState } from 'react';
import { ImagePlus, X } from 'lucide-react';
import Button from '../ui/Button.jsx';
import { adminService } from '../../services/adminService.js';

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
const MAX_BYTES = 2 * 1024 * 1024;

// Image path for a stored value. Product images live at /uploads, banners at /uploads/banners.
// Older banner values may already be full https URLs, so those are used as they are.
export const imageSrcFor = (kind, value) => {
  if (!value) return null;
  if (/^https:\/\//i.test(value)) return value;
  return kind === 'banner' ? `/uploads/banners/${value}` : `/uploads/${value}`;
};

// Upload area with a preview. Choosing a file uploads it straight away, and the stored file name is passed back.
export default function ImageUploader({ kind = 'product', value, onChange, onRemove, label, hint, error }) {
  const inputId = useId();
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [localError, setLocalError] = useState('');
  const src = imageSrcFor(kind, value);

  const handleFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setLocalError('Pilih file JPG, PNG, WebP, atau AVIF.');
      return;
    }
    if (file.size > MAX_BYTES) {
      setLocalError('Ukuran gambar maksimal 2 MB.');
      return;
    }

    setLocalError('');
    setUploading(true);
    try {
      const uploaded = await adminService.uploadImage(file, kind);
      onChange(uploaded.filename);
    } catch (err) {
      setLocalError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const message = localError || error;

  return (
    <div className="flex flex-col gap-2">
      {label && (
        <span id={`${inputId}-label`} className="text-sm font-medium text-espresso">
          {label}
        </span>
      )}
      <div className="flex items-start gap-4">
        <div className="flex h-28 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-line bg-sand/30">
          {src ? (
            <img src={src} alt="Pratinjau gambar" className="h-full w-full object-cover" />
          ) : (
            <ImagePlus size={24} aria-hidden="true" className="text-cocoa" />
          )}
        </div>

        <div className="flex flex-col gap-2 pt-1">
          <input
            ref={inputRef}
            id={inputId}
            type="file"
            accept={ACCEPTED_TYPES.join(',')}
            onChange={handleFile}
            aria-labelledby={label ? `${inputId}-label` : undefined}
            className="sr-only"
            tabIndex={-1}
          />
          <Button variant="outline" size="sm" disabled={uploading} onClick={() => inputRef.current?.click()}>
            {uploading ? 'Mengunggah…' : value ? 'Ganti gambar' : 'Unggah gambar'}
          </Button>
          {onRemove && (
            <button type="button" onClick={onRemove} className="flex w-fit items-center gap-1 text-sm font-medium text-berry">
              <X size={14} aria-hidden="true" /> Hapus gambar
            </button>
          )}
          {hint && <p className="text-xs text-cocoa">{hint}</p>}
          {message && (
            <p role="alert" className="text-sm text-berry">
              {message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
