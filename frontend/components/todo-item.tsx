'use client';

import React from 'react';
import { useUpdateTodo, useDeleteTodo } from '../hooks/use-todos';
import type { Todo } from '../lib/types';

interface TodoItemProps {
  todo: Todo;
}

export default function TodoItem({ todo }: TodoItemProps): React.JSX.Element {
  const updateTodo = useUpdateTodo();
  const deleteTodo = useDeleteTodo();

  const handleToggle = (): void => {
    updateTodo.mutate({ id: todo.id, input: { completed: !todo.completed } });
  };

  const handleDelete = (): void => {
    deleteTodo.mutate(todo.id);
  };

  return (
    <li
      data-testid={`todo-item-${todo.id}`}
      className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3"
    >
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={handleToggle}
        data-testid={`todo-item-${todo.id}-checkbox`}
        className="h-4 w-4 cursor-pointer accent-blue-600"
      />
      <span
        className={`flex-1 text-sm ${todo.completed ? 'text-gray-400 line-through' : 'text-gray-800'}`}
      >
        {todo.title}
      </span>
      {todo.dueDate && (
        <span className="text-xs text-gray-400">
          {new Date(todo.dueDate).toLocaleDateString()}
        </span>
      )}
      <button
        onClick={handleDelete}
        disabled={deleteTodo.isPending}
        data-testid={`todo-item-${todo.id}-delete-btn`}
        className="text-xs text-red-400 hover:text-red-600 disabled:opacity-50"
        aria-label="Delete todo"
      >
        Delete
      </button>
    </li>
  );
}
