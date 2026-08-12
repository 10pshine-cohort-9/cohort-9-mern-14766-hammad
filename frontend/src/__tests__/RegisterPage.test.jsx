import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import RegisterPage from '../pages/RegisterPage';

const mockRegister = jest.fn();
const mockNavigate = jest.fn();

jest.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    register: mockRegister,
    isAuthenticated: false,
    loading: false,
  }),
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const renderRegisterPage = () => {
  return render(
    <BrowserRouter>
      <RegisterPage />
    </BrowserRouter>
  );
};

describe('RegisterPage Component', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders registration form inputs and controls', () => {
    renderRegisterPage();

    expect(screen.getByRole('heading', { name: /notes app/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/your name/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/your email/i)).toBeInTheDocument();
    expect(screen.getAllByPlaceholderText(/••••••••/i).length).toBe(2);
    expect(screen.getByLabelText(/i agree to the terms/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
  });

  test('shows validation errors when fields are empty or invalid', async () => {
    renderRegisterPage();

    const submitBtn = screen.getByRole('button', { name: /create account/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/name is required/i)).toBeInTheDocument();
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      expect(screen.getByText(/password is required/i)).toBeInTheDocument();
      expect(screen.getByText(/you must agree to the terms/i)).toBeInTheDocument();
    });

    expect(mockRegister).not.toHaveBeenCalled();
  });

  test('shows error when passwords do not match', async () => {
    renderRegisterPage();

    const nameInput = screen.getByPlaceholderText(/your name/i);
    const emailInput = screen.getByPlaceholderText(/your email/i);
    const passwordInputs = screen.getAllByPlaceholderText(/••••••••/i);
    const termsCheckbox = screen.getByLabelText(/i agree to the terms/i);
    const submitBtn = screen.getByRole('button', { name: /create account/i });

    fireEvent.change(nameInput, { target: { value: 'John Doe' } });
    fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
    fireEvent.change(passwordInputs[0], { target: { value: 'Password123!' } });
    fireEvent.change(passwordInputs[1], { target: { value: 'DifferentPass123!' } });
    fireEvent.click(termsCheckbox);

    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
    });

    expect(mockRegister).not.toHaveBeenCalled();
  });

  test('submits valid registration form and navigates to /dashboard', async () => {
    mockRegister.mockResolvedValueOnce({ success: true });
    renderRegisterPage();

    const nameInput = screen.getByPlaceholderText(/your name/i);
    const emailInput = screen.getByPlaceholderText(/your email/i);
    const passwordInputs = screen.getAllByPlaceholderText(/••••••••/i);
    const termsCheckbox = screen.getByLabelText(/i agree to the terms/i);
    const submitBtn = screen.getByRole('button', { name: /create account/i });

    fireEvent.change(nameInput, { target: { value: 'John Doe' } });
    fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
    fireEvent.change(passwordInputs[0], { target: { value: 'Password123!' } });
    fireEvent.change(passwordInputs[1], { target: { value: 'Password123!' } });
    fireEvent.click(termsCheckbox);

    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'Password123!',
      });
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  test('displays server error message when registration fails', async () => {
    mockRegister.mockRejectedValueOnce({ message: 'User already exists' });
    renderRegisterPage();

    const nameInput = screen.getByPlaceholderText(/your name/i);
    const emailInput = screen.getByPlaceholderText(/your email/i);
    const passwordInputs = screen.getAllByPlaceholderText(/••••••••/i);
    const termsCheckbox = screen.getByLabelText(/i agree to the terms/i);
    const submitBtn = screen.getByRole('button', { name: /create account/i });

    fireEvent.change(nameInput, { target: { value: 'John Doe' } });
    fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
    fireEvent.change(passwordInputs[0], { target: { value: 'Password123!' } });
    fireEvent.change(passwordInputs[1], { target: { value: 'Password123!' } });
    fireEvent.click(termsCheckbox);

    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('User already exists')).toBeInTheDocument();
    });

    expect(mockNavigate).not.toHaveBeenCalledWith('/dashboard');
  });
});
