import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { authService } from '../../services/auth.service';
import { registerSchema, loginSchema } from './auth.schemas';
import { AuthError, ValidationError } from '../../lib/errors';

const RATE_LIMIT_WINDOW_MS = 60 * 1_000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 5;
const REFRESH_TOKEN_COOKIE = 'refreshToken';
const REFRESH_COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1_000; // 7 days

const authLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: RATE_LIMIT_MAX_REQUESTS,
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const setRefreshCookie = (res: Response, token: string): void => {
  res.cookie(REFRESH_TOKEN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: REFRESH_COOKIE_MAX_AGE_MS,
    path: '/api/auth',
  });
};

export const authRouter = Router();

/** POST /api/auth/register */
authRouter.post(
  '/register',
  authLimiter,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = registerSchema.safeParse(req.body);
      if (!result.success) throw new ValidationError(result.error.issues[0].message);

      const { accessToken, refreshToken } = await authService.register(result.data);
      setRefreshCookie(res, refreshToken);
      res.status(201).json({ accessToken });
    } catch (err) {
      next(err);
    }
  }
);

/** POST /api/auth/login */
authRouter.post(
  '/login',
  authLimiter,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = loginSchema.safeParse(req.body);
      if (!result.success) throw new ValidationError(result.error.issues[0].message);

      const { accessToken, refreshToken } = await authService.login(result.data);
      setRefreshCookie(res, refreshToken);
      res.json({ accessToken });
    } catch (err) {
      next(err);
    }
  }
);

/** POST /api/auth/refresh */
authRouter.post(
  '/refresh',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const refreshToken = req.cookies[REFRESH_TOKEN_COOKIE] as string | undefined;
      if (!refreshToken) throw new AuthError('No refresh token provided');

      const { accessToken, refreshToken: newRefreshToken } =
        await authService.refresh(refreshToken);
      setRefreshCookie(res, newRefreshToken);
      res.json({ accessToken });
    } catch (err) {
      next(err);
    }
  }
);

/** POST /api/auth/logout */
authRouter.post(
  '/logout',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const refreshToken = req.cookies[REFRESH_TOKEN_COOKIE] as string | undefined;
      if (refreshToken) await authService.logout(refreshToken);

      res.clearCookie(REFRESH_TOKEN_COOKIE, { path: '/api/auth' });
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  }
);
