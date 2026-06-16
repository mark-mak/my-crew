import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { userRepository } from '../repositories/user.repository';
import { sessionRepository } from '../repositories/session.repository';
import { AuthError, ConflictError } from '../lib/errors';
import { env } from '../lib/env';
import type { AuthTokens, JwtPayload } from '../types/auth.types';
import type { RegisterInput, LoginInput } from '../app/auth/auth.schemas';

const BCRYPT_ROUNDS = 12;
const REFRESH_TOKEN_EXPIRY_DAYS = 7;
const MS_PER_DAY = 86_400_000;

/**
 * Sign a new access + refresh token pair from the given payload.
 */
const generateTokens = (payload: JwtPayload): AuthTokens => ({
  accessToken: jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  }),
  refreshToken: jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  }),
});

const refreshTokenExpiry = (): Date =>
  new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * MS_PER_DAY);

export const authService = {
  /**
   * Register a new user; throws ConflictError if email already exists.
   */
  register: async (input: RegisterInput): Promise<AuthTokens> => {
    const existing = await userRepository.findByEmail(input.email);
    if (existing) throw new ConflictError('Email already registered');

    const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
    const user = await userRepository.create({ email: input.email, passwordHash });

    const tokens = generateTokens({ userId: user.id, email: user.email });
    await sessionRepository.create({
      userId: user.id,
      refreshToken: tokens.refreshToken,
      expiresAt: refreshTokenExpiry(),
    });

    return tokens;
  },

  /**
   * Authenticate a user; throws AuthError on invalid credentials.
   */
  login: async (input: LoginInput): Promise<AuthTokens> => {
    const user = await userRepository.findByEmail(input.email);
    // Use constant-time comparison even when user doesn't exist to prevent timing attacks
    const dummyHash = '$2a$12$aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
    const passwordHash = user?.passwordHash ?? dummyHash;
    const isValid = await bcrypt.compare(input.password, passwordHash);

    if (!user || !isValid) throw new AuthError('Invalid credentials');

    const tokens = generateTokens({ userId: user.id, email: user.email });
    await sessionRepository.create({
      userId: user.id,
      refreshToken: tokens.refreshToken,
      expiresAt: refreshTokenExpiry(),
    });

    return tokens;
  },

  /**
   * Rotate a refresh token; throws AuthError if the token is invalid or expired.
   */
  refresh: async (refreshToken: string): Promise<AuthTokens> => {
    const session = await sessionRepository.findByRefreshToken(refreshToken);
    if (!session) throw new AuthError('Invalid refresh token');
    if (session.expiresAt < new Date()) throw new AuthError('Refresh token expired');

    let payload: JwtPayload;
    try {
      payload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as JwtPayload;
    } catch {
      throw new AuthError('Invalid refresh token');
    }

    // Rotate: invalidate the old token before issuing a new one
    await sessionRepository.deleteByRefreshToken(refreshToken);
    const newTokens = generateTokens({ userId: payload.userId, email: payload.email });
    await sessionRepository.create({
      userId: payload.userId,
      refreshToken: newTokens.refreshToken,
      expiresAt: refreshTokenExpiry(),
    });

    return newTokens;
  },

  /**
   * Invalidate a refresh token session (logout). Silently succeeds if already gone.
   */
  logout: async (refreshToken: string): Promise<void> => {
    await sessionRepository.deleteByRefreshToken(refreshToken).catch(() => undefined);
  },
};
