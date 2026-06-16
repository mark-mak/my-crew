import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TodosPage from './page';
import type { Todo } from '../../lib/types';

const { mockPush, mockUseTodos, mockLogout, mockTokenStore } = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockUseTodos: vi.fn(),
  mockLogout: vi.fn(),
  mockTokenStore: { set: vi.fn(), get: vi.fn(), clear: vi.fn() },
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));
vi.mock('../../components/add-todo-form', () => ({
  default: () => <div data-testid="add-todo-form-stub" />,
}));
vi.mock('../../components/todo-item', () => ({
  default: ({ todo }: { todo: Todo }) => (
    <li data-testid={`todo-item-${todo.id}`}>{todo.title}</li>
  ),
}));
vi.mock('../../hooks/use-todos', () => ({
  useTodos: () => mockUseTodos(),
}));
vi.mock('../../lib/api', () => ({
  authApi: { logout: mockLogout },
}));
vi.mock('../../lib/token-store', () => ({
  tokenStore: mockTokenStore,
}));

const makeTodo = (id: string, title: string, completed = false): Todo => ({
  id,
  userId: 'user-1',
  title,
  description: null,
  completed,
  dueDate: null,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
});

describe('TodosPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLogout.mockResolvedValue(undefined);
  });

  it('shows loading indicator while fetching', () => {
    mockUseTodos.mockReturnValue({ data: undefined, isLoading: true, isError: false });
    render(<TodosPage />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('shows error message on fetch failure', () => {
    mockUseTodos.mockReturnValue({ data: undefined, isLoading: false, isError: true });
    render(<TodosPage />);
    expect(screen.getByText(/failed to load todos/i)).toBeInTheDocument();
  });

  it('shows empty-state message when there are no todos', () => {
    mockUseTodos.mockReturnValue({ data: [], isLoading: false, isError: false });
    render(<TodosPage />);
    expect(screen.getByText(/no todos yet/i)).toBeInTheDocument();
  });

  it('renders a TodoItem for each todo', () => {
    const todos = [makeTodo('1', 'First'), makeTodo('2', 'Second')];
    mockUseTodos.mockReturnValue({ data: todos, isLoading: false, isError: false });
    render(<TodosPage />);
    expect(screen.getByTestId('todo-item-1')).toBeInTheDocument();
    expect(screen.getByTestId('todo-item-2')).toBeInTheDocument();
  });

  it('renders the AddTodoForm', () => {
    mockUseTodos.mockReturnValue({ data: [], isLoading: false, isError: false });
    render(<TodosPage />);
    expect(screen.getByTestId('add-todo-form-stub')).toBeInTheDocument();
  });

  it('calls logout, clears token, and redirects to /login on sign-out click', async () => {
    mockUseTodos.mockReturnValue({ data: [], isLoading: false, isError: false });
    const user = userEvent.setup();
    render(<TodosPage />);

    await user.click(screen.getByTestId('todos-logout-btn'));

    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalled();
      expect(mockTokenStore.clear).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith('/login');
    });
  });
});
