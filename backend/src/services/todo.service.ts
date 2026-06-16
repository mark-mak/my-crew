import type { Todo } from '@prisma/client';
import { todoRepository } from '../repositories/todo.repository';
import { ForbiddenError, NotFoundError } from '../lib/errors';
import type { CreateTodoInput, UpdateTodoInput } from '../app/todos/todo.schemas';

/**
 * Assert that a todo exists and belongs to the requesting user.
 * Throws NotFoundError or ForbiddenError — never leaks whether the resource exists to other users.
 */
const assertOwnership = async (todoId: string, userId: string): Promise<Todo> => {
  const todo = await todoRepository.findById(todoId);
  if (!todo) throw new NotFoundError('Todo not found');
  // Return 403 (not 404) so ownership isn't revealed via different error codes
  if (todo.userId !== userId) throw new ForbiddenError();
  return todo;
};

export const todoService = {
  /**
   * List all todos for the authenticated user.
   */
  list: (userId: string): Promise<Todo[]> => todoRepository.findAllByUserId(userId),

  /**
   * Create a new todo owned by the authenticated user.
   */
  create: (userId: string, input: CreateTodoInput): Promise<Todo> =>
    todoRepository.create({
      userId,
      title: input.title,
      description: input.description,
      dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
    }),

  /**
   * Update a todo — enforces ownership before mutating.
   */
  update: async (todoId: string, userId: string, input: UpdateTodoInput): Promise<Todo> => {
    await assertOwnership(todoId, userId);
    return todoRepository.update(todoId, {
      title: input.title,
      description: input.description ?? undefined,
      completed: input.completed,
      dueDate:
        input.dueDate === null ? null : input.dueDate ? new Date(input.dueDate) : undefined,
    });
  },

  /**
   * Delete a todo — enforces ownership before deleting.
   */
  delete: async (todoId: string, userId: string): Promise<void> => {
    await assertOwnership(todoId, userId);
    await todoRepository.delete(todoId);
  },
};
