import { z } from "zod";

export const loginValidationSchema = z.object({
  email: z
    .string()
    .email("Enter a valid email address")
    .transform((email) => email.toLowerCase()),
  password: z.string().min(8, "Password must be at least 8 characters").max(128),
});

export const registerValidationSchema = z
  .object({
    name: z.string().trim().min(2, "Name must be at least 2 characters").max(120),
    email: z
      .string()
      .email("Enter a valid email address")
      .transform((email) => email.toLowerCase()),
    password: z.string().min(8, "Password must be at least 8 characters").max(128),
    confirmPassword: z.string().min(8, "Confirm password must be at least 8 characters").max(128),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type LoginFormValues = z.infer<typeof loginValidationSchema>;
export type RegisterFormValues = z.infer<typeof registerValidationSchema>;
