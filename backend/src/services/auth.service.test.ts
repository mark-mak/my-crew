import { describe, it, expect, vi, beforeEach } from 'vitest';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { authService } from './auth.service';
import { userRepository } from '../repositories/user.repository';
import { sessionRepository } from '../repositories/session.repository';
import { AuthError, ConflictError } from '../lib/errors';

// Mock all external dependencies
vi.mock('../repositories/user.repository');
vi.mock('../repositories/session.repository');
vi.mock('bcryptjs');
vi.mock('jsonwebtoken');
vi.mock('../lib/env', () => ({
  env: {
    JWT_SECRET: 'test-secret-at-least-16-chars',
    JWT_REFRESH_SECRET: 'test-refresh-secret-at-least-16',
    JWT_EXPIRES_IN: '15m',
    JWT_REFRESH_EXPIRES_IN: '7d',
    NODE_ENV: 'test',
  },
}));

const mockUser = { id: 'user-1', email: 'test@example.com', passwordHash: 'hash', createdAt: new Date() };
const mockSession = {
  id: 'session-1',
  userId: 'user-1',
  refreshToken: 'refresh-token',
  expiresAt: new Date(Date.now() + 86_400_000),
  createdAt: new Date(),
};

describe('authService.register', () => {
  beforeEach(() => vi.clearAllMocks());

  it('should register a new user and return tokens', async () => {
    vi.mocked(userRepository.findByEmail).mockResolvedValue(null);
    vi.mocked(userRepository.create).mockResolvedValue(mockUser);
    vi.mocked(bcrypt.hash).mockResolvedValue('hashed-password' as never);
    vi.mocked(jwt.sign).mockReturnValue('mock-token' as never);
    vi.mocked(sessionRepository.create).mockResolvedValue(mockSession);

    const result = await authService.register({ email: 'test@example.com', password: 'password123' });

    expect(result).toEqual({ accessToken: 'mock-token', refreshToken: 'mock-token' });
    expect(userRepository.create).toHaveBeenCalledWith({
      email: 'test@example.com',
      passwordHash: 'hashed-password',
    });
  });

  it('should throw ConflictError when email already exists', async () => {
    vi.mocked(userRepository.findByEmail).mockResolvedValue(mockUser);

    await expect(
      authService.register({ email: 'test@example.com', password: 'password123' })
    ).rejects.toThrow(ConflictError);
  });
});

describe('authService.login', () => {
  beforeEach(() => vi.clearAllMocks());

  it('should return tokens for valid credentials', async () => {
    vi.mocked(userRepository.findByEmail).mockResolvedValue(mockUser);
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never);
    vi.mocked(jwt.sign).mockReturnValue('mock-token' as never);
    vi.mocked(sessionRepository.create).mockResolvedValue(mockSession);

    const result = await authService.login({ email: 'test@example.com', password: 'password123' });

    expect(result.accessToken).toBe('mock-token');
  });

  it('should throw AuthError for wrong password', async () => {
    vi.mocked(userRepository.findByEmail).mockResolvedValue(mockUser);
    vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

    await expect(
      authService.login({ email: 'test@example.com', password: 'wrong' })
    ).rejects.toThrow(AuthError);
  });

  it('should throw AuthError when user does not exist', async () => {
    vi.mocked(userRepository.findByEmail).mockResolvedValue(null);
    vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

    await expect(
      authService.login({ email: 'nobody@example.com', password: 'password123' })
    ).rejects.toThrow(AuthError);
  });
});

describe('authService.refresh', () => {
  beforeEach(() => vi.clearAllMocks());

  it('should rotate the refresh token and return new tokens', async () => {
    vi.mocked(sessionRepository.findByRefreshToken).mockResolvedValue(mockSession);
    vi.mocked(sessionRepository.deleteByRefreshToken).mockResolvedValue(mockSession);
    vi.mocked(sessionRepository.create).mockResolvedValue(mockSession);
    vi.mocked(jwt.verify).mockReturnValue({ userId: 'user-1', email: 'test@example.com' } as never);
    vi.mocked(jwt.sign).mockReturnValue('new-token' as never);

    const result = await authService.refresh('refresh-token');

    expect(result.accessToken).toBe('new-token');
    expect(sessionRepository.deleteByRefreshToken).toHaveBeenCalledWith('refresh-token');
  });

  it('should throw AuthError when refresh token is not found in DB', async () => {
    vi.mocked(sessionRepository.findByRefreshToken).mockResolvedValue(null);

    await expect(authService.refresh('invalid-token')).rejects.toThrow(AuthError);
  });

  it('should throw AuthError when refresh token is expired in DB', async () => {
    vi.mocked(sessionRepository.findByRefreshToken).mockResolvedValue({
      ...mockSession,
      expiresAt: new Date(Date.now() - 1_000),
    });

    await expect(authService.refresh('expired-token')).rejects.toThrow(AuthError);
  });
});

describe('authService.logout', () => {
  beforeEach(() => vi.clearAllMocks());

  it('should delete the session for the given refresh token', async () => {
    vi.mocked(sessionRepository.deleteByRefreshToken).mockResolvedValue(mockSession);

    await authService.logout('refresh-token');

    expect(sessionRepository.deleteByRefreshToken).toHaveBeenCalledWith('refresh-token');
  });

  it('should resolve silently even if the token does not exist', async () => {
    vi.mocked(sessionRepository.deleteByRefreshToken).mockRejectedValue(new Error('not found'));

    await expect(authService.logout('ghost-token')).resolves.toBeUndefined();
  });
});
