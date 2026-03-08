import { z } from 'zod';

const otpBodySchema = z.object({
  otp: z.preprocess(
    (val) => Number(val),
    z
      .number()
      .int()
      .min(100000, { message: 'OTP must be a 6-digit number' })
      .max(999999, { message: 'OTP must be a 6-digit number' })
  ),
});

const createSignupZodSchema = z.object({
  body: z.object({
    firstName: z.string().nonempty({ message: 'First name is required' }),
    lastName: z.string().nonempty({ message: 'Last name is required' }),
    userName: z
      .string()
      .min(3, { message: 'Username must be at least 3 characters' })
      .nonempty({ message: 'Username is required' }),
    email: z.string().email({ message: 'Invalid email address' }),
    password: z
      .string()
      .min(8, { message: 'Password must be at least 8 characters' }),
  }),
});

const createLoginZodSchema = z.object({
  body: z
    .object({
      email: z.string().optional(),
      userName: z.string().optional(),
      emailOrUsername: z.string().optional(),
      password: z.string().nonempty({ message: 'Password is required' }),
    })
    .refine(
      (data) =>
        Boolean(data.email?.trim()) ||
        Boolean(data.userName?.trim()) ||
        Boolean(data.emailOrUsername?.trim()),
      {
        message: 'Email or username is required',
        path: ['emailOrUsername'],
      }
    ),
});

const createForgetPasswordZodSchema = z.object({
  body: z.object({
    email: z.string().nonempty({ message: 'Email is required' }),
  }),
});

const createResendOtpZodSchema = z.object({
  body: z.object({
    email: z.string().email({ message: 'Invalid email address' }).optional(),
  }),
});

const createResetPasswordZodSchema = z.object({
  body: z.object({
    newPassword: z.string().nonempty({ message: 'Password is required' }),
    confirmPassword: z
      .string()
      .nonempty({ message: 'Confirm Password is required' }),
  }),
});

const createChangePasswordZodSchema = z.object({
  body: z.object({
    currentPassword: z
      .string()
      .nonempty({ message: 'Current Password is required' }),
    newPassword: z.string().nonempty({ message: 'New Password is required' }),
    confirmPassword: z
      .string()
      .nonempty({ message: 'Confirm Password is required' }),
  }),
});

const createVerifyOtpZodSchema = z.object({
  body: otpBodySchema,
});

export const AuthValidation = {
  createSignupZodSchema,
  createForgetPasswordZodSchema,
  createResendOtpZodSchema,
  createLoginZodSchema,
  createResetPasswordZodSchema,
  createChangePasswordZodSchema,
  createVerifyOtpZodSchema,
};
