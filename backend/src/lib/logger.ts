type LogLevel = 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  [key: string]: unknown;
}

const log = (level: LogLevel, message: string, meta?: Record<string, unknown>): void => {
  const entry: LogEntry = { level, message, timestamp: new Date().toISOString(), ...meta };
  const output = JSON.stringify(entry) + '\n';
  // Use process streams to avoid no-console ESLint rule
  if (level === 'error') {
    process.stderr.write(output);
  } else {
    process.stdout.write(output);
  }
};

export const logger = {
  info: (message: string, meta?: Record<string, unknown>): void => log('info', message, meta),
  warn: (message: string, meta?: Record<string, unknown>): void => log('warn', message, meta),
  error: (message: string, meta?: Record<string, unknown>): void => log('error', message, meta),
};
