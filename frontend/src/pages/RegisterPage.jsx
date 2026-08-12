import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { registerSchema } from '../validators/authSchema';
import { useAuth } from '../context/AuthContext';

const RegisterPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [serverError, setServerError] = useState('');
  const { register: registerAuth } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      agreeTerms: false,
    },
  });

  const onSubmit = async (data) => {
    try {
      setServerError('');
      await registerAuth({
        name: data.name,
        email: data.email,
        password: data.password,
      });
      navigate('/dashboard');
    } catch (err) {
      setServerError(err.message || 'Failed to create account. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-xl shadow-sm p-6 sm:p-8">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-slate-900">Notes App</h1>
          <p className="text-sm text-slate-500 mt-1">Create a new account</p>
        </div>

        {serverError && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Full name</label>
            <input
              type="text"
              placeholder="Your Name"
              {...register('name')}
              className={`w-full px-3 py-2 bg-white border ${
                errors.name ? 'border-red-500' : 'border-slate-300'
              } rounded-md text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
            />
            {errors.name && (
              <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>
            )}
          </div>

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
            <label className="block text-xs font-medium text-slate-700 mb-1">Password</label>
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
            <p className="mt-1 text-[11px] text-slate-400">
              At least 8 characters with 1 uppercase, 1 lowercase & 1 number
            </p>
            {errors.password && (
              <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Confirm password</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="••••••••"
                {...register('confirmPassword')}
                className={`w-full px-3 py-2 bg-white border ${
                  errors.confirmPassword ? 'border-red-500' : 'border-slate-300'
                } rounded-md text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-2.5 text-xs text-slate-500 hover:text-slate-700"
              >
                {showConfirmPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="mt-1 text-xs text-red-600">{errors.confirmPassword.message}</p>
            )}
          </div>

          <div className="flex items-start">
            <input
              type="checkbox"
              id="agreeTerms"
              {...register('agreeTerms')}
              className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 mr-2"
            />
            <label htmlFor="agreeTerms" className="text-xs text-slate-600 cursor-pointer">
              I agree to the terms and privacy policy
            </label>
          </div>
          {errors.agreeTerms && (
            <p className="text-xs text-red-600">{errors.agreeTerms.message}</p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-md shadow-sm transition-colors disabled:opacity-60"
          >
            {isSubmitting ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-slate-500 border-t border-slate-100 pt-4">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-600 hover:underline font-medium">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
