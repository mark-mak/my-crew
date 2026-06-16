import { describe, it, expect, vi, beforeEach } from 'vitest';
import { todoService } from './todo.service';
import { todoRepository } from '../repositories/todo.repository';
import { ForbiddenError, NotFoundError } from '../lib/errors';
import type { Todo } from '@prisma/client';

vi.mock('../repositories/todo.repository');

const userId = 'user-1';
const otherUserId = 'user-2';
const todoId = 'todo-1';

const mockTodo: Todo = {
  id: todoId,
  userId,
  title: 'Test todo',
  description: null,
  completed: false,
  dueDate: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('todoService.list', () => {
  beforeEach(() => vi.clearAllMocks());

  it('should return all todos for the given user', async () => {
    vi.mocked(todoRepository.findAllByUserId).mockResolvedValue([mockTodo]);

    const result = await todoService.list(userId);

    expect(result).toEqual([mockTodo]);
    expect(todoRepository.findAllByUserId).toHaveBeenCalledWith(userId);
  });
});

describe('todoService.create', () => {
  beforeEach(() => vi.clearAllMocks());

  it('should create a todo owned by the user', async () => {
    vi.mocked(todoRepository.create).mockResolvedValue(mockTodo);

    const result = await todoService.create(userId, { title: 'Test todo' });

    expect(result).toEqual(mockTodo);
    expect(todoRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ userId, title: 'Test todo' })
    );
  });
});

describe('todoService.update', () => {
  beforeEach(() => vi.clearAllMocks());

  it('should update a todo the user owns', async () => {
    vi.mocked(todoRepository.findById).mockResolvedValue(mockTodo);
    vi.mocked(todoRepository.update).mockResolvedValue({ ...mockTodo, completed: true });

    const result = await todoService.update(todoId, userId, { completed: true });

    expect(result.completed).toBe(true);
    expect(todoRepository.update).toHaveBeenCalledWith(todoId, expect.objectContaining({ completed: true }));
  });

  it('should throw NotFoundError when the todo does not exist', async () => {
    vi.mocked(todoRepository.findById).mockResolvedValue(null);

    await expect(todoService.update(todoId, userId, { completed: true })).rejects.toThrow(NotFoundError);
  });

  it('should throw ForbiddenError when the todo belongs to another user', async () => {
    vi.mocked(todoRepository.findById).mockResolvedValue(mockTodo);

    await expect(todoService.update(todoId, otherUserId, { completed: true })).rejects.toThrow(ForbiddenError);
  });
});

describe('todoService.delete', () => {
  beforeEach(() => vi.clearAllMocks());

  it('should delete a todo the user owns', async () => {
    vi.mocked(todoRepository.findById).mockResolvedValue(mockTodo);
    vi.mocked(todoRepository.delete).mockResolvedValue(mockTodo);

    await todoService.delete(todoId, userId);

    expect(todoRepository.delete).toHaveBeenCalledWith(todoId);
  });

  it('should throw NotFoundError when the todo does not exist', async () => {
    vi.mocked(todoRepository.findById).mockResolvedValue(null);

    await expect(todoService.delete(todoId, userId)).rejects.toThrow(NotFoundError);
  });

  it('should throw ForbiddenError when the todo belongs to another user', async () => {
    vi.mocked(todoRepository.findById).mockResolvedValue(mockTodo);

    await expect(todoService.delete(todoId, otherUserId)).rejects.toThrow(ForbiddenError);
  });
});
