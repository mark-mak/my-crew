import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TodoItem from '../components/todo-item';
import type { Todo } from '../lib/types';

const mockMutate = vi.fn();
vi.mock('../hooks/use-todos', () => ({
  useUpdateTodo: () => ({ mutate: mockMutate, isPending: false }),
  useDeleteTodo: () => ({ mutate: mockMutate, isPending: false }),
}));

const baseTodo: Todo = {
  id: 'todo-1',
  userId: 'user-1',
  title: 'Buy groceries',
  description: null,
  completed: false,
  dueDate: null,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

describe('TodoItem', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the todo title', () => {
    render(<TodoItem todo={baseTodo} />);
    expect(screen.getByText('Buy groceries')).toBeInTheDocument();
  });

  it('renders an unchecked checkbox for an incomplete todo', () => {
    render(<TodoItem todo={baseTodo} />);
    const checkbox = screen.getByTestId('todo-item-todo-1-checkbox');
    expect(checkbox).not.toBeChecked();
  });

  it('renders a checked checkbox for a completed todo', () => {
    render(<TodoItem todo={{ ...baseTodo, completed: true }} />);
    const checkbox = screen.getByTestId('todo-item-todo-1-checkbox');
    expect(checkbox).toBeChecked();
  });

  it('calls updateTodo.mutate with toggled completed on checkbox click', async () => {
    const user = userEvent.setup();
    render(<TodoItem todo={baseTodo} />);
    await user.click(screen.getByTestId('todo-item-todo-1-checkbox'));
    expect(mockMutate).toHaveBeenCalledWith({
      id: 'todo-1',
      input: { completed: true },
    });
  });

  it('calls deleteTodo.mutate with todo id on delete click', async () => {
    const user = userEvent.setup();
    render(<TodoItem todo={baseTodo} />);
    await user.click(screen.getByTestId('todo-item-todo-1-delete-btn'));
    expect(mockMutate).toHaveBeenCalledWith('todo-1');
  });

  it('renders the due date when present', () => {
    render(<TodoItem todo={{ ...baseTodo, dueDate: '2024-12-31T00:00:00.000Z' }} />);
    // Presence of a date-like string in the document
    expect(screen.getByText(/2024|12|31/)).toBeInTheDocument();
  });

  it('does not render a due date element when dueDate is null', () => {
    const { container } = render(<TodoItem todo={baseTodo} />);
    // The optional <span> for dueDate should not be present
    const spans = container.querySelectorAll('span.text-xs');
    expect(spans.length).toBe(0);
  });
});
