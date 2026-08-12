import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute';
import PublicRoute from '../components/PublicRoute';
import { useAuth } from '../context/AuthContext';

jest.mock('../context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

describe('Protected and Public Route Guards', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('ProtectedRoute Component', () => {
    test('renders loading spinner when auth loading is true', () => {
      useAuth.mockReturnValue({
        loading: true,
        isAuthenticated: false,
      });

      render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <Routes>
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<div>Protected Dashboard Content</div>} />
            </Route>
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByText('Loading...')).toBeInTheDocument();
      expect(screen.queryByText('Protected Dashboard Content')).not.toBeInTheDocument();
    });

    test('redirects unauthenticated user from protected route to /login', () => {
      useAuth.mockReturnValue({
        loading: false,
        isAuthenticated: false,
      });

      render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <Routes>
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<div>Protected Dashboard Content</div>} />
            </Route>
            <Route path="/login" element={<div>Login Page Target</div>} />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.queryByText('Protected Dashboard Content')).not.toBeInTheDocument();
      expect(screen.getByText('Login Page Target')).toBeInTheDocument();
    });

    test('allows authenticated user to access protected route content', () => {
      useAuth.mockReturnValue({
        loading: false,
        isAuthenticated: true,
        user: { id: '1', name: 'John Doe' },
      });

      render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <Routes>
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<div>Protected Dashboard Content</div>} />
            </Route>
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByText('Protected Dashboard Content')).toBeInTheDocument();
    });
  });

  describe('PublicRoute Component', () => {
    test('renders loading spinner when auth loading is true', () => {
      useAuth.mockReturnValue({
        loading: true,
        isAuthenticated: false,
      });

      render(
        <MemoryRouter initialEntries={['/login']}>
          <Routes>
            <Route element={<PublicRoute />}>
              <Route path="/login" element={<div>Login Form Content</div>} />
            </Route>
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByText('Loading...')).toBeInTheDocument();
      expect(screen.queryByText('Login Form Content')).not.toBeInTheDocument();
    });

    test('redirects authenticated user from /login to /dashboard', () => {
      useAuth.mockReturnValue({
        loading: false,
        isAuthenticated: true,
      });

      render(
        <MemoryRouter initialEntries={['/login']}>
          <Routes>
            <Route element={<PublicRoute />}>
              <Route path="/login" element={<div>Login Form Content</div>} />
            </Route>
            <Route path="/dashboard" element={<div>Dashboard Target</div>} />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.queryByText('Login Form Content')).not.toBeInTheDocument();
      expect(screen.getByText('Dashboard Target')).toBeInTheDocument();
    });

    test('allows unauthenticated user to access public route content', () => {
      useAuth.mockReturnValue({
        loading: false,
        isAuthenticated: false,
      });

      render(
        <MemoryRouter initialEntries={['/login']}>
          <Routes>
            <Route element={<PublicRoute />}>
              <Route path="/login" element={<div>Login Form Content</div>} />
            </Route>
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByText('Login Form Content')).toBeInTheDocument();
    });
  });
});
