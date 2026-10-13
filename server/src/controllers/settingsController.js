import * as analyticsService from '../services/analyticsService.js';
import * as settingsService from '../services/settingsService.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';

export const getPublicSettings = asyncHandler(async (_req, res) => {
  sendSuccess(res, await settingsService.getPublicSettings());
});

export const getAdminSettings = asyncHandler(async (_req, res) => {
  sendSuccess(res, await settingsService.getAdminSettings());
});

export const updateAdminSettings = asyncHandler(async (req, res) => {
  sendSuccess(res, await settingsService.updateSettings(req.body));
});

export const getAnalytics = asyncHandler(async (req, res) => {
  sendSuccess(res, await analyticsService.getAnalytics(req.query.range));
});
