import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AddTodoForm from '../components/add-todo-form';

// Mock the React Query hook so the component renders without a QueryClient
const mockMutateAsync = vi.fn();
vi.mock('../hooks/use-todos', () => ({
  useCreateTodo: () => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
  }),
}));

describe('AddTodoForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMutateAsync.mockResolvedValue({});
  });

  it('renders the input and submit button', () => {
    render(<AddTodoForm />);
    expect(screen.getByTestId('add-todo-input')).toBeInTheDocument();
    expect(screen.getByTestId('add-todo-submit-btn')).toBeInTheDocument();
  });

  it('submit button is disabled when input is empty', () => {
    render(<AddTodoForm />);
    expect(screen.getByTestId('add-todo-submit-btn')).toBeDisabled();
  });

  it('submit button is enabled after typing', async () => {
    const user = userEvent.setup();
    render(<AddTodoForm />);
    await user.type(screen.getByTestId('add-todo-input'), 'Buy milk');
    expect(screen.getByTestId('add-todo-submit-btn')).toBeEnabled();
  });

  it('calls mutateAsync with trimmed title on submit', async () => {
    const user = userEvent.setup();
    render(<AddTodoForm />);
    await user.type(screen.getByTestId('add-todo-input'), '  Buy milk  ');
    await user.click(screen.getByTestId('add-todo-submit-btn'));
    expect(mockMutateAsync).toHaveBeenCalledOnce();
    expect(mockMutateAsync).toHaveBeenCalledWith({ title: 'Buy milk' });
  });

  it('clears the input after successful submit', async () => {
    const user = userEvent.setup();
    render(<AddTodoForm />);
    const input = screen.getByTestId('add-todo-input');
    await user.type(input, 'Buy milk');
    await user.click(screen.getByTestId('add-todo-submit-btn'));
    expect(input).toHaveValue('');
  });

  it('does not call mutateAsync when input is only whitespace', async () => {
    const user = userEvent.setup();
    render(<AddTodoForm />);
    await user.type(screen.getByTestId('add-todo-input'), '   ');
    await user.keyboard('{Enter}');
    expect(mockMutateAsync).not.toHaveBeenCalled();
  });
});
