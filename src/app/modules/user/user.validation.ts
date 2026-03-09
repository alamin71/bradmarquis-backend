import { string, z } from 'zod';

const optionalBooleanLike = z.preprocess((val) => {
  if (val === undefined || val === null || val === '') return undefined;

  const normalized = Array.isArray(val) ? val[0] : val;

  if (typeof normalized === 'string') {
    const asBoolean = normalized.trim().toLowerCase();
    if (asBoolean === 'true') return true;
    if (asBoolean === 'false') return false;
  }

  return normalized;
}, z.boolean().optional());

const optionalDateLike = z.preprocess((val) => {
  if (val === undefined || val === null || val === '') return undefined;

  const normalized = Array.isArray(val) ? val[0] : val;

  if (normalized instanceof Date) {
    return normalized;
  }

  if (typeof normalized === 'string' || typeof normalized === 'number') {
    const parsedDate = new Date(normalized);
    if (!Number.isNaN(parsedDate.getTime())) {
      return parsedDate;
    }
  }

  return normalized;
}, z.date().optional());

export const createUserZodSchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(2, { message: 'Name must be at least 2 characters long' })
      .nonempty({ message: 'Name is required' }),
    email: z
      .string()
      .nonempty({ message: 'Email is required' })
      .email('Invalid email address'),
    password: z
      .string()
      .min(8, { message: 'Password must be at least 8 characters long' })
      .nonempty({ message: 'Password is required' }),
    phone: string().default('').optional(),
    profile: z.string().optional(),
  }),
});

const updateUserZodSchema = z.object({
  body: z.object({
    userName: z.string().optional(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    profileImage: z.string().optional(),
    coverPhoto: z.string().optional(),
    bio: z.string().optional(),
    gender: z.string().optional(),
    dateOfBirth: optionalDateLike,
    removeCoverPhoto: optionalBooleanLike,
    removeProfileImage: optionalBooleanLike,
    name: z.string().optional(),
    contact: z.string().optional(),
    address: z.string().optional(),
    password: z.string().optional(),
  }),
});

const requestEmailChangeZodSchema = z.object({
  body: z.object({
    currentPassword: z
      .string()
      .min(1, { message: 'Current password is required' }),
    newEmail: z
      .string()
      .email('Invalid email address')
      .min(1, { message: 'New email is required' }),
  }),
});

const verifyEmailChangeZodSchema = z.object({
  body: z.object({
    otp: z.preprocess(
      (val) => Number(Array.isArray(val) ? val[0] : val),
      z.number().int().nonnegative({ message: 'OTP is required' })
    ),
  }),
});

export const UserValidation = {
  createUserZodSchema,
  updateUserZodSchema,
  requestEmailChangeZodSchema,
  verifyEmailChangeZodSchema,
};
