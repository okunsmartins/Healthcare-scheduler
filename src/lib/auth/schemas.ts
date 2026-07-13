import { z } from 'zod';

/**
 * Validation for the authentication forms. These run on the server (in the auth actions)
 * and their shapes are shared with the client forms for consistent error messaging.
 */

export const emailSchema = z
  .string()
  .trim()
  .min(1, 'Email is required')
  .email('Enter a valid email address');

/**
 * New-password rules. The 72-byte ceiling reflects bcrypt's limit (Supabase truncates
 * beyond it, which would silently change the stored password).
 */
export const newPasswordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(72, 'Password must be at most 72 characters');

export const signInSchema = z.object({
  email: emailSchema,
  // Existing passwords are validated by Supabase, so we only require non-empty here to
  // avoid rejecting accounts created under older rules.
  password: z.string().min(1, 'Password is required'),
});

export const signUpSchema = z.object({
  email: emailSchema,
  password: newPasswordSchema,
});

export const requestResetSchema = z.object({
  email: emailSchema,
});

export const updatePasswordSchema = z
  .object({
    password: newPasswordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type SignInInput = z.infer<typeof signInSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
export type RequestResetInput = z.infer<typeof requestResetSchema>;
export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>;
