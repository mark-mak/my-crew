'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useTodos } from '../../hooks/use-todos';
import AddTodoForm from '../../components/add-todo-form';
import TodoItem from '../../components/todo-item';
import { authApi } from '../../lib/api';
import { tokenStore } from '../../lib/token-store';

export default function TodosPage(): React.JSX.Element {
  const router = useRouter();
  const { data: todos, isLoading, isError } = useTodos();

  const handleLogout = async (): Promise<void> => {
    await authApi.logout().catch(() => undefined);
    tokenStore.clear();
    router.push('/login');
  };

  return (
    <main className="mx-auto min-h-screen max-w-lg px-4 py-10">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">My Todos</h1>
        <button
          onClick={handleLogout}
          data-testid="todos-logout-btn"
          className="text-sm text-gray-500 hover:text-gray-800"
        >
          Sign out
        </button>
      </div>

      <div className="mb-6">
        <AddTodoForm />
      </div>

      {isLoading && <p className="text-sm text-gray-400">Loading…</p>}
      {isError && (
        <p className="text-sm text-red-500">Failed to load todos. Please refresh.</p>
      )}

      {todos && todos.length === 0 && (
        <p className="text-center text-sm text-gray-400">No todos yet. Add one above!</p>
      )}

      {todos && todos.length > 0 && (
        <ul className="space-y-2">
          {todos.map((todo) => (
            <TodoItem key={todo.id} todo={todo} />
          ))}
        </ul>
      )}
    </main>
  );
}
