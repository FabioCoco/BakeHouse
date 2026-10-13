import * as productService from '../services/productService.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';

export const listProducts = asyncHandler(async (req, res) => {
  const { products, meta } = await productService.listProducts(req.query);
  sendSuccess(res, products, { meta });
});

export const getProduct = asyncHandler(async (req, res) => {
  sendSuccess(res, await productService.getActiveProductBySlug(req.params.slug));
});

export const createProduct = asyncHandler(async (req, res) => {
  const product = await productService.createProduct(req.body);
  sendSuccess(res, product, { statusCode: 201 });
});

export const updateProduct = asyncHandler(async (req, res) => {
  sendSuccess(res, await productService.updateProduct(req.params.id, req.body));
});

export const updateStock = asyncHandler(async (req, res) => {
  const { stock, adjustment } = req.body;
  sendSuccess(res, await productService.adjustStock(req.params.id, { stock, adjustment }));
});

export const deleteProduct = asyncHandler(async (req, res) => {
  await productService.deactivateProduct(req.params.id);
  sendSuccess(res, { message: 'Product deactivated' });
});
