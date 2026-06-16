'use client';

import React, { useState, type FormEvent } from 'react';
import { useCreateTodo } from '../hooks/use-todos';

export default function AddTodoForm(): React.JSX.Element {
  const [title, setTitle] = useState('');
  const createTodo = useCreateTodo();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    await createTodo.mutateAsync({ title: trimmed });
    setTitle('');
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        placeholder="Add a new todo…"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        data-testid="add-todo-input"
        className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
      />
      <button
        type="submit"
        disabled={createTodo.isPending || !title.trim()}
        data-testid="add-todo-submit-btn"
        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        Add
      </button>
    </form>
  );
}
