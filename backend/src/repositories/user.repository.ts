import type { User } from '@prisma/client';
import prisma from '../lib/prisma';

export const userRepository = {
  /**
   * Find a user by their email address.
   */
  findByEmail: (email: string): Promise<User | null> =>
    prisma.user.findUnique({ where: { email } }),

  /**
   * Find a user by their ID.
   */
  findById: (id: string): Promise<User | null> => prisma.user.findUnique({ where: { id } }),

  /**
   * Create a new user with a hashed password.
   */
  create: (data: { email: string; passwordHash: string }): Promise<User> =>
    prisma.user.create({ data }),
};
