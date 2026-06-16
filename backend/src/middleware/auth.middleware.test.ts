import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import { authenticate } from './auth.middleware';
import { AuthError } from '../lib/errors';
import jwt from 'jsonwebtoken';

vi.mock('jsonwebtoken');
vi.mock('../lib/env', () => ({
  env: { JWT_SECRET: 'test-secret-at-least-16-chars' },
}));

const mockNext = vi.fn() as unknown as NextFunction;

const buildReq = (authHeader?: string): Partial<Request> => ({
  headers: authHeader ? { authorization: authHeader } : {},
});

describe('authenticate middleware', () => {
  beforeEach(() => vi.clearAllMocks());

  it('should attach user payload to req and call next on a valid token', () => {
    const payload = { userId: 'user-1', email: 'test@example.com' };
    vi.mocked(jwt.verify).mockReturnValue(payload as never);

    const req = buildReq('Bearer valid-token') as Request;
    authenticate(req, {} as Response, mockNext);

    expect(req.user).toEqual(payload);
    expect(mockNext).toHaveBeenCalledWith();
  });

  it('should call next with AuthError when Authorization header is missing', () => {
    const req = buildReq() as Request;
    authenticate(req, {} as Response, mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.any(AuthError));
  });

  it('should call next with AuthError when scheme is not Bearer', () => {
    const req = buildReq('Basic some-token') as Request;
    authenticate(req, {} as Response, mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.any(AuthError));
  });

  it('should call next with AuthError when token is invalid or expired', () => {
    vi.mocked(jwt.verify).mockImplementation(() => {
      throw new Error('jwt expired');
    });

    const req = buildReq('Bearer expired-token') as Request;
    authenticate(req, {} as Response, mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.any(AuthError));
  });
});
