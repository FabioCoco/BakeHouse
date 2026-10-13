// Product images are served by the API at /uploads. Returns null when there is no filename,
// so callers render the styled placeholder instead.
export const imageUrl = (filename) => (filename ? `/uploads/${filename}` : null);
