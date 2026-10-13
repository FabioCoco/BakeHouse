import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

const UNIT_MS = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };
const DEFAULT_MAX_AGE_MS = 7 * UNIT_MS.d;

// Converts values like "7d" or "12h" into milliseconds for the cookie maxAge.
const expiresInToMs = (value) => {
  const match = /^(\d+)([smhd])$/.exec(value);
  return match ? Number(match[1]) * UNIT_MS[match[2]] : DEFAULT_MAX_AGE_MS;
};

export const signToken = (userId) =>
  jwt.sign({ id: userId }, env.jwt.secret, { expiresIn: env.jwt.expiresIn });

export const verifyToken = (token) => jwt.verify(token, env.jwt.secret);

const baseCookieOptions = () => ({
  httpOnly: true,
  secure: env.cookie.secure,
  sameSite: env.cookie.sameSite,
  path: '/',
});

export const setAuthCookie = (res, token) => {
  res.cookie(env.cookie.name, token, {
    ...baseCookieOptions(),
    maxAge: expiresInToMs(env.jwt.expiresIn),
  });
};

export const clearAuthCookie = (res) => {
  res.clearCookie(env.cookie.name, baseCookieOptions());
};
