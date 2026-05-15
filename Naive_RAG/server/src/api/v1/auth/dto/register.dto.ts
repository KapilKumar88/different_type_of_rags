import { z } from 'zod';

export const registerSchema = z
  .object({
    name: z.string().trim().min(2).max(120),
    email: z.email().transform((email) => email.toLowerCase()),
    password: z.string().min(8).max(128),
    confirmPassword: z.string().min(8).max(128),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type RegisterDto = z.infer<typeof registerSchema>;
