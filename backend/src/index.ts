import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { authRouter } from './app/auth/auth.router';
import { todosRouter } from './app/todos/todo.router';
import { errorHandler } from './middleware/error.middleware';
import { env } from './lib/env';
import { logger } from './lib/logger';

const DEFAULT_PORT = 3001;
const PORT = process.env.PORT ?? DEFAULT_PORT;

const app = express();

const allowedOrigins = [
  env.FRONTEND_URL,
  'http://localhost:3000',
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // allow server-to-server / curl (no origin header)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

app.use('/api/auth', authRouter);
app.use('/api/todos', todosRouter);

// Central error handler — must be last
app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`Server running on http://localhost:${PORT}`);
});

export default app;
