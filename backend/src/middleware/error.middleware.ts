import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../lib/errors';
import { logger } from '../lib/logger';

/**
 * Central error handler. Must be registered last in the Express middleware chain.
 * Handles AppError, ZodError, and unexpected errors uniformly.
 */
export const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  if (err instanceof ZodError) {
    res.status(400).json({ error: 'Validation failed', details: err.issues });
    return;
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message, code: err.code });
    return;
  }

  logger.error('Unhandled error', { error: String(err) });
  res.status(500).json({ error: 'Internal server error' });
};
