import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import LoginPage from '../pages/LoginPage';

const mockLogin = jest.fn();
const mockNavigate = jest.fn();

jest.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    login: mockLogin,
    isAuthenticated: false,
    loading: false,
  }),
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const renderLoginPage = () => {
  return render(
    <BrowserRouter>
      <LoginPage />
    </BrowserRouter>
  );
};

describe('LoginPage Component', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders login form with all inputs, labels, and action buttons', () => {
    renderLoginPage();

    expect(screen.getByRole('heading', { name: /notes app/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/your email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/••••••••/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /show/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /register here/i })).toBeInTheDocument();
  });

  test('toggles password visibility when Show/Hide button is clicked', async () => {
    renderLoginPage();

    const passwordInput = screen.getByPlaceholderText(/••••••••/i);
    const toggleBtn = screen.getByRole('button', { name: /show/i });

    expect(passwordInput).toHaveAttribute('type', 'password');

    await userEvent.click(toggleBtn);
    expect(passwordInput).toHaveAttribute('type', 'text');
    expect(toggleBtn).toHaveTextContent(/hide/i);

    await userEvent.click(toggleBtn);
    expect(passwordInput).toHaveAttribute('type', 'password');
    expect(toggleBtn).toHaveTextContent(/show/i);
  });

  test('shows validation errors when submitting invalid email and empty fields', async () => {
    renderLoginPage();

    const submitBtn = screen.getByRole('button', { name: /sign in/i });
    const emailInput = screen.getByPlaceholderText(/your email/i);

    await userEvent.type(emailInput, 'invalid-email');
    await userEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
      expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    });

    expect(mockLogin).not.toHaveBeenCalled();
  });

  test('submits form with valid data, calls login, and navigates to dashboard', async () => {
    mockLogin.mockResolvedValueOnce({ success: true });
    renderLoginPage();

    const emailInput = screen.getByPlaceholderText(/your email/i);
    const passwordInput = screen.getByPlaceholderText(/••••••••/i);
    const submitBtn = screen.getByRole('button', { name: /sign in/i });

    await userEvent.type(emailInput, 'user@example.com');
    await userEvent.type(passwordInput, 'Password123!');
    await userEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: 'user@example.com',
        password: 'Password123!',
      });
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  test('displays server error message when login fails', async () => {
    mockLogin.mockRejectedValueOnce({ message: 'Invalid credentials provided' });
    renderLoginPage();

    const emailInput = screen.getByPlaceholderText(/your email/i);
    const passwordInput = screen.getByPlaceholderText(/••••••••/i);
    const submitBtn = screen.getByRole('button', { name: /sign in/i });

    await userEvent.type(emailInput, 'user@example.com');
    await userEvent.type(passwordInput, 'WrongPassword');
    await userEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials provided')).toBeInTheDocument();
    });

    expect(mockNavigate).not.toHaveBeenCalledWith('/dashboard');
  });
});
