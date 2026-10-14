// Optimizes product photos in public/uploads in place.
// Each image is center-cropped to exactly 4:5, resized to 1200x1500, and saved as a progressive JPEG at quality 80.
// Metadata (EXIF, GPS, ICC) is stripped. Banners and dotfiles are skipped.
//
// Usage: npm run images:optimize
import { readdir, rename, rm, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS = path.join(__dirname, '../public/uploads');

const TARGET_WIDTH = 1200;
const TARGET_HEIGHT = 1500;
const JPEG_QUALITY = 80;
const JPEG_EXTENSIONS = new Set(['.jpg', '.jpeg']);

const kb = (bytes) => `${(bytes / 1024).toFixed(0)} KB`;

const main = async () => {
  // Only top-level files. The banners folder is a directory, so it is skipped automatically.
  const entries = await readdir(UPLOADS, { withFileTypes: true });
  const files = entries
    .filter((entry) => entry.isFile() && !entry.name.startsWith('.') && JPEG_EXTENSIONS.has(path.extname(entry.name).toLowerCase()))
    .map((entry) => entry.name)
    .sort();

  if (files.length === 0) {
    console.log('No JPEG product images found in public/uploads.');
    return;
  }

  let totalBefore = 0;
  let totalAfter = 0;

  for (const name of files) {
    const file = path.join(UPLOADS, name);
    const before = (await stat(file)).size;
    const temp = `${file}.tmp`;

    try {
      // rotate() applies the EXIF orientation first, so the crop uses the picture as it is meant to be seen.
      await sharp(file)
        .rotate()
        .resize(TARGET_WIDTH, TARGET_HEIGHT, { fit: 'cover', position: 'centre' })
        .jpeg({ quality: JPEG_QUALITY, progressive: true, mozjpeg: false })
        .toFile(temp);

      // Replace the original only after the new file is fully written.
      await rename(temp, file);
    } catch (err) {
      await rm(temp, { force: true });
      console.error(`FAILED ${name}: ${err.message}`);
      process.exitCode = 1;
      continue;
    }

    const after = (await stat(file)).size;
    totalBefore += before;
    totalAfter += after;
    const meta = await sharp(file).metadata();
    console.log(
      `${name.padEnd(42)} ${kb(before).padStart(8)} -> ${kb(after).padStart(7)}  ${meta.width}x${meta.height}  progressive=${Boolean(meta.isProgressive)}  exif=${Boolean(meta.exif)}`,
    );
  }

  console.log(`\n${files.length} files: ${kb(totalBefore)} -> ${kb(totalAfter)} (${((1 - totalAfter / totalBefore) * 100).toFixed(0)}% smaller)`);
};

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
