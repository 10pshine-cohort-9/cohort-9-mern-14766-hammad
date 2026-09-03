import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from '../components/routes/ProtectedRoute';
import { PublicRoute } from '../components/routes/PublicRoute';
import { AuthContext } from '../context/AuthContext';

describe('Protected & Public Route Guards Component', () => {
  const renderWithRouterAndAuth = (ui, authValue, initialEntries = ['/dashboard']) => {
    return render(
      <MemoryRouter initialEntries={initialEntries}>
        <AuthContext.Provider value={authValue}>
          {ui}
        </AuthContext.Provider>
      </MemoryRouter>
    );
  };

  describe('ProtectedRoute Guard', () => {
    it('renders loading spinner when auth loading is true', () => {
      const authValue = { isAuthenticated: false, loading: true };

      renderWithRouterAndAuth(
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<div>Protected Dashboard Content</div>} />
          </Route>
        </Routes>,
        authValue,
        ['/dashboard']
      );

      expect(screen.getByText('Checking authentication...')).toBeInTheDocument();
      expect(screen.queryByText('Protected Dashboard Content')).not.toBeInTheDocument();
    });

    it('redirects unauthenticated user to /login', () => {
      const authValue = { isAuthenticated: false, loading: false };

      renderWithRouterAndAuth(
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<div>Protected Dashboard Content</div>} />
          </Route>
          <Route path="/login" element={<div>Login Page Screen</div>} />
        </Routes>,
        authValue,
        ['/dashboard']
      );

      expect(screen.getByText('Login Page Screen')).toBeInTheDocument();
      expect(screen.queryByText('Protected Dashboard Content')).not.toBeInTheDocument();
    });

    it('renders protected content when user is authenticated', () => {
      const authValue = { isAuthenticated: true, loading: false };

      renderWithRouterAndAuth(
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<div>Protected Dashboard Content</div>} />
          </Route>
        </Routes>,
        authValue,
        ['/dashboard']
      );

      expect(screen.getByText('Protected Dashboard Content')).toBeInTheDocument();
    });
  });

  describe('PublicRoute Guard', () => {
    it('renders loading spinner when auth loading is true', () => {
      const authValue = { isAuthenticated: false, loading: true };

      renderWithRouterAndAuth(
        <Routes>
          <Route element={<PublicRoute />}>
            <Route path="/login" element={<div>Public Login Screen</div>} />
          </Route>
        </Routes>,
        authValue,
        ['/login']
      );

      expect(screen.getByText('Loading...')).toBeInTheDocument();
      expect(screen.queryByText('Public Login Screen')).not.toBeInTheDocument();
    });

    it('renders public page content when user is NOT authenticated', () => {
      const authValue = { isAuthenticated: false, loading: false };

      renderWithRouterAndAuth(
        <Routes>
          <Route element={<PublicRoute />}>
            <Route path="/login" element={<div>Public Login Screen</div>} />
          </Route>
        </Routes>,
        authValue,
        ['/login']
      );

      expect(screen.getByText('Public Login Screen')).toBeInTheDocument();
    });

    it('redirects authenticated user away from public route to /dashboard', () => {
      const authValue = { isAuthenticated: true, loading: false };

      renderWithRouterAndAuth(
        <Routes>
          <Route element={<PublicRoute />}>
            <Route path="/login" element={<div>Public Login Screen</div>} />
          </Route>
          <Route path="/dashboard" element={<div>Protected Dashboard Content</div>} />
        </Routes>,
        authValue,
        ['/login']
      );

      expect(screen.getByText('Protected Dashboard Content')).toBeInTheDocument();
      expect(screen.queryByText('Public Login Screen')).not.toBeInTheDocument();
    });
  });
});
