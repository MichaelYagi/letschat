import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Loader2, Check, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { RegisterData } from '@/types/auth';

const registerSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be 20 characters or less')
    .regex(
      /^[a-zA-Z0-9_]+$/,
      'Username can only contain letters, numbers, and underscores'
    ),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be 128 characters or less')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/\d/, 'Password must contain at least one number')
    .regex(
      /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/,
      'Password must contain at least one special character'
    ),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
  displayName: z
    .string()
    .max(50, 'Display name must be 50 characters or less')
    .optional(),
});

const passwordStrengthRequirements = [
  { regex: /.{8,}/, text: 'At least 8 characters' },
  { regex: /[A-Z]/, text: 'One uppercase letter' },
  { regex: /[a-z]/, text: 'One lowercase letter' },
  { regex: /\d/, text: 'One number' },
  {
    regex: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/,
    text: 'One special character',
  },
];

type RegisterFormData = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const { register: registerUser, isLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const password = watch('password');
  const confirmPassword = watch('confirmPassword');

  const getPasswordStrength = () => {
    if (!password) return 0;
    const passed = passwordStrengthRequirements.filter(req =>
      req.regex.test(password)
    );
    return (passed.length / passwordStrengthRequirements.length) * 100;
  };

  const getPasswordStrengthColor = () => {
    const strength = getPasswordStrength();
    if (strength < 40) return 'bg-red-500';
    if (strength < 80) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setServerError('');
      const { confirmPassword, ...registerData } = data;
      await registerUser(registerData);
    } catch (error: any) {
      setServerError(
        error.response?.data?.error || 'Registration failed. Please try again.'
      );
    }
  };

  return (
    <div className='w-full max-w-md mx-auto'>
      <div className='text-center mb-8'>
        <h1 className='text-3xl font-bold text-gray-900 mb-2'>
          Create Account
        </h1>
        <p className='text-gray-600'>Join Let's Chat today</p>
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
            placeholder='Choose a username'
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
            htmlFor='displayName'
            className='block text-sm font-medium text-gray-700 mb-1'
          >
            Display Name (Optional)
          </label>
          <input
            id='displayName'
            type='text'
            {...register('displayName')}
            className='input-field'
            placeholder='Your display name'
            disabled={isLoading}
          />
          {errors.displayName && (
            <p className='mt-1 text-sm text-red-600'>
              {errors.displayName.message}
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
              placeholder='Create a password'
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

          {/* Password strength indicator */}
          {password && (
            <div className='mt-2 space-y-2'>
              <div className='flex items-center justify-between'>
                <span className='text-xs text-gray-600'>Password strength</span>
                <span className='text-xs text-gray-600'>
                  {Math.round(getPasswordStrength())}%
                </span>
              </div>
              <div className='w-full bg-gray-200 rounded-full h-2'>
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${getPasswordStrengthColor()}`}
                  style={{ width: `${getPasswordStrength()}%` }}
                />
              </div>
              <div className='space-y-1'>
                {passwordStrengthRequirements.map((req, index) => (
                  <div key={index} className='flex items-center text-xs'>
                    {req.regex.test(password) ? (
                      <Check size={12} className='text-green-500 mr-1' />
                    ) : (
                      <X size={12} className='text-red-500 mr-1' />
                    )}
                    <span
                      className={
                        req.regex.test(password)
                          ? 'text-green-600'
                          : 'text-gray-600'
                      }
                    >
                      {req.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {errors.password && (
            <p className='mt-1 text-sm text-red-600'>
              {errors.password.message}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor='confirmPassword'
            className='block text-sm font-medium text-gray-700 mb-1'
          >
            Confirm Password
          </label>
          <div className='relative'>
            <input
              id='confirmPassword'
              type={showConfirmPassword ? 'text' : 'password'}
              {...register('confirmPassword')}
              className='input-field pr-10'
              placeholder='Confirm your password'
              disabled={isLoading}
            />
            <button
              type='button'
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none'
              disabled={isLoading}
            >
              {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          {confirmPassword && password !== confirmPassword && (
            <p className='mt-1 text-sm text-red-600'>Passwords do not match</p>
          )}
          {errors.confirmPassword && (
            <p className='mt-1 text-sm text-red-600'>
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        {serverError && (
          <div className='bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm'>
            {serverError}
          </div>
        )}

        <button
          type='submit'
          disabled={isLoading || password !== confirmPassword}
          className='btn btn-primary w-full flex items-center justify-center'
        >
          {isLoading ? (
            <>
              <Loader2 className='animate-spin mr-2' size={20} />
              Creating account...
            </>
          ) : (
            'Create Account'
          )}
        </button>
      </form>

      <div className='mt-6 text-center'>
        <p className='text-sm text-gray-600'>
          Already have an account?{' '}
          <a
            href='/login'
            className='font-medium text-primary-600 hover:text-primary-500'
          >
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
}
