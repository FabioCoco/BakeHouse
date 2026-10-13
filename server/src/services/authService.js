import bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';

const BCRYPT_ROUNDS = 12;
// Compared against when the email is unknown, so response timing does not reveal which emails exist.
const DUMMY_HASH = bcrypt.hashSync('dummy-password-for-timing', BCRYPT_ROUNDS);

let googleClient;
const getGoogleClient = () => {
  if (!env.googleClientId) {
    throw new ApiError(503, 'Google Sign-In is not configured on this server');
  }
  googleClient ??= new OAuth2Client(env.googleClientId);
  return googleClient;
};

export const registerUser = async ({ name, email, password }) => {
  const exists = await User.exists({ email });
  if (exists) {
    throw ApiError.conflict('Email is already registered');
  }

  return User.create({ name, email, password });
};

export const loginUser = async ({ email, password }) => {
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    await bcrypt.compare(password, DUMMY_HASH);
    throw ApiError.unauthorized('Invalid email or password');
  }

  const valid = await user.comparePassword(password);
  if (!valid) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  return user;
};

// Verifies a Google ID token, then finds, links, or creates the matching user.
export const loginWithGoogle = async (credential) => {
  const client = getGoogleClient();

  let payload;
  try {
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: env.googleClientId,
    });
    payload = ticket.getPayload();
  } catch {
    throw ApiError.unauthorized('Invalid Google credential');
  }

  if (!payload?.email_verified) {
    throw ApiError.unauthorized('Google account email is not verified');
  }

  const email = payload.email.toLowerCase();
  const googleId = payload.sub;

  let user = await User.findOne({ $or: [{ googleId }, { email }] });

  if (user) {
    if (user.googleId && user.googleId !== googleId) {
      throw ApiError.conflict('This email is already linked to another Google account');
    }
    if (!user.googleId) {
      user.googleId = googleId;
      user.avatar ??= payload.picture;
      await user.save();
    }
    return user;
  }

  return User.create({
    name: payload.name || email.split('@')[0],
    email,
    googleId,
    avatar: payload.picture,
  });
};
