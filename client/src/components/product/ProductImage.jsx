import { useState } from 'react';
import { imageUrl } from '../../utils/imageUrl.js';

// Styled stand-in shown when there is no image or it fails to load. Images are still being generated.
export function ImagePlaceholder({ name, className = '' }) {
  return (
    <div
      role="img"
      aria-label={`Photo for ${name} is not available yet`}
      className={`flex h-full w-full items-center justify-center bg-linear-to-br from-honey via-sand to-sand-dark ${className}`}
    >
      <span className="font-serif text-5xl text-crust/60" aria-hidden="true">
        {name?.charAt(0)}
      </span>
    </div>
  );
}

export default function ProductImage({ filename, name, priority = false, sizes, className = '' }) {
  const [failedSrc, setFailedSrc] = useState(null);
  const src = imageUrl(filename);

  if (!src || failedSrc === src) {
    return <ImagePlaceholder name={name} className={className} />;
  }

  return (
    <img
      src={src}
      alt={name}
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : 'auto'}
      decoding="async"
      sizes={sizes}
      onError={() => setFailedSrc(src)}
      className={`h-full w-full object-cover ${className}`}
    />
  );
}
