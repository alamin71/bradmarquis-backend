import { string, z } from 'zod';

const booleanLike = z.preprocess((val) => {
  if (val === 'true') return true;
  if (val === 'false') return false;
  return val;
}, z.boolean());

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
    email: z.string().email('Invalid email address').optional(),
    userName: z.string().optional(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    profileImage: z.string().optional(),
    coverPhoto: z.string().optional(),
    bio: z.string().optional(),
    gender: z.string().optional(),
    dateOfBirth: z.coerce.date().optional(),
    removeCoverPhoto: booleanLike.optional(),
    removeProfileImage: booleanLike.optional(),
    name: z.string().optional(),
    contact: z.string().optional(),
    address: z.string().optional(),
    password: z.string().optional(),
  }),
});

export const UserValidation = {
  createUserZodSchema,
  updateUserZodSchema,
};
