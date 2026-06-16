'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { todosApi } from '../lib/api';
import type { CreateTodoInput, UpdateTodoInput } from '../lib/types';

const TODOS_KEY = ['todos'] as const;

export const useTodos = () =>
  useQuery({ queryKey: TODOS_KEY, queryFn: todosApi.list });

export const useCreateTodo = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTodoInput) => todosApi.create(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: TODOS_KEY }),
  });
};

export const useUpdateTodo = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateTodoInput }) =>
      todosApi.update(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: TODOS_KEY }),
  });
};

export const useDeleteTodo = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => todosApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: TODOS_KEY }),
  });
};
