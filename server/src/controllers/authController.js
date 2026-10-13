import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';
import { clearAuthCookie, setAuthCookie, signToken } from '../utils/token.js';
import * as authService from '../services/authService.js';

const issueSession = (res, user, statusCode = 200) => {
  setAuthCookie(res, signToken(user._id));
  return sendSuccess(res, user, { statusCode });
};

export const register = asyncHandler(async (req, res) => {
  const user = await authService.registerUser(req.body);
  issueSession(res, user, 201);
});

export const login = asyncHandler(async (req, res) => {
  const user = await authService.loginUser(req.body);
  issueSession(res, user);
});

export const googleLogin = asyncHandler(async (req, res) => {
  const user = await authService.loginWithGoogle(req.body.credential);
  issueSession(res, user);
});

export const logout = (_req, res) => {
  clearAuthCookie(res);
  sendSuccess(res, { message: 'Logged out' });
};

export const me = (req, res) => sendSuccess(res, req.user);
