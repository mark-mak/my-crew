import type { Session } from '@prisma/client';
import prisma from '../lib/prisma';

export const sessionRepository = {
  /**
   * Persist a new refresh-token session for a user.
   */
  create: (data: { userId: string; refreshToken: string; expiresAt: Date }): Promise<Session> =>
    prisma.session.create({ data }),

  /**
   * Look up an active session by its refresh token.
   */
  findByRefreshToken: (refreshToken: string): Promise<Session | null> =>
    prisma.session.findUnique({ where: { refreshToken } }),

  /**
   * Delete a session identified by its refresh token (used on logout / rotation).
   */
  deleteByRefreshToken: (refreshToken: string): Promise<Session> =>
    prisma.session.delete({ where: { refreshToken } }),

  /**
   * Revoke all sessions for a user (e.g. password change).
   */
  deleteAllForUser: (userId: string) => prisma.session.deleteMany({ where: { userId } }),
};
