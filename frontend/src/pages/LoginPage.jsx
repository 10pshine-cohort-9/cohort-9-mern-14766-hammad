import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { loginSchema } from '../validators/authSchema';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  const onSubmit = async (data) => {
    try {
      setServerError('');
      await login({ email: data.email, password: data.password });
      navigate('/dashboard');
    } catch (err) {
      setServerError(err.message || 'Invalid email or password');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-xl shadow-sm p-6 sm:p-8">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-slate-900">Notes App</h1>
          <p className="text-sm text-slate-500 mt-1">Sign in to your account</p>
        </div>

        {serverError && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Email address</label>
            <input
              type="email"
              placeholder="Your Email"
              {...register('email')}
              className={`w-full px-3 py-2 bg-white border ${
                errors.email ? 'border-red-500' : 'border-slate-300'
              } rounded-md text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
            />
            {errors.email && (
              <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-medium text-slate-700">Password</label>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                {...register('password')}
                className={`w-full px-3 py-2 bg-white border ${
                  errors.password ? 'border-red-500' : 'border-slate-300'
                } rounded-md text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-xs text-slate-500 hover:text-slate-700"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
            )}
          </div>

          <div className="flex items-center justify-between text-xs">
            <label className="flex items-center text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                {...register('rememberMe')}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 mr-2"
              />
              Remember me
            </label>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-md shadow-sm transition-colors disabled:opacity-60"
          >
            {isSubmitting ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-slate-500 border-t border-slate-100 pt-4">
          Don't have an account?{' '}
          <Link to="/register" className="text-blue-600 hover:underline font-medium">
            Register here
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
