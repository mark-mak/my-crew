import type { Todo } from '@prisma/client';
import prisma from '../lib/prisma';

export interface CreateTodoData {
  userId: string;
  title: string;
  description?: string;
  dueDate?: Date;
}

export interface UpdateTodoData {
  title?: string;
  description?: string;
  completed?: boolean;
  dueDate?: Date | null;
}

export const todoRepository = {
  /**
   * Find all todos belonging to the given user, ordered newest first.
   */
  findAllByUserId: (userId: string): Promise<Todo[]> =>
    prisma.todo.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    }),

  /**
   * Find a single todo by ID — does NOT enforce ownership (caller must check).
   */
  findById: (id: string): Promise<Todo | null> =>
    prisma.todo.findUnique({ where: { id } }),

  /**
   * Create a new todo for the given user.
   */
  create: (data: CreateTodoData): Promise<Todo> =>
    prisma.todo.create({ data }),

  /**
   * Update a todo by ID. Ownership must be verified before calling.
   */
  update: (id: string, data: UpdateTodoData): Promise<Todo> =>
    prisma.todo.update({ where: { id }, data }),

  /**
   * Delete a todo by ID. Ownership must be verified before calling.
   */
  delete: (id: string): Promise<Todo> =>
    prisma.todo.delete({ where: { id } }),
};
