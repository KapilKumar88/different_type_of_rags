import { z } from 'zod';

export const loginSchema = z.object({
  email: z.email().transform((email) => email.toLowerCase()),
  password: z.string().min(8).max(128),
});

export type LoginDto = z.infer<typeof loginSchema>;
