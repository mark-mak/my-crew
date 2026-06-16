import axios from 'axios';
import { tokenStore } from './token-store';
import type {
  AuthResponse,
  RegisterInput,
  LoginInput,
  Todo,
  CreateTodoInput,
  UpdateTodoInput,
} from './types';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // send httpOnly refresh-token cookie
});

// Attach access token to every request
apiClient.interceptors.request.use((config) => {
  const token = tokenStore.get();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// On 401, attempt one silent token refresh then retry
apiClient.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (!axios.isAxiosError(error)) return Promise.reject(error);

    const status = error.response?.status;
    const config = error.config;

    // Avoid infinite retry loops
    if (status === 401 && config && !(config as unknown as Record<string, unknown>)['_retried']) {
      (config as unknown as Record<string, unknown>)['_retried'] = true;
      try {
        const { data } = await apiClient.post<AuthResponse>('/api/auth/refresh');
        tokenStore.set(data.accessToken);
        config.headers = config.headers ?? {};
        config.headers['Authorization'] = `Bearer ${data.accessToken}`;
        return apiClient(config);
      } catch {
        tokenStore.clear();
        // Redirect to login — only runs in browser
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

// ── Auth ──────────────────────────────────────────────────────────────────────

export const authApi = {
  register: async (input: RegisterInput): Promise<string> => {
    const { data } = await apiClient.post<AuthResponse>('/api/auth/register', input);
    return data.accessToken;
  },

  login: async (input: LoginInput): Promise<string> => {
    const { data } = await apiClient.post<AuthResponse>('/api/auth/login', input);
    return data.accessToken;
  },

  logout: async (): Promise<void> => {
    await apiClient.post('/api/auth/logout');
  },
};

// ── Todos ─────────────────────────────────────────────────────────────────────

export const todosApi = {
  list: async (): Promise<Todo[]> => {
    const { data } = await apiClient.get<Todo[]>('/api/todos');
    return data;
  },

  create: async (input: CreateTodoInput): Promise<Todo> => {
    const { data } = await apiClient.post<Todo>('/api/todos', input);
    return data;
  },

  update: async (id: string, input: UpdateTodoInput): Promise<Todo> => {
    const { data } = await apiClient.patch<Todo>(`/api/todos/${id}`, input);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/todos/${id}`);
  },
};
