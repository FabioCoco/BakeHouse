import { uploadUrlFor } from '../middlewares/upload.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';

// Returns the stored file name. Products save the name on the product, banners save it on the banner.
export const uploadImage = asyncHandler(async (req, res) => {
  const kind = req.query.kind;
  sendSuccess(res, { filename: req.file.filename, url: uploadUrlFor(kind, req.file.filename) }, { statusCode: 201 });
});
