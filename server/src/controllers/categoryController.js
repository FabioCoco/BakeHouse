import * as categoryService from '../services/categoryService.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';

export const listCategories = asyncHandler(async (_req, res) => {
  sendSuccess(res, await categoryService.listCategories());
});

export const createCategory = asyncHandler(async (req, res) => {
  const category = await categoryService.createCategory(req.body);
  sendSuccess(res, category, { statusCode: 201 });
});

export const updateCategory = asyncHandler(async (req, res) => {
  sendSuccess(res, await categoryService.updateCategory(req.params.id, req.body));
});

export const deleteCategory = asyncHandler(async (req, res) => {
  await categoryService.deleteCategory(req.params.id);
  sendSuccess(res, { message: 'Category deleted' });
});
