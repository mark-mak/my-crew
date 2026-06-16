import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginPage from './page';

const { mockPush, mockLogin, mockTokenStore } = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockLogin: vi.fn(),
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
  authApi: { login: mockLogin },
}));
vi.mock('../../lib/token-store', () => ({
  tokenStore: mockTokenStore,
}));

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders email and password inputs with submit button', () => {
    render(<LoginPage />);
    expect(screen.getByTestId('login-form-email-input')).toBeInTheDocument();
    expect(screen.getByTestId('login-form-password-input')).toBeInTheDocument();
    expect(screen.getByTestId('login-form-submit-btn')).toBeInTheDocument();
  });

  it('renders a link to the register page', () => {
    render(<LoginPage />);
    expect(screen.getByRole('link', { name: /register/i })).toHaveAttribute('href', '/register');
  });

  it('calls authApi.login with form values and redirects on success', async () => {
    mockLogin.mockResolvedValue('test-access-token');
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.type(screen.getByTestId('login-form-email-input'), 'user@example.com');
    await user.type(screen.getByTestId('login-form-password-input'), 'password123');
    await user.click(screen.getByTestId('login-form-submit-btn'));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: 'user@example.com',
        password: 'password123',
      });
      expect(mockTokenStore.set).toHaveBeenCalledWith('test-access-token');
      expect(mockPush).toHaveBeenCalledWith('/todos');
    });
  });

  it('shows an error message when login fails', async () => {
    mockLogin.mockRejectedValue(new Error('Unauthorized'));
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.type(screen.getByTestId('login-form-email-input'), 'bad@example.com');
    await user.type(screen.getByTestId('login-form-password-input'), 'wrongpass');
    await user.click(screen.getByTestId('login-form-submit-btn'));

    await waitFor(() => {
      expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument();
    });
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('disables the submit button while loading', async () => {
    mockLogin.mockImplementation(() => new Promise(() => undefined)); // never resolves
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.type(screen.getByTestId('login-form-email-input'), 'user@example.com');
    await user.type(screen.getByTestId('login-form-password-input'), 'password123');
    await user.click(screen.getByTestId('login-form-submit-btn'));

    expect(screen.getByTestId('login-form-submit-btn')).toBeDisabled();
  });
});
