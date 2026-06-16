import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RegisterPage from './page';

const { mockPush, mockRegister, mockTokenStore } = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockRegister: vi.fn(),
  mockTokenStore: { set: vi.fn(), get: vi.fn(), clear: vi.fn() },
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));
vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));
vi.mock('../../lib/api', () => ({
  authApi: { register: mockRegister },
}));
vi.mock('../../lib/token-store', () => ({
  tokenStore: mockTokenStore,
}));

describe('RegisterPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders email and password inputs with submit button', () => {
    render(<RegisterPage />);
    expect(screen.getByTestId('register-form-email-input')).toBeInTheDocument();
    expect(screen.getByTestId('register-form-password-input')).toBeInTheDocument();
    expect(screen.getByTestId('register-form-submit-btn')).toBeInTheDocument();
  });

  it('renders a link back to the login page', () => {
    render(<RegisterPage />);
    expect(screen.getByRole('link', { name: /sign in/i })).toHaveAttribute('href', '/login');
  });

  it('calls authApi.register with form values and redirects on success', async () => {
    mockRegister.mockResolvedValue('new-access-token');
    const user = userEvent.setup();
    render(<RegisterPage />);

    await user.type(screen.getByTestId('register-form-email-input'), 'new@example.com');
    await user.type(screen.getByTestId('register-form-password-input'), 'securepass');
    await user.click(screen.getByTestId('register-form-submit-btn'));

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith({
        email: 'new@example.com',
        password: 'securepass',
      });
      expect(mockTokenStore.set).toHaveBeenCalledWith('new-access-token');
      expect(mockPush).toHaveBeenCalledWith('/todos');
    });
  });

  it('shows an error message when registration fails', async () => {
    mockRegister.mockRejectedValue(new Error('Conflict'));
    const user = userEvent.setup();
    render(<RegisterPage />);

    await user.type(screen.getByTestId('register-form-email-input'), 'existing@example.com');
    await user.type(screen.getByTestId('register-form-password-input'), 'anypassword');
    await user.click(screen.getByTestId('register-form-submit-btn'));

    await waitFor(() => {
      expect(screen.getByText(/registration failed/i)).toBeInTheDocument();
    });
    expect(mockPush).not.toHaveBeenCalled();
  });
});
