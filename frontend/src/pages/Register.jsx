import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Eye, EyeOff, UserPlus, Check, X, ShieldCheck } from 'lucide-react';
import { registerSchema } from '../validators/auth.schema';
import { useAuth } from '../hooks/useAuth';
import { Input } from '../components/ui/Input';
import { Alert } from '../components/ui/Alert';

export const Register = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [apiError, setApiError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register: registerAuth } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const passwordValue = watch('password', '');

  // Password requirements calculation
  const rules = [
    { label: 'At least 8 characters', valid: passwordValue.length >= 8 },
    { label: 'One uppercase letter', valid: /[A-Z]/.test(passwordValue) },
    { label: 'One lowercase letter', valid: /[a-z]/.test(passwordValue) },
    { label: 'One number (0-9)', valid: /\d/.test(passwordValue) },
  ];

  const onSubmit = async (data) => {
    setApiError('');
    setIsSubmitting(true);

    try {
      const result = await registerAuth({
        name: data.name,
        email: data.email,
        password: data.password,
      });

      if (result.success) {
        navigate('/dashboard', { replace: true });
      } else {
        setApiError(result.message);
      }
    } catch (err) {
      setApiError('An error occurred during registration. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-md bg-white border border-slate-200/80 shadow-sm rounded-xl p-6 sm:p-8 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 text-slate-800 mb-2">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Create an account</h1>
          <p className="text-sm text-slate-500">Sign up to get started with your workspace</p>
        </div>

        {/* API Error Alert */}
        <Alert type="error" message={apiError} onClose={() => setApiError('')} />

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <Input
            id="name"
            label="Full Name"
            type="text"
            placeholder="Your Name"
            icon={User}
            error={errors.name?.message}
            {...register('name')}
          />

          <Input
            id="email"
            label="Email Address"
            type="email"
            placeholder="you@example.com"
            icon={Mail}
            error={errors.email?.message}
            {...register('email')}
          />

          <Input
            id="password"
            label="Password"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            icon={Lock}
            error={errors.password?.message}
            rightElement={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-slate-400 hover:text-slate-600 focus:outline-none transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            }
            {...register('password')}
          />

          {/* Password Requirements Helper Checklist */}
          {passwordValue && (
            <div className="bg-slate-50 border border-slate-200/60 p-3 rounded-lg text-xs space-y-1.5">
              <p className="font-semibold text-slate-700">Password requirements:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {rules.map((rule, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center gap-1.5 ${
                      rule.valid ? 'text-emerald-700 font-medium' : 'text-slate-400'
                    }`}
                  >
                    {rule.valid ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                    ) : (
                      <X className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
                    )}
                    <span>{rule.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Input
            id="confirmPassword"
            label="Confirm Password"
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder="••••••••"
            icon={Lock}
            error={errors.confirmPassword?.message}
            rightElement={
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="text-slate-400 hover:text-slate-600 focus:outline-none transition-colors"
                tabIndex={-1}
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            }
            {...register('confirmPassword')}
          />

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full btn-primary mt-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Creating Account...</span>
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                <span>Create Account</span>
              </>
            )}
          </button>
        </form>

        {/* Footer Link */}
        <div className="pt-4 border-t border-slate-100 text-center text-sm text-slate-600">
          Already have an account?{' '}
          <Link
            to="/login"
            className="font-semibold text-slate-900 hover:underline transition-all"
          >
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
};
