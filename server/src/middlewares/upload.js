import { randomUUID } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import multer from 'multer';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ApiError } from '../utils/ApiError.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOAD_ROOT = path.join(__dirname, '../../public/uploads');

// Each kind of image has its own folder. Product images stay at the root so existing /uploads/<file> links keep working.
const FOLDERS = {
  product: UPLOAD_ROOT,
  banner: path.join(UPLOAD_ROOT, 'banners'),
};

const MIME_TO_EXT = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/avif': '.avif',
};

const MAX_FILE_BYTES = 2 * 1024 * 1024;

for (const folder of Object.values(FOLDERS)) {
  mkdirSync(folder, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, _file, cb) => cb(null, FOLDERS[req.query.kind] ?? FOLDERS.product),
  // A random name never collides with an existing file and cannot be guessed from the product name.
  filename: (_req, file, cb) => cb(null, `${randomUUID()}${MIME_TO_EXT[file.mimetype]}`),
});

const multerUpload = multer({
  storage,
  limits: { fileSize: MAX_FILE_BYTES, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (!MIME_TO_EXT[file.mimetype]) {
      return cb(ApiError.badRequest('Only JPG, PNG, WebP, or AVIF images are allowed'));
    }
    return cb(null, true);
  },
}).single('file');

// Turns multer's own errors into the API's error shape. Without this a too-large file would surface as a 500.
export const uploadImage = (req, res, next) => {
  if (!FOLDERS[req.query.kind]) {
    return next(ApiError.badRequest('kind must be "product" or "banner"'));
  }

  multerUpload(req, res, (err) => {
    if (!err) {
      if (!req.file) return next(ApiError.badRequest('Attach an image in the "file" field'));
      return next();
    }
    if (err.code === 'LIMIT_FILE_SIZE') {
      return next(new ApiError(413, 'Image must be 2 MB or smaller'));
    }
    return next(err instanceof ApiError ? err : ApiError.badRequest(err.message));
  });
};

export const uploadUrlFor = (kind, filename) => (kind === 'banner' ? `/uploads/banners/${filename}` : `/uploads/${filename}`);
