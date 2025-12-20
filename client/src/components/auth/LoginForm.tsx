import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { LoginCredentials } from '@/types/auth';

const loginSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().default(false),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginForm() {
  const { login, isLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      rememberMe: false,
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setServerError('');
      await login(data);
    } catch (error: any) {
      setServerError(
        error.response?.data?.error || 'Login failed. Please try again.'
      );
    }
  };

  return (
    <div className='w-full max-w-md mx-auto'>
      <div className='text-center mb-8'>
        <h1 className='text-3xl font-bold text-gray-900 mb-2'>Welcome Back</h1>
        <p className='text-gray-600'>Sign in to your account</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className='space-y-6'>
        <div>
          <label
            htmlFor='username'
            className='block text-sm font-medium text-gray-700 mb-1'
          >
            Username
          </label>
          <input
            id='username'
            type='text'
            {...register('username')}
            className='input-field'
            placeholder='Enter your username'
            disabled={isLoading}
          />
          {errors.username && (
            <p className='mt-1 text-sm text-red-600'>
              {errors.username.message}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor='password'
            className='block text-sm font-medium text-gray-700 mb-1'
          >
            Password
          </label>
          <div className='relative'>
            <input
              id='password'
              type={showPassword ? 'text' : 'password'}
              {...register('password')}
              className='input-field pr-10'
              placeholder='Enter your password'
              disabled={isLoading}
            />
            <button
              type='button'
              onClick={() => setShowPassword(!showPassword)}
              className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none'
              disabled={isLoading}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          {errors.password && (
            <p className='mt-1 text-sm text-red-600'>
              {errors.password.message}
            </p>
          )}
        </div>

        <div className='flex items-center'>
          <input
            id='rememberMe'
            type='checkbox'
            {...register('rememberMe')}
            className='h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded'
            disabled={isLoading}
          />
          <label
            htmlFor='rememberMe'
            className='ml-2 block text-sm text-gray-900'
          >
            Remember me
          </label>
        </div>

        {serverError && (
          <div className='bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm'>
            {serverError}
          </div>
        )}

        <button
          type='submit'
          disabled={isLoading}
          className='btn btn-primary w-full flex items-center justify-center'
        >
          {isLoading ? (
            <>
              <Loader2 className='animate-spin mr-2' size={20} />
              Signing in...
            </>
          ) : (
            'Sign In'
          )}
        </button>
      </form>

      <div className='mt-6 text-center'>
        <p className='text-sm text-gray-600'>
          Don't have an account?{' '}
          <a
            href='/register'
            className='font-medium text-primary-600 hover:text-primary-500'
          >
            Sign up
          </a>
        </p>
      </div>
    </div>
  );
}
