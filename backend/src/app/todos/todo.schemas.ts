import { z } from 'zod';

export const createTodoSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  dueDate: z.string().datetime({ message: 'Invalid date format' }).optional(),
});

export const updateTodoSchema = z
  .object({
    title: z.string().min(1, 'Title is required').max(255, 'Title too long').optional(),
    description: z.string().max(1000, 'Description too long').nullable().optional(),
    completed: z.boolean().optional(),
    dueDate: z.string().datetime({ message: 'Invalid date format' }).nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  });

export type CreateTodoInput = z.infer<typeof createTodoSchema>;
export type UpdateTodoInput = z.infer<typeof updateTodoSchema>;
