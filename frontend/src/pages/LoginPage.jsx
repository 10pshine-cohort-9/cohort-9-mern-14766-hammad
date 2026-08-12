import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { loginSchema } from '../validators/authSchema';
import { useAuth } from '../context/AuthContext';
import FormInput from '../components/FormInput';

const LoginPage = () => {
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
          <FormInput
            label="Email address"
            type="email"
            placeholder="Your Email"
            register={register('email')}
            error={errors.email}
          />

          <FormInput
            label="Password"
            type="password"
            placeholder="••••••••"
            register={register('password')}
            error={errors.password}
          />

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
