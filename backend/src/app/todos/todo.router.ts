import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { todoService } from '../../services/todo.service';
import { createTodoSchema, updateTodoSchema } from './todo.schemas';
import { ValidationError } from '../../lib/errors';

export const todosRouter = Router();

// All todo routes require a valid access token
todosRouter.use(authenticate);

/** GET /api/todos */
todosRouter.get('/', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // req.user is guaranteed by authenticate middleware
    const todos = await todoService.list(req.user!.userId);
    res.json(todos);
  } catch (err) {
    next(err);
  }
});

/** POST /api/todos */
todosRouter.post('/', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = createTodoSchema.safeParse(req.body);
    if (!result.success) throw new ValidationError(result.error.issues[0].message);

    const todo = await todoService.create(req.user!.userId, result.data);
    res.status(201).json(todo);
  } catch (err) {
    next(err);
  }
});

/** PATCH /api/todos/:id */
todosRouter.patch(
  '/:id',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = updateTodoSchema.safeParse(req.body);
      if (!result.success) throw new ValidationError(result.error.issues[0].message);

      const todo = await todoService.update(req.params.id as string, req.user!.userId, result.data);
      res.json(todo);
    } catch (err) {
      next(err);
    }
  }
);

/** DELETE /api/todos/:id */
todosRouter.delete(
  '/:id',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await todoService.delete(req.params.id as string, req.user!.userId);
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  }
);
